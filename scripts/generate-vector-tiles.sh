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

# Download Natural Earth bathymetry (10m)
BATHYMETRY_ZIP="$DATADIR/ne_10m_bathymetry_all.zip"
BATHYMETRY_URL="https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_bathymetry_all.zip"
if [ ! -f "$BATHYMETRY_ZIP" ]; then
  curl -L -o "$BATHYMETRY_ZIP" "$BATHYMETRY_URL"
fi

# Extract coastline (only if we haven't already extracted the files)
if [ ! -f "$DATADIR/ne_10m_coastline.shp" ]; then
  echo "Extracting coastline shapefile..."
  unzip -o "$COASTLINE_ZIP" -d "$DATADIR"
fi
COASTLINE_SHP=$(find "$DATADIR" -name "*ne_10m_coastline.shp" | head -n 1)
if [ -z "$COASTLINE_SHP" ]; then
  echo "Error: Coastline shapefile not found after extraction"
  exit 1
fi

# Extract bathymetry (only if we haven't already extracted the files)
BATHY_CHECK=$(find "$DATADIR" -name "*ne_10m_bathymetry*.shp" | wc -l)
if [ "$BATHY_CHECK" -lt 10 ]; then
  echo "Extracting bathymetry shapefiles..."
  unzip -o "$BATHYMETRY_ZIP" -d "$DATADIR"
fi
BATHYMETRY_SHPS=$(find "$DATADIR" -name "*ne_10m_bathymetry*.shp")
if [ -z "$BATHYMETRY_SHPS" ]; then
  echo "Error: Could not find bathymetry shapefiles. Check if extraction was successful."
  echo "Looking for files matching: *ne_10m_bathymetry*.shp in $DATADIR"
  ls -la "$DATADIR"
  exit 1
fi

echo "Found the following bathymetry shapefiles:"
echo "$BATHYMETRY_SHPS"

# Reproject to WGS84 and convert to GeoJSON
COASTLINE_GEOJSON="$DATADIR/coastline.geojson"
rm -f "$COASTLINE_GEOJSON"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 -overwrite "$COASTLINE_GEOJSON" "$COASTLINE_SHP"

# Simplify geometry for performance (optional, adjust tolerance as needed)
COASTLINE_SIMPLE="$DATADIR/coastline_simple.geojson"
rm -f "$COASTLINE_SIMPLE"
ogr2ogr -f GeoJSON -simplify 0.01 -overwrite "$COASTLINE_SIMPLE" "$COASTLINE_GEOJSON"

# Process bathymetry data - combine all depth contours into a single GeoJSON
# Create individual GeoJSON files for each bathymetry shapefile first, to preserve attributes
echo "Processing bathymetry shapefiles to extract depths..."
BATHYMETRY_COMBINED="$DATADIR/bathymetry_combined.geojson"
BATHYMETRY_TEMP_DIR="$DATADIR/bathymetry_temp"

# Ensure temp directory is completely clean to avoid any issues with existing files
echo "Cleaning temporary directory..."
rm -rf "$BATHYMETRY_TEMP_DIR"
mkdir -p "$BATHYMETRY_TEMP_DIR"
rm -f "$BATHYMETRY_COMBINED"

