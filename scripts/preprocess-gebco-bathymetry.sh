#!/bin/bash
# filepath: scripts/preprocess-gebco-bathymetry.sh
#
# Preprocess GEBCO bathymetry GeoTIFF for web/Three.js use and package as MBTiles for tileserver-gl
# Requires: gdalwarp, gdal_translate, gdaladdo, gdalbuildvrt, gdal_calc.py, unzip
# Usage: bash scripts/preprocess-gebco-bathymetry.sh <input_zip_or_geotiff> <output_png> [--debug]
#
# This script is idempotent: it skips steps if outputs are up-to-date with the source.
set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <input_zip_or_geotiff> <output_png> [--debug]"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_PNG="$2"

# Parse arguments and debug flag
DEBUG_MODE=0
if [[ "$3" == "--debug" ]]; then
  DEBUG_MODE=1
fi

# Output directories and files
OUTPUT_MBTILES_DIR="output/tiles"
MBTILES_FILE="$OUTPUT_MBTILES_DIR/bathymetry-raster.mbtiles"
ZOOM_LEVELS="0-7"  # Adjust as needed

# Debug directory for intermediates
if [ "$DEBUG_MODE" -eq 1 ]; then
  DEBUG_DIR="output/debug"
  mkdir -p "$DEBUG_DIR"
else
  DEBUG_DIR=""
fi

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

if [ "$DEBUG_MODE" -eq 1 ]; then
  TEMP_TIF="$DEBUG_DIR/step1_resampled.tif"
else
  TEMP_TIF="${OUTPUT_PNG%.png}_resampled.tif"
