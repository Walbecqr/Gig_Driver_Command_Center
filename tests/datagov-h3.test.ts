import { describe, expect, it } from 'vitest';

import {
  geoJsonMultiPolygonToZoneIds,
  geoJsonPolygonToZoneIds,
  getZoneId,
  polygonToZoneIds,
} from '@/utils/h3';
import { parseGeoJsonFeatureCollection, TIGER_ZIP_PROFILE } from '@/services/datagov/geojsonParser';

describe('H3 polygon helpers', () => {
  it('converts GeoJSON polygon coordinates into H3 zone ids', () => {
    const coordinates = [
      [
        [-73.99, 40.75],
        [-73.98, 40.75],
        [-73.98, 40.76],
        [-73.99, 40.76],
        [-73.99, 40.75],
      ],
    ];

    const zoneIds = geoJsonPolygonToZoneIds(coordinates);
    expect(zoneIds.length).toBeGreaterThan(0);
  });

  it('deduplicates cells across multipolygons', () => {
    const polygon = [
      [
        [-73.99, 40.75],
        [-73.98, 40.75],
        [-73.98, 40.76],
        [-73.99, 40.76],
        [-73.99, 40.75],
      ],
    ];

    const zoneIds = geoJsonMultiPolygonToZoneIds([polygon, polygon]);
    const uniqueCount = new Set(zoneIds).size;
    expect(zoneIds.length).toBe(uniqueCount);
    expect(zoneIds.length).toBeGreaterThan(0);
  });

  it('keeps point-based conversion unchanged', () => {
    const pointZone = getZoneId(40.758, -73.9855);
    const polygonZone = polygonToZoneIds([
      [40.74, -74.0],
      [40.78, -74.0],
      [40.78, -73.95],
      [40.74, -73.95],
    ]);

    expect(pointZone).toEqual(expect.any(String));
    expect(polygonZone.length).toBeGreaterThan(0);
  });
});

describe('GeoJSON parser polygon tessellation', () => {
  it('attaches polygonZoneIds for polygon features', () => {
    const features = parseGeoJsonFeatureCollection(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'tract_1',
            properties: { GEOID10: '0001', ZCTA5CE10: '10001' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-73.99, 40.75],
                  [-73.98, 40.75],
                  [-73.98, 40.76],
                  [-73.99, 40.76],
                  [-73.99, 40.75],
                ],
              ],
            },
          },
        ],
      },
      TIGER_ZIP_PROFILE,
    );

    expect(features[0]?.polygonZoneIds.length).toBeGreaterThan(0);
  });

  it('keeps polygonZoneIds empty for point features', () => {
    const features = parseGeoJsonFeatureCollection(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'poi_1',
            properties: { name: 'Station' },
            geometry: {
              type: 'Point',
              coordinates: [-73.9855, 40.758],
            },
          },
        ],
      },
      TIGER_ZIP_PROFILE,
    );

    expect(features[0]?.polygonZoneIds).toEqual([]);
  });
});
