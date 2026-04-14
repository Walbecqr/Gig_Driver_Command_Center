# Gap-Closing Implementation Plan (Repository-State Aligned)

Date: 2026-04-14

## Priority-ordered workstreams

### 1) Schema/code mismatch closure (highest dependency + highest break risk)

**Goal**
Stabilize table/column contracts so ingestion code, Supabase types, and migrations all target one canonical shape.

**Why first**
Current code writes `zone_id` while earlier migrations define `h3_cell`/`h3_resolution`; there are also duplicate definitions for `zone_metric_registry`. If this is not normalized first, downstream ingestion and reads remain brittle.

**Likely files/migrations affected**
- `supabase/migrations/001_public_reference_enums.sql`
- `supabase/migrations/20260414060001_reference_overlay_tables.sql`
- `supabase/migrations/20260412000200_zone_metric_registry.sql`
- `supabase/migrations/20260414101000_metric_key_governance_reference_and_census.sql`
- `supabase/migrations/20260414xxxxxx_schema_contract_reconciliation.sql` (new)
- `src/types/supabase.generated.ts` (regeneration after migration)
- `src/services/datagov/geojsonIngestion.ts`
- `src/services/datagov/censusAcsIngestion.ts`
- `src/features/market/referenceContext.ts`

**Implementation notes**
- Choose canonical column naming for overlay-zone linkage (`zone_id` appears to be current runtime convention).
- Add compatibility views or dual-write transition only if needed; avoid broad rewrites.
- Ensure `zone_metric_registry` is one schema model (prefer additive alter migration, not drop/recreate).
- Regenerate `src/types/supabase.generated.ts` immediately after contract changes.

**Risks**
- Migration order conflicts causing partially-applied schemas in existing environments.
- Runtime failures from type drift if generated types are not refreshed in same sprint.
- Existing seed scripts may fail if they assume old columns.

---

### 2) Missing/partial reference-data schema hardening

**Goal**
Complete and enforce the reference-data backbone for datasets, features, ingest batches, and overlay tables under a single authoritative path.

**Likely files/migrations affected**
- `supabase/migrations/20260414060000_reference_backbone.sql`
- `supabase/migrations/20260414060001_reference_overlay_tables.sql`
- `supabase/migrations/001_public_reference_enums.sql` (deprecate overlap, no destructive drop yet)
- `supabase/migrations/20260414xxxxxx_reference_schema_constraints.sql` (new)
- `src/services/datagov/referenceRegistry.ts`

**Implementation notes**
- Validate/normalize unique constraints needed by `ensureReferenceDataset` upsert (`dataset_slug`).
- Add explicit non-null/check constraints where ingestion assumes defaults.
- Keep legacy artifacts for now, but mark deprecated in migration comments/docs.

**Risks**
- Constraint tightening can fail on existing dirty rows.
- RLS/policy divergence between duplicate table definitions.

---

### 3) Metric governance consolidation

**Goal**
Make metric governance authoritative across SQL seeds, app key constants, and runtime validation.

**Likely files/migrations affected**
- `supabase/migrations/20260412000200_zone_metric_registry.sql`
- `supabase/migrations/20260412000201_seed_zone_metric_registry.sql`
- `supabase/migrations/20260414101000_metric_key_governance_reference_and_census.sql`
- `supabase/migrations/20260412000202_zone_demographics_metric_key_fk.sql`
- `src/lib/zone-metrics/census-metric-keys.ts`
- `src/lib/zone-metrics/reference-metric-keys.ts`
- `src/lib/zone-metrics/registry.ts`
- `tests/zone-metrics/registry.test.ts`

**Implementation notes**
- Keep one seed source of truth and make the other migration idempotent shim-only.
- Promote FK from `NOT VALID` to validated once backfill checks pass.
- Add a CI check to diff SQL-governed keys vs TS constants.

**Risks**
- Existing historical rows with unknown keys block FK validation.
- Duplicate seed paths can silently diverge again if both remain editable.

---

### 4) Provenance/reconciliation wiring

**Goal**
Wire import/review provenance end-to-end so ingestion runs can be audited and reconciled with source imports.

**Likely files/migrations affected**
- `supabase/migrations/20260414120000_import_review_pending.sql`
- `src/services/ingestion/importReview.ts`
- `src/services/datagov/referenceRegistry.ts`
- `src/services/datagov/censusAcsIngestion.ts`
- `src/services/datagov/geojsonIngestion.ts`
- `src/services/datagov/nwsIngestion.ts`
- `src/features/market/referenceContext.ts` (read-side status awareness)