fi
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
  # Check if the input file is already in EPSG:4326/WGS84 (equirectangular projection)
  # Use multiple detection methods for better reliability
  
  # Method 1: Check with gdalinfo for standard AUTHORITY tag
  EPSG_CODE=$(gdalinfo "$INPUT_TIF" | grep -i "AUTHORITY" | grep -o "EPSG\",[0-9]*" | grep -o "[0-9]*" | head -1)
  
  # Method 1b: Check for newer GDAL format with ID["EPSG",xxxx]
  if [ -z "$EPSG_CODE" ]; then
    EPSG_CODE=$(gdalinfo "$INPUT_TIF" | grep -o 'ID\["EPSG",[0-9]*\]' | grep -o '[0-9]*' | head -1)
  fi
  
  # Method 2: Try with proj4 string (if available)
  CURRENT_SRS=$(gdalinfo -proj4 "$INPUT_TIF" 2>/dev/null | grep -i proj4 | grep -o "+proj=[^ ]*" | head -1)
  
  # Method 3: Look for WGS84 mention
  WGS84_CHECK=$(gdalinfo "$INPUT_TIF" | grep -i "WGS[ _]84" | wc -l)
  
  # Method 4: Check for Geographic coordinate system indication
  GEO_CHECK=$(gdalinfo "$INPUT_TIF" | grep -i "GEOGCRS\|Geographic" | wc -l)
  
  echo "Checking projection of $INPUT_TIF:"
  echo "- EPSG code: $EPSG_CODE"
  echo "- PROJ format: $CURRENT_SRS"
  echo "- WGS84 references: $WGS84_CHECK"
  echo "- Geographic CRS: $GEO_CHECK"
  
  # Determine if it's already in equirectangular projection (EPSG:4326/WGS84)
  if [[ "$EPSG_CODE" == "4326" || "$CURRENT_SRS" == "+proj=longlat" || "$CURRENT_SRS" == "+proj=latlong" || "$WGS84_CHECK" -gt 0 || "$GEO_CHECK" -gt 0 ]]; then
    echo "Input file is already in equirectangular projection (WGS84). Copying without reprojection..."
    # Copy the file without reprojection, but ensure correct georeferencing
    # Add explicit extent parameters to ensure proper alignment
    gdal_translate \
      -a_srs EPSG:4326 \
      -a_ullr -180 90 180 -90 \
      -co "TILED=YES" \
      "$INPUT_TIF" "$TEMP_TIF"
  else
    echo "Reprojecting $INPUT_TIF to equirectangular projection (EPSG:4326)..."
    # Only reproject if the file isn't already in equirectangular projection
    gdalwarp -t_srs EPSG:4326 \
      -te -180 -90 180 90 \
      -tr 0.087890625 0.087890625 \
      -tap \
      -r bilinear \
      -wo SOURCE_EXTRA=1000 \
      -wo SAMPLE_GRID=YES \
      -multi \
      "$INPUT_TIF" "$TEMP_TIF"
  fi
  echo "$INPUT_TIF" > "$LAST_INPUT_FILE"
  
  # Add debug info to help diagnose projection issues
  echo "Verification of output file projection and extent:"
  gdalinfo "$TEMP_TIF" | grep -E 'Size|Coordinate|PROJ|AUTHORITY|Corner|Upper|Lower'
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
  if [ "$DEBUG_MODE" -eq 1 ]; then
    GEOREF_TIF="$DEBUG_DIR/step4_merged_geo.tif"
    OCEAN_TIF="$DEBUG_DIR/step2_ocean.tif"
    LAND_TIF="$DEBUG_DIR/step3_land.tif"
  else
    GEOREF_TIF="${TEMP_TIF%.tif}_geo.tif"
    OCEAN_TIF="${TEMP_TIF%.tif}_ocean.tif"
    LAND_TIF="${TEMP_TIF%.tif}_land.tif"
  fi
  
  echo "Creating georeferenced GeoTIFF..."
  # Create two temporary files for ocean depths and land elevations
  echo "Processing ocean depths..."
  # Extract and scale ocean depths (-10000m to 0m) to grayscale values (0-192)
  gdal_translate \
    -a_srs EPSG:4326 \
    -a_ullr -180 90 180 -90 \
    -ot Byte \
    -scale -10000 0 0 192 \
    "$TEMP_TIF" "$OCEAN_TIF"
  
  echo "Processing land elevations..."
  # Extract and scale land elevations (0m to 8000m) to brighter values (192-255)
  gdal_translate \
    -a_srs EPSG:4326 \
    -a_ullr -180 90 180 -90 \
    -ot Byte \
    -scale 0 8000 192 255 \
    "$TEMP_TIF" "$LAND_TIF"
    
  echo "Merging ocean and land into single heightmap..."
  # Create a merged result by using a mask
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
  if [ "$DEBUG_MODE" -eq 0 ]; then
    rm -f "$OCEAN_TIF" "$LAND_TIF"
  fi
    
  # Then convert to MBTiles with proper coordinate system
  echo "Converting to MBTiles..."
  gdal_translate -of MBTILES \
    -co TILE_FORMAT=PNG \
    -co RESAMPLING=bilinear \
    -co ZOOM_LEVEL_STRATEGY=LOWER \
    -co MINZOOM=0 \
    -co MAXZOOM=8 \
    -co METADATA="{\"name\":\"bathymetry\",\"description\":\"Bathymetry data\",\"format\":\"png\",\"version\":\"1.1\"}" \
    "$GEOREF_TIF" "$MBTILES_FILE"
    
  # Clean up intermediate file
  if [ "$DEBUG_MODE" -eq 0 ]; then
    rm -f "$GEOREF_TIF"
  fi
fi

# 3. Build overviews (lower zoom levels) with gdaladdo
# Only run if MBTiles was just created or updated
if [ ! -f "$MBTILES_FILE.ovr" ] || ! is_newer "$MBTILES_FILE.ovr" "$MBTILES_FILE"; then
  echo "Building overviews for $MBTILES_FILE ..."
  gdaladdo -r average "$MBTILES_FILE" 2 4 8 16 32 64 128 256 512
fi

echo "MBTiles ready: $MBTILES_FILE"

# Clean up large intermediate files
if [ "$DEBUG_MODE" -eq 0 ]; then
  if [[ -f "$TEMP_TIF" ]]; then
    echo "Cleaning up $TEMP_TIF ..."
    rm -f "$TEMP_TIF"
  fi
  if [[ -f "$UNPACK_DIR/merged_gebco.tif" ]]; then
    echo "Cleaning up $UNPACK_DIR/merged_gebco.tif ..."
    rm -f "$UNPACK_DIR/merged_gebco.tif"
  fi
else
  echo "Debug mode enabled. Intermediate files are in $DEBUG_DIR"
fi

echo "Done. MBTiles: $MBTILES_FILE"