# Process each file individually to ensure depth attribute is preserved
for BATHY_FILE in $BATHYMETRY_SHPS; do
  # Extract just the filename without path and extension
  BATHY_NAME=$(basename "$BATHY_FILE" .shp)
  echo "Processing bathymetry file: $BATHY_NAME"
  
  # Extract the depth from filename (usually indicated by numbers after last _ or in format A_10000)
  DEPTH_VALUE=$(echo "$BATHY_NAME" | grep -o '[0-9]\+$' || echo "0")
  
  # If no number found, try to parse the format like "A_10000"
  if [ "$DEPTH_VALUE" = "0" ]; then
    # Check if it matches letter_number format
    if [[ "$BATHY_NAME" =~ _([0-9]+)$ ]]; then
      DEPTH_VALUE="${BASH_REMATCH[1]}"
    fi
  fi
  
  # Make depths negative for bathymetry (except 0)
  if [ "$DEPTH_VALUE" != "0" ]; then
    DEPTH_VALUE="-$DEPTH_VALUE"
  fi
  
  # Write to individual GeoJSON with depth attribute added
  TEMP_GEOJSON="$BATHYMETRY_TEMP_DIR/${BATHY_NAME}.geojson"
  echo "  Extracting with depth: $DEPTH_VALUE meters"
  rm -f "$TEMP_GEOJSON"

  # If the directory doesn't exist or has permission issues, recreate it
  if [ ! -d "$BATHYMETRY_TEMP_DIR" ] || [ ! -w "$BATHYMETRY_TEMP_DIR" ]; then
    echo "  Recreating temporary directory with proper permissions..."
    rm -rf "$BATHYMETRY_TEMP_DIR"
    mkdir -p "$BATHYMETRY_TEMP_DIR"
  fi

  # Create a temporary file in the temp directory
  UNIQUE_TEMP=$(mktemp -p "$BATHYMETRY_TEMP_DIR" bathy_XXXXXX.geojson)
  rm -f "$UNIQUE_TEMP"

  # Use -nln option to force a specific layer name which helps with merging
  # Also add a SQL query to create a DEPTH field directly
  echo "  Creating temporary file: $(basename "$UNIQUE_TEMP")"
  if ogr2ogr --config CPL_TMPDIR "$BATHYMETRY_TEMP_DIR" -f GeoJSON -t_srs EPSG:4326 \
    -nln "bathymetry" \
    -sql "SELECT geometry, '$DEPTH_VALUE' as DEPTH FROM \"$(basename "$BATHY_FILE" .shp)\"" \
    "$UNIQUE_TEMP" "$BATHY_FILE" 2>/dev/null; then
    # If successful, move the temp file to the final destination
    echo "  Moving to final location..."
    mv "$UNIQUE_TEMP" "$TEMP_GEOJSON"
  else
    # Fallback if the SQL fails - use direct conversion
    echo "  SQL approach failed, trying direct conversion..."
    rm -f "$UNIQUE_TEMP"
    UNIQUE_TEMP=$(mktemp -p "$BATHYMETRY_TEMP_DIR" bathy_XXXXXX.geojson)
    rm -f "$UNIQUE_TEMP"
    if ogr2ogr --config CPL_TMPDIR "$BATHYMETRY_TEMP_DIR" -f GeoJSON -t_srs EPSG:4326 \
      -nln "bathymetry" \
      "$UNIQUE_TEMP" "$BATHY_FILE"; then
      # If successful, move the temp file to the final destination
      echo "  Moving to final location..."
      mv "$UNIQUE_TEMP" "$TEMP_GEOJSON"
    else
      echo "  ERROR: Failed to convert shapefile to GeoJSON"
      rm -f "$UNIQUE_TEMP"
    fi
  fi
done

# Merge all the GeoJSON files with consistent layer names
echo "Merging all bathymetry files with depth attributes..."
BATHYMETRY_TEMP_FILES=$(find "$BATHYMETRY_TEMP_DIR" -name "*.geojson")
FIRST_TEMP=$(echo "$BATHYMETRY_TEMP_FILES" | head -n 1)

# Clear the output file
rm -f "$BATHYMETRY_COMBINED"

# Check if we found any temporary files
if [ -z "$FIRST_TEMP" ]; then
  echo "ERROR: No temporary GeoJSON files were created. Check permissions and disk space."
  exit 1
fi

# Try a sequential merging approach with ogr2ogr
echo "Starting sequential merge approach..."

# List all valid geojson files in the directory
valid_files=0
for TEMP_FILE in $BATHYMETRY_TEMP_FILES; do
  if [ -f "$TEMP_FILE" ]; then
    valid_files=$((valid_files + 1))
    echo "  Found valid file: $(basename "$TEMP_FILE")"
  fi
done

if [ "$valid_files" -eq 0 ]; then
  echo "ERROR: No valid GeoJSON files found for merging. Exiting."
  exit 1
fi

echo "Found $valid_files valid GeoJSON files to merge"

# First file handling - use direct copy to avoid ogr2ogr issues
FIRST_FILE=""
for TEMP_FILE in $BATHYMETRY_TEMP_FILES; do
  if [ -f "$TEMP_FILE" ];then
    FIRST_FILE="$TEMP_FILE"
    break
  fi
done

if [ -z "$FIRST_FILE" ]; then
  echo "ERROR: Could not find a valid file to start with"
  exit 1
fi

