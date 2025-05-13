<#
.SYNOPSIS
    Automates the download, preprocessing, and vector tile generation for the ship simulator.
.DESCRIPTION
    Downloads Natural Earth coastline data, simplifies and reprojects it, and generates MBTiles using Tippecanoe.
    Places the output in output/tiles/ for use with TileServer GL.
.NOTES
    Requires: PowerShell 7+, curl, ogr2ogr (GDAL), tippecanoe, 7zip (for .zip extraction)
#>

$ErrorActionPreference = 'Stop'

# Directories
$DataDir = "data"
$TilesDir = "output/tiles"
$StyleDir = "styles"

# Create directories if needed
New-Item -ItemType Directory -Force -Path $DataDir, $TilesDir | Out-Null

# Download Natural Earth coastline (1:10m)
$coastlineZip = "$DataDir/ne_10m_coastline.zip"
$coastlineUrl = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_coastline.zip"
if (!(Test-Path $coastlineZip)) {
    try {
        Invoke-WebRequest -Uri $coastlineUrl -OutFile $coastlineZip
    } catch {
        Write-Host "Download failed. Please manually download ne_10m_coastline.zip from $coastlineUrl and place it in the 'data' directory, then re-run this script." -ForegroundColor Red
        exit 1
    }
}

# Extract coastline
& 7z x $coastlineZip -o$DataDir -y | Out-Null
$coastlineShp = Get-ChildItem $DataDir -Filter "*ne_10m_coastline.shp" | Select-Object -First 1

# Reproject to WGS84 and convert to GeoJSON
$coastlineGeoJson = "$DataDir/coastline.geojson"
& ogr2ogr -f GeoJSON -t_srs EPSG:4326 $coastlineGeoJson $coastlineShp.FullName

# Simplify geometry for performance (optional, adjust tolerance as needed)
$coastlineSimple = "$DataDir/coastline_simple.geojson"
& ogr2ogr -f GeoJSON -simplify 0.01 $coastlineSimple $coastlineGeoJson

# Generate MBTiles with Tippecanoe
$mbtiles = "$TilesDir/coastlines.mbtiles"
& tippecanoe -o $mbtiles -l ne_10m_coastline -zg --drop-densest-as-needed --coalesce-densest-as-needed $coastlineSimple

# Copy style.json if not present
$styleJson = "$StyleDir/style.json"
if (Test-Path $styleJson) {
    Copy-Item $styleJson $TilesDir -Force
}

Write-Host "Vector tile generation complete. MBTiles and style.json are in $TilesDir."
Write-Host "You can now start the tile server with: docker-compose up -d tileserver"
