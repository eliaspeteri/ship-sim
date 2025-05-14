#!/bin/bash
# filepath: scripts/preprocess-gebco-bathymetry.sh
#
# Preprocess GEBCO bathymetry GeoTIFF for web/Three.js use and package as MBTiles for tileserver-gl
# Requires: gdalwarp, gdal_translate, gdaladdo, gdalbuildvrt, gdal_calc.py, unzip
# Usage: bash scripts/preprocess-gebco-bathymetry.sh <input_zip_or_geotiff> <output_png>
#
# This script is idempotent: it skips steps if outputs are up-to-date with the source.
set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input_zip_or_geotiff> <output_png>"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_PNG="$2"

# Output directories and files
OUTPUT_MBTILES_DIR="output/tiles"
MBTILES_FILE="$OUTPUT_MBTILES_DIR/bathymetry-raster.mbtiles"
ZOOM_LEVELS="0-7"  # Adjust as needed

# Helper: check if file A is newer than file B
is_newer() {
  [ "$1" -nt "$2" ]
}

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
    # Create a VRT (virtual raster) instead of merging
    VRT_FILE="$UNPACK_DIR/gebco.vrt"
    echo "Building VRT $VRT_FILE from ${#TIF_FILES[@]} GeoTIFFs ..."
    gdalbuildvrt "$VRT_FILE" "${TIF_FILES[@]}"
    INPUT_TIF="$VRT_FILE"
  fi
else
  INPUT_TIF="$INPUT_FILE"
fi

TEMP_TIF="${OUTPUT_PNG%.png}_resampled.tif"
LAST_INPUT_FILE="${TEMP_TIF}.last_input"

# Early exit if MBTiles is up-to-date with input
if [ -f "$MBTILES_FILE" ] && is_newer "$MBTILES_FILE" "$INPUT_TIF"; then
  echo "MBTiles $MBTILES_FILE is up-to-date. Nothing to do."
  exit 0
fi

# 1. Reproject and resize to 4096x2048, output as GeoTIFF
REPROJECT_NEEDED=1
if [ -f "$TEMP_TIF" ] && [ -f "$LAST_INPUT_FILE" ]; then
  LAST_INPUT_PATH=$(cat "$LAST_INPUT_FILE")
  if [ "$LAST_INPUT_PATH" = "$INPUT_TIF" ] && is_newer "$TEMP_TIF" "$INPUT_TIF"; then
    REPROJECT_NEEDED=0
  fi
fi
if [ $REPROJECT_NEEDED -eq 0 ]; then
  echo "$TEMP_TIF already exists and is up-to-date for $INPUT_TIF. Skipping reprojection."
else
  echo "Reprojecting and resizing $INPUT_TIF to $TEMP_TIF ..."
  # Explicitly set the extent to cover the entire globe in equirectangular coordinates
  # Calculate resolution based on target size
  # 360° / 4096px ≈ 0.087890625° per pixel for longitude
  # 180° / 2048px ≈ 0.087890625° per pixel for latitude (same resolution)
  gdalwarp -t_srs EPSG:4326 \
    -te -180 -90 180 90 \
    -tr 0.087890625 0.087890625 \
    -tap \
    -r bilinear \
    -wo SOURCE_EXTRA=1000 \
    -wo SAMPLE_GRID=YES \
    -multi \
    "$INPUT_TIF" "$TEMP_TIF"
  echo "$INPUT_TIF" > "$LAST_INPUT_FILE"
fi

# 2. Convert the resampled GeoTIFF (TEMP_TIF) to MBTiles using gdal_translate
if [ -f "$MBTILES_FILE" ] && is_newer "$MBTILES_FILE" "$TEMP_TIF"; then
  echo "$MBTILES_FILE already exists and is up-to-date. Skipping MBTiles conversion."
