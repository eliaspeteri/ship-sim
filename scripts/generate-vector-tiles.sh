#!/bin/bash
#
# Automates the download, preprocessing, and vector tile generation for the ship simulator (WSL/Linux version)
# Requires: curl, unzip, ogr2ogr (GDAL), tippecanoe, jq (optional)
set -e

DATADIR="data"
TILESDIR="output/tiles"
STYLEDIR="styles/basic"

mkdir -p "$DATADIR" "$TILESDIR"

# Download Natural Earth coastline (1:10m)
COASTLINE_ZIP="$DATADIR/ne_10m_coastline.zip"
COASTLINE_URL="https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_coastline.zip"
if [ ! -f "$COASTLINE_ZIP" ]; then
  curl -L -o "$COASTLINE_ZIP" "$COASTLINE_URL"
fi

# Extract coastline
unzip -o "$COASTLINE_ZIP" -d "$DATADIR"
COASTLINE_SHP=$(find "$DATADIR" -name "*ne_10m_coastline.shp" | head -n 1)

# Reproject to WGS84 and convert to GeoJSON
COASTLINE_GEOJSON="$DATADIR/coastline.geojson"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$COASTLINE_GEOJSON" "$COASTLINE_SHP"

# Simplify geometry for performance (optional, adjust tolerance as needed)
COASTLINE_SIMPLE="$DATADIR/coastline_simple.geojson"
ogr2ogr -f GeoJSON -simplify 0.01 "$COASTLINE_SIMPLE" "$COASTLINE_GEOJSON"

# Generate MBTiles with Tippecanoe
MBTILES="$TILESDIR/coastlines.mbtiles"
tippecanoe -o "$MBTILES" -l ne_10m_coastline -zg --drop-densest-as-needed --coalesce-densest-as-needed "$COASTLINE_SIMPLE"

# Copy style.json if present
STYLEJSON="$STYLEDIR/style.json"
if [ -f "$STYLEJSON" ]; then
  cp "$STYLEJSON" "$TILESDIR/"
fi

echo "Vector tile generation complete. MBTiles and style.json are in $TILESDIR."
echo "You can now start the tile server with: docker-compose up -d tileserver"