echo "Starting with: $(basename "$FIRST_FILE")"
rm -f "$BATHYMETRY_COMBINED"

# Use ogr2ogr to create the initial combined file (without update/append)
echo "Creating initial combined file..."
if ! ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$BATHYMETRY_COMBINED" "$FIRST_FILE"; then
  echo "ERROR: Failed to create initial combined file"
  exit 1
fi

# For each additional file, try to add its features to the combined file
success_count=1  # Count the first file as success
count=1
for TEMP_FILE in $BATHYMETRY_TEMP_FILES; do
  # Skip the first file we already used
  if [ "$TEMP_FILE" != "$FIRST_FILE" ] && [ -f "$TEMP_FILE" ]; then
    count=$((count + 1))
    echo "Processing file $count: $(basename "$TEMP_FILE")"
    
    # Try merging with update and append flags
    if ogr2ogr -f GeoJSON -t_srs EPSG:4326 -update -append "$BATHYMETRY_COMBINED" "$TEMP_FILE"; then
      success_count=$((success_count + 1))
      echo "  Successfully merged file"
    else
      echo "  Warning: Could not merge $(basename "$TEMP_FILE")"
    fi
  fi
done

# Report merge success rate
echo "Merged $success_count out of $valid_files files"

# Calculate our success rate
total_files=$((count + 1))
if [ $success_count -eq 0 ]; then
  echo "Warning: No bathymetry files were successfully merged. Using only the first file."
else
  echo "Successfully merged $success_count out of $total_files files."
fi

echo "Total files merged: $((count + 1))"

# Simplify bathymetry (optional)
BATHYMETRY_SIMPLE="$DATADIR/bathymetry_simple.geojson"
rm -f "$BATHYMETRY_SIMPLE"
ogr2ogr -f GeoJSON -simplify 0.01 -overwrite "$BATHYMETRY_SIMPLE" "$BATHYMETRY_COMBINED"

# Optional: Print summary of the data
echo "Bathymetry data summary:"
echo "  Number of input shapefiles: $(echo "$BATHYMETRY_SHPS" | wc -l)"
echo "  Number of temporary GeoJSON files: $(echo "$BATHYMETRY_TEMP_FILES" | wc -l)"

# Check the first few lines of the combined GeoJSON to verify depth values
echo "Verifying the combined bathymetry file (first few features):"
if command -v jq &>/dev/null; then
  head -50 "$BATHYMETRY_COMBINED" | jq -c '.features[0:2] | .[] | {depth: .properties.DEPTH}' || echo "Could not analyze GeoJSON with jq"
else
  echo "jq not available, skipping detailed GeoJSON analysis"
  # Alternative: show the file size
  echo "Combined bathymetry GeoJSON file size: $(du -h "$BATHYMETRY_COMBINED" | cut -f1)"
fi

# Generate MBTiles with Tippecanoe
COASTLINES_MBTILES="$TILESDIR/coastlines.mbtiles"
if [ -f "$COASTLINES_MBTILES" ]; then
  echo "Coastlines MBTiles file already exists at $COASTLINES_MBTILES. Skipping generation."
else
  echo "Generating coastlines MBTiles..."
  tippecanoe -o "$COASTLINES_MBTILES" -l ne_10m_coastline -zg --drop-densest-as-needed --coalesce-densest-as-needed "$COASTLINE_SIMPLE"
fi

# Generate bathymetry MBTiles
BATHYMETRY_MBTILES="$TILESDIR/bathymetry.mbtiles"
# Always regenerate to ensure we have the latest data with all depths
echo "Removing existing bathymetry MBTiles if it exists..."
rm -f "$BATHYMETRY_MBTILES"

echo "Generating bathymetry MBTiles..."
tippecanoe -o "$BATHYMETRY_MBTILES" \
  -l ne_10m_bathymetry \
  -zg \
  --drop-densest-as-needed \
  --coalesce-densest-as-needed \
  --force \
  --preserve-input-order \
  --read-parallel \
  --no-line-simplification \
  --minimum-zoom=0 \
  --maximum-zoom=9 \
  "$BATHYMETRY_SIMPLE"

# Copy style.json if present
STYLEJSON="$STYLEDIR/style.json"
if [ -f "$STYLEJSON" ]; then
  cp "$STYLEJSON" "$TILESDIR/"
