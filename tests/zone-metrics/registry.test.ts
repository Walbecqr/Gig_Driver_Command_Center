import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { CENSUS_METRIC_KEYS } from '@/lib/zone-metrics/census-metric-keys';
import { ZONE_METRIC_REGISTRY } from '@/lib/zone-metrics/registry';

describe('zone metric registry', () => {
  it('contains every census metric key constant', () => {
    for (const metricKey of Object.values(CENSUS_METRIC_KEYS)) {
      expect(ZONE_METRIC_REGISTRY[metricKey]).toBeDefined();
    }
  });

  it('stays in sync with SQL zone_metric_registry seed keys', () => {
    const seedPath = path.resolve(process.cwd(), 'supabase/migrations/20260412000201_seed_zone_metric_registry.sql');
    const sql = fs.readFileSync(seedPath, 'utf-8');

    const metricKeysInSql = new Set<string>();
    const metricTupleRegex = /\(\s*'([a-z0-9_]+)'\s*,\s*'[^']+'/g;

    let match: RegExpExecArray | null;
    while ((match = metricTupleRegex.exec(sql)) !== null) {
      metricKeysInSql.add(match[1]!);
    }

    expect(metricKeysInSql.size).toBeGreaterThan(0);

    const keysInCode = new Set(Object.values(CENSUS_METRIC_KEYS));
    expect(keysInCode).toEqual(metricKeysInSql);
  });
});
