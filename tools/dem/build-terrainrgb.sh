#!/usr/bin/env bash
set -euo pipefail

RAW_DIR="${RAW_DIR:-/data/raw}"
WORK_DIR="${WORK_DIR:-/data/work}"
OUT_DIR="${OUT_DIR:-/data/out}"

MIN_Z="${MIN_Z:-6}"
MAX_Z="${MAX_Z:-12}"
JOBS="${JOBS:-8}"

# Optional clip (WGS84 degrees). If empty, processes full mosaic.
CLIP_WGS84="${CLIP_WGS84:-}"  # "west south east north" e.g. "19 59 27 62"

mkdir -p "$WORK_DIR" "$OUT_DIR"

echo "Building VRT from $RAW_DIR ..."
gdalbuildvrt -overwrite "$WORK_DIR/dem.vrt" "$RAW_DIR"/*.tif

# Warp to EPSG:3857 (Web Mercator)
# Use bilinear for smoother terrain; keep it tiled + compressed.
echo "Warping to EPSG:3857 ..."
if [[ -n "$CLIP_WGS84" ]]; then
  # Convert WGS84 clip bounds to 3857 with gdaltransform
  read -r W S E N <<< "$CLIP_WGS84"
  SW_3857=$(echo "$W $S" | gdaltransform -s_srs EPSG:4326 -t_srs EPSG:3857 | head -n1)
  NE_3857=$(echo "$E $N" | gdaltransform -s_srs EPSG:4326 -t_srs EPSG:3857 | head -n1)
  MINX=$(echo "$SW_3857" | awk '{print $1}')
  MINY=$(echo "$SW_3857" | awk '{print $2}')
  MAXX=$(echo "$NE_3857" | awk '{print $1}')
  MAXY=$(echo "$NE_3857" | awk '{print $2}')

  gdalwarp \
    -t_srs EPSG:3857 \
    -r bilinear \
    -te "$MINX" "$MINY" "$MAXX" "$MAXY" \
    -of GTiff \
    -co TILED=YES -co COMPRESS=DEFLATE -co PREDICTOR=2 \
    "$WORK_DIR/dem.vrt" \
    "$WORK_DIR/dem_3857.tif"
else
  gdalwarp \
    -t_srs EPSG:3857 \
    -r bilinear \
    -of GTiff \
    -co TILED=YES -co COMPRESS=DEFLATE -co PREDICTOR=2 \
    "$WORK_DIR/dem.vrt" \
    "$WORK_DIR/dem_3857.tif"
fi

# Encode to Terrain-RGB using base=-10000 increment=0.1 (Mapbox convention)
# This is rio rgbify’s standard usage :contentReference[oaicite:1]{index=1}
echo "Encoding Terrain-RGB ..."
rio rgbify \
  -b -10000 \
  -i 0.1 \
  "$WORK_DIR/dem_3857.tif" \
  "$WORK_DIR/dem_3857_rgb.tif"

# Cut into a tile pyramid.
# gdal2tiles will output XYZ by default in recent GDAL; we’ll enforce XYZ layout by using --xyz
echo "Tiling to XYZ $MIN_Z-$MAX_Z ..."
gdal2tiles.py \
  --zoom="${MIN_Z}-${MAX_Z}" \
  --processes="${JOBS}" \
  --xyz \
  "$WORK_DIR/dem_3857_rgb.tif" \
  "$OUT_DIR"

echo "Done. Tiles in $OUT_DIR (z/x/y.png)"