**Implementation notes**
- Ensure every reference ingest batch can link to an optional `import_batch_id` and reconciliation status.
- Persist parsed/failed counts and notes consistently.
- Add read filters so consumption excludes failed/unreviewed data where required.

**Risks**
- Orphaned batch rows if ingest failure paths do not finalize status.
- Status semantics (`processing`/`partial`/`review_pending`) drift between services.

---

### 5) Polygon-to-H3 production support hardening

**Goal**
Promote current polygon tessellation from helper-level support to operational ingestion behavior with guardrails.

**Likely files/migrations affected**
- `src/utils/h3.ts`
- `src/services/datagov/geojsonParser.ts`
- `src/services/datagov/geojsonIngestion.ts`
- `tests/datagov-h3.test.ts`
- `supabase/migrations/20260414xxxxxx_overlay_polygon_indexes.sql` (new, if perf needed)

**Implementation notes**
- Keep centroid fallback for non-polygon geometries.
- Add size/vertex safeguards for very large polygons to prevent ingestion stalls.
- Add idempotency/dedup strategy for repeated polygon cell inserts.

**Risks**
- High-cardinality polygons can produce very large row fanout and slow inserts.
- Duplicate zone rows if ingestion retries are not deduped by natural keys.

---

### 6) First consumption-layer reads (controlled scope)

**Goal**
Deliver first stable read models from reference overlays into market context without over-expanding feature surface.

**Likely files/migrations affected**
- `src/features/market/referenceContext.ts`
- `src/features/market/index.ts`
- `src/types/supabase.generated.ts`
- `tests/features.test.ts` (or dedicated market-context tests)

**Implementation notes**
- Use the existing `getReferenceContextSummary` path and add only essential aggregates first.
- Gate reads on validated statuses and non-empty zone linkage.
- Keep response contract stable for app screens.

**Risks**
- Query fanout/latency from multiple Supabase round-trips.
- Null-heavy data if ingestion completeness checks are not enforced first.

---

### 7) Cleanup of obsolete artifacts (last, lowest product risk but high accidental-delete risk)

**Goal**
Retire or quarantine obsolete migration artifacts after compatibility is proven.

**Likely files/migrations affected**
- `supabase/migrations/uber_weekly _statement_csv_import/*` (documentation/deprecation markers first)
- `docs/cleanup-audit-2026-04-14.md`
- `docs/project-structure.md` (if paths are reclassified)

**Implementation notes**
- Do not delete legacy paths in same sprint as schema unification.
- First add deprecation comments + README notes; remove only after rollout + validation.

**Risks**
- Accidental loss of historical reference migrations.
- Broken onboarding docs/scripts if paths disappear abruptly.

## What should NOT be touched yet

1. **Core local SQLite feature flows** under `src/db/**` and existing `src/features/*` business logic not tied to reference overlays.
2. **Platform/account model unification drops** (`delivery_platform_accounts` vs `platform_accounts` vs `core.platform_account`) until explicit ADR/data backfill plan exists.
3. **Large UI rewrites** in `app/**`; consumption should land behind current market-context interfaces first.
4. **Destructive deletion of legacy migrations** before schema-contract stabilization and environment validation.

## Recommended implementation order by sprint

### Sprint 1 (stabilize contracts)
- Workstream 1: schema/code mismatch closure.
- Workstream 2 (partial): reference backbone constraint hardening required for runtime safety.
- Deliverables: canonical zone-link column contract, unified `zone_metric_registry` shape, regenerated Supabase types, zero known write-path schema mismatches.

### Sprint 2 (governance + provenance)
- Workstream 3: metric governance consolidation + FK validation prep.
- Workstream 4: provenance/reconciliation wiring with review statuses.
- Deliverables: one metric seed source of truth, validated/near-validated governance FK, reconciliable ingest batches.

### Sprint 3 (geospatial scale + first reads)
- Workstream 5: polygon-to-H3 hardening (performance and idempotency).
- Workstream 6: first consumption-layer reads with stable API contract.
- Deliverables: production-safe polygon ingestion and first dependable market-context enrichment reads.

### Sprint 4 (deprecation/cleanup)
- Workstream 7: obsolete artifact cleanup in controlled deprecation sequence.
- Deliverables: deprecated paths documented, safe removals (if any) after rollout evidence.