else
  echo "Converting $TEMP_TIF to MBTiles $MBTILES_FILE ..."
  mkdir -p "$OUTPUT_MBTILES_DIR"
  
  # Enhanced version: scales ocean depths (-10000m to 0m) to grayscale values (0-192)
  # and land elevations (0m to 8000m) to brighter values (192-255)
  # This provides better detail for underwater topography while preserving land features
  
  # First, create a properly georeferenced GeoTIFF
  GEOREF_TIF="${TEMP_TIF%.tif}_geo.tif"
  echo "Creating georeferenced GeoTIFF..."
  # Create two temporary files for ocean depths and land elevations
  OCEAN_TIF="${TEMP_TIF%.tif}_ocean.tif"
  LAND_TIF="${TEMP_TIF%.tif}_land.tif"
  
  echo "Processing ocean depths..."
  # Extract and scale ocean depths (-10000m to 0m) to grayscale values (0-192)
  # Using -a_ullr with correct coordinates for equirectangular projection
  # Ensuring correct extent: Left (lon) -180, Top (lat) 90, Right (lon) 180, Bottom (lat) -90
  gdal_translate \
    -a_srs EPSG:4326 \
    -a_ullr -180 90 180 -90 \
    -ot Byte \
    -scale -10000 0 0 192 \
    "$TEMP_TIF" "$OCEAN_TIF"
  
  echo "Processing land elevations..."
  # Extract and scale land elevations (0m to 8000m) to brighter values (192-255)
  # Using -a_ullr with correct coordinates for equirectangular projection
  # Ensuring correct extent: Left (lon) -180, Top (lat) 90, Right (lon) 180, Bottom (lat) -90
  gdal_translate \
    -a_srs EPSG:4326 \
    -a_ullr -180 90 180 -90 \
    -ot Byte \
    -scale 0 8000 192 255 \
    "$TEMP_TIF" "$LAND_TIF"
    
  echo "Merging ocean and land into single heightmap..."
  # Create a merged result by using a mask
  # Using the condition to blend ocean and land based on elevation value
  gdal_calc.py \
    --overwrite \
    -A "$OCEAN_TIF" \
    -B "$LAND_TIF" \
    -C "$TEMP_TIF" \
    --outfile="$GEOREF_TIF" \
    --calc="A*(C<0) + B*(C>=0)" \
    --NoDataValue=0 \
    --type=Byte
    
  # Ensure correct georeferencing on the output
  echo "Adding georeferencing to merged result..."
  gdal_edit.py -a_srs EPSG:4326 -a_ullr -180 90 180 -90 "$GEOREF_TIF"
    
  # Clean up intermediate files
  rm -f "$OCEAN_TIF" "$LAND_TIF"
    
  # Then convert to MBTiles with proper coordinate system
  echo "Converting to MBTiles..."
  gdal_translate -of MBTILES \
    -co TILE_FORMAT=PNG \
    -co RESAMPLING=bilinear \
    -co ZOOM_LEVEL_STRATEGY=AUTO \
    -co METADATA="{\"name\":\"bathymetry\",\"description\":\"Bathymetry data\",\"format\":\"png\",\"version\":\"1.1\"}" \
    "$GEOREF_TIF" "$MBTILES_FILE"
    
  # Clean up intermediate file
  rm -f "$GEOREF_TIF"
fi

# 3. Build overviews (lower zoom levels) with gdaladdo
# Only run if MBTiles was just created or updated
if [ ! -f "$MBTILES_FILE.ovr" ] || ! is_newer "$MBTILES_FILE.ovr" "$MBTILES_FILE"; then
  echo "Building overviews for $MBTILES_FILE ..."
  gdaladdo -r average "$MBTILES_FILE" 2 4 8 16
fi

echo "MBTiles ready: $MBTILES_FILE"

# Clean up large intermediate files
if [[ -f "$TEMP_TIF" ]]; then
  echo "Cleaning up $TEMP_TIF ..."
  rm -f "$TEMP_TIF"
fi
if [[ -f "$UNPACK_DIR/merged_gebco.tif" ]]; then
  echo "Cleaning up $UNPACK_DIR/merged_gebco.tif ..."
  rm -f "$UNPACK_DIR/merged_gebco.tif"
fi

echo "Done. MBTiles: $MBTILES_FILE"
