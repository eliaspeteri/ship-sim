BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure SRID/type is correct and consistent
ALTER TABLE IF EXISTS public.ne_land_10m
  ALTER COLUMN geom TYPE geometry(MultiPolygon, 4326)
  USING ST_Multi(ST_SetSRID(public.ne_land_10m.geom, 4326));

CREATE INDEX IF NOT EXISTS ne_land_10m_geom_gix
  ON public.ne_land_10m USING GIST (geom);

ANALYZE public.ne_land_10m;

-- Create MVT function
CREATE OR REPLACE FUNCTION public.land_mvt(z integer, x integer, y integer)
RETURNS bytea
LANGUAGE sql
STABLE
AS $$
WITH
bounds AS (
  SELECT ST_TileEnvelope(z, x, y) AS env_3857
),
bounds4326 AS (
  SELECT ST_Transform(bounds.env_3857, 4326) AS env_4326
  FROM bounds
),
mvtgeom AS (
  SELECT
    l.gid,
    ST_AsMVTGeom(
      l.geom,
      b.env_4326,
      4096,
      64,
      true
    ) AS geom
  FROM public.ne_land_10m AS l
  CROSS JOIN bounds4326 AS b
  WHERE l.geom && b.env_4326
)
SELECT ST_AsMVT(mvtgeom_row, 'land', 4096, 'geom')
FROM (
  SELECT gid, geom
  FROM mvtgeom
) AS mvtgeom_row;
$$;

COMMIT;
