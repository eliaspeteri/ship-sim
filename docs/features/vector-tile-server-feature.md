# Vector Tile Server: Data Pipeline, Preprocessing, and Deployment

## Table of Contents

1. Goal
2. Why
3. Smallest Possible Steps
4. Feature Details
5. Data Sources and Acquisition
6. Data Preprocessing Pipeline
7. Vector Tile Generation
8. Tile Server Setup (Docker)
9. Style and Config Files
10. Client Integration
11. Validation and Test Checklist
12. FAQ, Troubleshooting, and Best Practices
13. Status and Milestones
14. Glossary
15. How to Contribute

---

## Goal

Provide a robust, reproducible pipeline for generating and serving vector tiles (coastlines, bathymetry, ports, etc.) for the ship simulator, supporting both 2D and 3D globe rendering with Three.js and MapLibre/OpenLayers.

## Why

- Vector tiles are bandwidth-efficient and enable dynamic styling and interactivity.
- Required for globe-based rendering and overlays in the simulator.
- Supports multi-resolution, LOD, and future extensibility (routes, weather, etc.).

## Smallest Possible Steps

1. Select and download open geodata (Natural Earth, GEBCO, OpenMapTiles, etc.).
2. Preprocess and clean data (simplify, reproject, validate).
3. Generate vector tiles (MVT/.pbf) using Tippecanoe or similar.
4. Package tiles as MBTiles or directory structure.
5. Deploy a Docker-based tile server (TileServer GL).
6. Create and test style/config files for the server.
7. Integrate with frontend (Three.js, MapLibre, etc.).

## Feature Details

- [x] Document data sources and licensing
- [x] Provide preprocessing scripts (Python, GDAL, mapshaper)
- [x] Example Tippecanoe command for MVT generation
- [x] Docker Compose config for TileServer GL
- [x] Example style.json for maritime features
- [x] Client code snippets for loading vector tiles
- [ ] Validation checklist and troubleshooting

## Data Sources and Acquisition

- **Coastlines:** Natural Earth (1:10m, 1:50m, 1:110m), OpenStreetMap
- **Bathymetry:** GEBCO, SRTM30_PLUS, ETOPO1
- **Ports/Routes:** OpenSeaMap, OpenMapTiles, custom sources

## Data Preprocessing Pipeline

- Download source data (GeoJSON, Shapefile, etc.)
- Simplify geometries for each zoom level (mapshaper, ogr2ogr)
- Reproject to WGS84 (EPSG:4326)
- Clean and validate features
- Merge datasets as needed

## Vector Tile Generation

- Use Tippecanoe to generate .mbtiles from GeoJSON:

  ```sh
  tippecanoe -o coastlines.mbtiles -l ne_10m_coastline -zg --drop-densest-as-needed --coalesce-densest-as-needed coastline.geojson
  ```

- For bathymetry, convert contours or polygons to GeoJSON, then tile as above.
- Validate output with `tile-join` or `mbview`.

## Tile Server Setup (Docker)

- Add to `docker-compose.yml`:

  ```yaml
  tileserver:
    image: maptiler/tileserver-gl
    ports:
      - "8888:8080"
    volumes:
      - ./output/tiles:/data
    environment:
      - TILESERVER_CONFIG=/data/config.json
    networks:
      - ship-sim-network
    restart: unless-stopped
  ```

- Place `.mbtiles` and `style.json` in `output/tiles/`.
- Example `style.json` in `styles/basic/style.json`.

## Style and Config Files

- `style.json` defines layer appearance (see `styles/basic/style.json`).
- `config.json` (optional) for advanced server config.

## Client Integration

- **MapLibre GL JS:**

  ```js
  map.addSource('coastlines', {
    type: 'vector',
    tiles: ['http://localhost:8080/data/{z}/{x}/{y}.pbf'],
    minzoom: 0,
    maxzoom: 7
  });
  map.addLayer({
    id: 'coastlines',
    type: 'line',
    source: 'coastlines',
    'source-layer': 'ne_10m_coastline',
    paint: { 'line-color': '#000', 'line-width': 1 }
  });
  ```

- **Three.js:** Use `@mapbox/vector-tile` and `pbf` to parse and project features onto the globe.

## Validation and Test Checklist

- [ ] Tileserver serves vector tiles at `http://localhost:8080/data/{z}/{x}/{y}.pbf`
- [ ] Tiles load in MapLibre/Three.js
- [ ] Layer styling matches maritime requirements
- [ ] Data sources and attribution are documented
- [ ] Pipeline scripts run without error

## FAQ, Troubleshooting, and Best Practices

- If tiles do not appear, check CRS, layer names, and style.json.
- Use `docker-compose logs tileserver` for server errors.
- Validate .mbtiles with `mbview` or similar tools.
- Automate data updates and preprocessing where possible.

## Status and Milestones

- **Last updated:** 2025-05-13
- **Current status:** Pipeline and server config documented, style example provided, client integration in progress.

## Glossary

- **MVT:** Mapbox Vector Tile
- **MBTiles:** SQLite-based container for tiles
- **Tippecanoe:** Tool for generating vector tiles
- **LOD:** Level of Detail
- **WGS84:** Standard geographic coordinate system

## How to Contribute

- Fork, branch, PR, update docs/scripts, validate pipeline.
- For help, open an issue or join the project discussion forum.
