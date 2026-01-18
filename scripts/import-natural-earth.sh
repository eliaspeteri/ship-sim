#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-ship-sim-db-1}"  # <-- set this if your container name differs
DB_NAME="${POSTGRES_DB:-shipsim}"
DB_USER="${POSTGRES_USER:-ship}"

# Your mounted path inside GDAL container (per compose: ./data/raw -> /data)
LAND_SHP="/data/ne_10m_land.shp"
LAKES_SHP="/data/ne_10m_lakes.shp"

if [ ! -f "$LAND_SHP" ]; then
  echo "ERROR: Missing $LAND_SHP"
  echo "Expected host file at: data/raw/ne_10m_land.shp"
  exit 1
fi

echo "Importing land with ogr2ogr..."
ogr2ogr -f "PostgreSQL" \
  "PG:host=db port=5432 dbname=$DB_NAME user=$DB_USER password=${POSTGRES_PASSWORD:-password}" \
  "$LAND_SHP" \
  -nln ne_land_10m \
  -lco GEOMETRY_NAME=geom \
  -lco FID=gid \
  -nlt MULTIPOLYGON \
  -overwrite

if [ -f "$LAKES_SHP" ]; then
  echo "Importing lakes with ogr2ogr..."
  ogr2ogr -f "PostgreSQL" \
    "PG:host=db port=5432 dbname=$DB_NAME user=$DB_USER password=${POSTGRES_PASSWORD:-password}" \
    "$LAKES_SHP" \
    -nln ne_lakes_10m \
    -lco GEOMETRY_NAME=geom \
    -lco FID=gid \
    -nlt MULTIPOLYGON \
    -overwrite
else
  echo "NOTE: lakes shapefile not found at $LAKES_SHP (skipping)."
fi

echo "Running SQL (index/simplify/function) inside Postgres container..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
ALTER TABLE ne_land_10m
  ALTER COLUMN geom TYPE geometry(MultiPolygon, 4326)
  USING ST_SetSRID(geom, 4326);

CREATE INDEX IF NOT EXISTS ne_land_10m_geom_gix ON ne_land_10m USING GIST (geom);
ANALYZE ne_land_10m;

DROP TABLE IF EXISTS ne_land_10m_simpl_3857;
CREATE TABLE ne_land_10m_simpl_3857 AS
SELECT
  gid,
  ST_SimplifyPreserveTopology(ST_Transform(geom, 3857), 2000) AS geom
FROM ne_land_10m;

CREATE INDEX IF NOT EXISTS ne_land_10m_simpl_3857_geom_gix ON ne_land_10m_simpl_3857 USING GIST (geom);
ANALYZE ne_land_10m_simpl_3857;

CREATE OR REPLACE FUNCTION land_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE sql
STABLE
AS $$
WITH
bounds AS (
  SELECT ST_TileEnvelope(z, x, y) AS geom
),
mvtgeom AS (
  SELECT
    gid,
    ST_AsMVTGeom(
      l.geom,
      bounds.geom,
      4096,
      64,
      true
    ) AS geom
  FROM ne_land_10m_simpl_3857 l, bounds
  WHERE l.geom && bounds.geom
)
SELECT ST_AsMVT(mvtgeom, 'land', 4096, 'geom');
$$;
SQL

echo "Done."
