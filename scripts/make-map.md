# Remaking the Bansalan map file (public/bansalan.pmtiles)

The app draws its own map from one 2 MB file cut from the free Protomaps world map (OpenStreetMap data).
Remake it when OpenStreetMap has new streets or places you want:

1. Download `pmtiles` for your system from https://github.com/protomaps/go-pmtiles/releases (v1.31 or newer).
2. Find the newest build name at https://build-metadata.protomaps.dev/builds.json (for example `20261030.pmtiles`).
3. Run, from the project folder:

   pmtiles extract https://build.protomaps.com/20261030.pmtiles public/bansalan.pmtiles --bbox=125.0569,6.6293,125.3774,7.0873 --maxzoom=15

4. `npm run build`. The new file is saved in the app for offline use automatically.

Add `?tiles=osm` to an address (for example `#/map?tiles=osm`... or the page URL) to compare with the live OpenStreetMap map.
Map data © OpenStreetMap contributors (ODbL), basemap by Protomaps.