fi

# Print some information about the generated MBTiles
echo "Vector tile generation complete. Coastlines and bathymetry MBTiles are in $TILESDIR."
echo "==== COASTLINES MBTILES INFO ===="
echo "File size: $(du -h $COASTLINES_MBTILES | cut -f1)"
echo "Number of tiles: $(sqlite3 $COASTLINES_MBTILES "SELECT COUNT(*) FROM tiles" 2>/dev/null || echo "SQLite3 not available")"

echo "==== BATHYMETRY MBTILES INFO ===="
echo "File size: $(du -h $BATHYMETRY_MBTILES | cut -f1)"
echo "Number of tiles: $(sqlite3 $BATHYMETRY_MBTILES "SELECT COUNT(*) FROM tiles" 2>/dev/null || echo "SQLite3 not available")"

# Display additional information about the bathymetry MBTiles
echo "==== BATHYMETRY MBTILES ANALYSIS ===="
echo "First 10 tiles in the file:"
tippecanoe-enumerate "$BATHYMETRY_MBTILES" | head -10
echo "Checking metadata and layer info:"
if command -v sqlite3 &>/dev/null; then
  echo "Metadata:"
  sqlite3 "$BATHYMETRY_MBTILES" "SELECT name, value FROM metadata" 2>/dev/null || echo "Could not read metadata"
  echo "Layers in metadata:"
  sqlite3 "$BATHYMETRY_MBTILES" "SELECT json_extract(value, '$.vector_layers[0].id') FROM metadata WHERE name = 'json'" 2>/dev/null || echo "Could not extract layer info"
  echo "First tile contents summary (if available):"
  sqlite3 "$BATHYMETRY_MBTILES" "SELECT length(tile_data) FROM tiles LIMIT 1" 2>/dev/null || echo "Could not extract tile data"
fi

# Validate that the files were created successfully
echo "Validating outputs..."

# Check that the MBTiles files exist and have a reasonable size
COASTLINES_SIZE=$(du -k "$COASTLINES_MBTILES" 2>/dev/null | cut -f1)
BATHYMETRY_SIZE=$(du -k "$BATHYMETRY_MBTILES" 2>/dev/null | cut -f1)

echo "Final MBTiles sizes:"
echo "  Coastlines: ${COASTLINES_SIZE:-0} KB"
echo "  Bathymetry: ${BATHYMETRY_SIZE:-0} KB"

# Validation criteria
VALIDATION_PASSED=true

# Check coastlines file
if [ -z "$COASTLINES_SIZE" ] || [ "$COASTLINES_SIZE" -lt 100 ]; then
  echo "ERROR: Coastlines MBTiles file is too small or missing!"
  VALIDATION_PASSED=false
fi

# Check bathymetry file
if [ -z "$BATHYMETRY_SIZE" ] || [ "$BATHYMETRY_SIZE" -lt 100 ]; then
  echo "ERROR: Bathymetry MBTiles file is too small or missing!"
  VALIDATION_PASSED=false
fi

# Check tile counts
COASTLINES_TILES=$(sqlite3 "$COASTLINES_MBTILES" "SELECT COUNT(*) FROM tiles" 2>/dev/null)
BATHYMETRY_TILES=$(sqlite3 "$BATHYMETRY_MBTILES" "SELECT COUNT(*) FROM tiles" 2>/dev/null)

echo "Tile counts:"
echo "  Coastlines: ${COASTLINES_TILES:-unknown}"
echo "  Bathymetry: ${BATHYMETRY_TILES:-unknown}"

if [ "${COASTLINES_TILES:-0}" -lt 10 ]; then
  echo "WARNING: Very few coastline tiles generated!"
fi

if [ "${BATHYMETRY_TILES:-0}" -lt 10 ]; then
  echo "WARNING: Very few bathymetry tiles generated!"
  VALIDATION_PASSED=false
fi

if [ "$VALIDATION_PASSED" = true ]; then
  echo "✅ Validation PASSED: Vector tiles were generated successfully!"
  echo "Update your config.json to include the bathymetry source if not already done."
  echo "You can now start the tile server with: docker-compose up -d tileserver"
  exit 0
else
  echo "❌ Validation FAILED: There were issues generating the vector tiles."
  echo "Please check the errors above and try again."
  exit 1
fi
