#!/bin/bash
# filepath: scripts/preprocess-gebco-bathymetry.sh
#
# Preprocess GEBCO bathymetry GeoTIFF for web/Three.js use
# Requires: gdalwarp, gdal_translate, gdal_merge.py, gdal2tiles.py, unzip
# Usage: bash scripts/preprocess-gebco-bathymetry.sh <input_zip_or_geotiff> <output_png>
set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input_zip_or_geotiff> <output_png>"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_PNG="$2"

# If input is a zip, unpack it to get the GeoTIFF
if [[ "$INPUT_FILE" == *.zip ]]; then
  ZIP_BASENAME=$(basename "$INPUT_FILE" .zip)
  UNPACK_DIR="$(dirname "$INPUT_FILE")/$ZIP_BASENAME"
  mkdir -p "$UNPACK_DIR"
  if ! ls "$UNPACK_DIR"/*.tif 1> /dev/null 2>&1; then
    echo "Unzipping $INPUT_FILE to $UNPACK_DIR ..."
    unzip -o "$INPUT_FILE" -d "$UNPACK_DIR"
  else
    echo "GeoTIFF already unpacked in $UNPACK_DIR. Skipping unzip."
  fi
  # Find all .tif files
  TIF_FILES=("$UNPACK_DIR"/*.tif)
  if [ ${#TIF_FILES[@]} -eq 0 ]; then
    echo "Error: No GeoTIFF found in $UNPACK_DIR after unzip."
    exit 1
  fi
  if [ ${#TIF_FILES[@]} -eq 1 ]; then
    INPUT_TIF="${TIF_FILES[0]}"
  else
    # Merge all .tif files into one
    MERGED_TIF="$UNPACK_DIR/merged_gebco.tif"
    if [ ! -f "$MERGED_TIF" ]; then
      echo "Merging ${#TIF_FILES[@]} GeoTIFFs into $MERGED_TIF ..."
      gdal_merge.py -o "$MERGED_TIF" "${TIF_FILES[@]}"
    else
      echo "Merged GeoTIFF already exists at $MERGED_TIF. Skipping merge."
    fi
    INPUT_TIF="$MERGED_TIF"
  fi
else
  INPUT_TIF="$INPUT_FILE"
fi

TEMP_TIF="${OUTPUT_PNG%.png}_resampled.tif"

# 1. Reproject and resize to 4096x2048, output as GeoTIFF
echo "Reprojecting and resizing $INPUT_TIF to $TEMP_TIF ..."
gdalwarp -t_srs EPSG:4326 -ts 4096 2048 -r bilinear "$INPUT_TIF" "$TEMP_TIF"

# 2. Normalize and export as 8-bit PNG (ocean negative, land positive/zero)
echo "Normalizing and exporting $TEMP_TIF to $OUTPUT_PNG ..."
gdal_translate -ot Byte -scale -10000 8000 0 255 -of PNG "$TEMP_TIF" "$OUTPUT_PNG"

# 3. Tile the merged GeoTIFF for LOD/performance
TILE_DIR="$(dirname "$OUTPUT_PNG")/tiles/bathymetry"
ZOOM_LEVELS="0-7"  # Adjust as needed for your use case
MERGED_TIF="$INPUT_TIF"

# Only tile if not already done
if [ ! -d "$TILE_DIR" ] || [ -z "$(ls -A "$TILE_DIR" 2>/dev/null)" ]; then
  echo "Tiling $MERGED_TIF into $TILE_DIR at zoom levels $ZOOM_LEVELS ..."
  mkdir -p "$TILE_DIR"
  gdal2tiles.py -z $ZOOM_LEVELS -w none "$MERGED_TIF" "$TILE_DIR"
else
  echo "Tiles already exist in $TILE_DIR. Skipping tiling."
fi

echo "Tiling complete. Tiles are in $TILE_DIR."

echo "Done. Output PNG: $OUTPUT_PNG"
