create or replace view public.v_trip_import_review as
select
  t.trip_id,
  t.user_id,
  t.platform_account_id,
  t.shift_id,
  t.platform,
  t.service_type,
  t.platform_trip_id,
  t.platform_order_id,
  t.trip_status,
  t.trip_date_local,
  t.trip_start_ts_local,
  t.trip_end_ts_local,
  t.trip_timezone,
  t.completion_confidence,
  tf.currency_code,
  tf.gross_amount,
  tf.net_payout,
  tf.base_fare,
  tf.tip_amount,
  tf.bonus_amount,
  tf.surge_amount,
  tf.wait_time_pay,
  tf.cancellation_pay,
  tf.adjustment_amt,
  tf.fee_amount,
  tf.payout_conf,
  tf.fin_source_type,
  tm.distance_miles,
  tm.duration_minutes,
  tm.active_minutes,
  tm.pickup_to_drop_minutes,
  tm.distance_source,
  tm.duration_source,
  tm.metric_confidence,
  t.created_at,
  t.updated_at
from public.trips t
left join public.trip_financials tf
  on tf.trip_id = t.trip_id
left join public.trip_metrics tm
  on tm.trip_id = t.trip_id;

create or replace view public.v_open_reconciliation_issues as
select
  ri.reconciliation_issue_id,
  ri.user_id,
  ri.platform_account_id,
  ri.import_batch_id,
  ri.shift_id,
  ri.trip_id,
  ri.issue_type,
  ri.severity,
  ri.issue_summary,
  ri.source_a,
  ri.source_b,
  ri.resolution_status,
  ri.created_at,
  t.platform_trip_id,
  t.trip_date_local,
  t.trip_start_ts_local,
  t.trip_end_ts_local
from public.reconciliation_issues ri
left join public.trips t
  on t.trip_id = ri.trip_id
where ri.resolution_status = 'open';
