create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

drop trigger if exists "trg_merchant_locations_set_updated_at" on "public"."merchant_locations";

drop policy "external_conditions_authenticated_read" on "public"."external_conditions";

drop policy "external_conditions_authenticated_update" on "public"."external_conditions";

drop policy "external_conditions_authenticated_write" on "public"."external_conditions";

drop policy "merchant_locations_authenticated_read" on "public"."merchant_locations";

drop policy "merchant_locations_authenticated_update" on "public"."merchant_locations";

drop policy "merchant_locations_authenticated_write" on "public"."merchant_locations";

revoke delete on table "public"."external_conditions" from "anon";

revoke insert on table "public"."external_conditions" from "anon";

revoke references on table "public"."external_conditions" from "anon";

revoke select on table "public"."external_conditions" from "anon";

revoke trigger on table "public"."external_conditions" from "anon";

revoke truncate on table "public"."external_conditions" from "anon";

revoke update on table "public"."external_conditions" from "anon";

revoke delete on table "public"."external_conditions" from "authenticated";

revoke insert on table "public"."external_conditions" from "authenticated";

revoke references on table "public"."external_conditions" from "authenticated";

revoke select on table "public"."external_conditions" from "authenticated";

revoke trigger on table "public"."external_conditions" from "authenticated";

revoke truncate on table "public"."external_conditions" from "authenticated";

revoke update on table "public"."external_conditions" from "authenticated";

revoke delete on table "public"."external_conditions" from "service_role";

revoke insert on table "public"."external_conditions" from "service_role";

revoke references on table "public"."external_conditions" from "service_role";

revoke select on table "public"."external_conditions" from "service_role";

revoke trigger on table "public"."external_conditions" from "service_role";

revoke truncate on table "public"."external_conditions" from "service_role";

revoke update on table "public"."external_conditions" from "service_role";

revoke delete on table "public"."merchant_locations" from "anon";

revoke insert on table "public"."merchant_locations" from "anon";

revoke references on table "public"."merchant_locations" from "anon";

revoke select on table "public"."merchant_locations" from "anon";

revoke trigger on table "public"."merchant_locations" from "anon";

revoke truncate on table "public"."merchant_locations" from "anon";

revoke update on table "public"."merchant_locations" from "anon";

revoke delete on table "public"."merchant_locations" from "authenticated";

revoke insert on table "public"."merchant_locations" from "authenticated";

revoke references on table "public"."merchant_locations" from "authenticated";

revoke select on table "public"."merchant_locations" from "authenticated";

revoke trigger on table "public"."merchant_locations" from "authenticated";

revoke truncate on table "public"."merchant_locations" from "authenticated";

revoke update on table "public"."merchant_locations" from "authenticated";

revoke delete on table "public"."merchant_locations" from "service_role";

revoke insert on table "public"."merchant_locations" from "service_role";

revoke references on table "public"."merchant_locations" from "service_role";

revoke select on table "public"."merchant_locations" from "service_role";

revoke trigger on table "public"."merchant_locations" from "service_role";

revoke truncate on table "public"."merchant_locations" from "service_role";

revoke update on table "public"."merchant_locations" from "service_role";

alter table "public"."external_conditions" drop constraint "external_conditions_humidity_range";

alter table "public"."external_conditions" drop constraint "external_conditions_import_batch_id_fkey";

alter table "public"."external_conditions" drop constraint "external_conditions_latitude_range";

alter table "public"."external_conditions" drop constraint "external_conditions_longitude_range";

alter table "public"."external_conditions" drop constraint "external_conditions_surge_nonneg";

alter table "public"."merchant_locations" drop constraint "merchant_locations_delivery_fee_nonneg";

alter table "public"."merchant_locations" drop constraint "merchant_locations_delivery_time_nonneg";

alter table "public"."merchant_locations" drop constraint "merchant_locations_import_batch_id_fkey";

alter table "public"."merchant_locations" drop constraint "merchant_locations_latitude_range";

alter table "public"."merchant_locations" drop constraint "merchant_locations_longitude_range";

alter table "public"."merchant_locations" drop constraint "merchant_locations_name_not_blank";

alter table "public"."merchant_locations" drop constraint "merchant_locations_price_level_range";

alter table "public"."merchant_locations" drop constraint "merchant_locations_rating_range";

alter table "core"."asset" drop constraint "chk_asset_type";

alter table "core"."capture_event" drop constraint "chk_capture_type";

alter table "core"."capture_event" drop constraint "chk_processing_status";

alter table "core"."decision_rule" drop constraint "chk_rule_type";

alter table "core"."delivery_issue" drop constraint "chk_issue_severity";

alter table "core"."delivery_issue" drop constraint "chk_issue_type";

alter table "core"."delivery_order" drop constraint "chk_delivery_status";

alter table "core"."delivery_stop" drop constraint "chk_stop_type";

alter table "core"."driver" drop constraint "chk_driver_status";

alter table "core"."earning_event" drop constraint "chk_earning_type";

alter table "core"."expense" drop constraint "chk_expense_category";

alter table "core"."location" drop constraint "chk_location_type";

alter table "core"."mileage_log" drop constraint "chk_mileage_source_type";

alter table "core"."mileage_log" drop constraint "chk_mileage_type";

alter table "core"."offer" drop constraint "chk_offer_source_type";

alter table "core"."offer" drop constraint "chk_offer_type";

alter table "core"."offer_decision" drop constraint "chk_action_source";

alter table "core"."offer_decision" drop constraint "chk_driver_action";

alter table "core"."offer_decision" drop constraint "chk_system_recommendation";

alter table "core"."platform" drop constraint "chk_platform_type";

alter table "core"."platform_account" drop constraint "chk_platform_account_status";

alter table "core"."vehicle" drop constraint "chk_vehicle_fuel_type";

alter table "core"."work_session" drop constraint "chk_session_status";

alter table "core"."zone" drop constraint "chk_zone_type";

drop view if exists "public"."v_trip_import_review";

alter table "public"."external_conditions" drop constraint "external_conditions_pkey";

alter table "public"."merchant_locations" drop constraint "merchant_locations_pkey";

drop index if exists "public"."external_conditions_pkey";

drop index if exists "public"."idx_external_conditions_recorded_at";

drop index if exists "public"."idx_external_conditions_zone_id";

drop index if exists "public"."idx_external_conditions_zone_time";

drop index if exists "public"."idx_merchant_locations_city_state";

drop index if exists "public"."idx_merchant_locations_platform";

drop index if exists "public"."idx_merchant_locations_platform_name_coords";

drop index if exists "public"."idx_merchant_locations_zone_id";

drop index if exists "public"."merchant_locations_pkey";

drop table "public"."external_conditions";

drop table "public"."merchant_locations";

alter type "public"."platform_enum" rename to "platform_enum__old_version_to_be_dropped";

create type "public"."platform_enum" as enum ('uber_driver', 'uber_eats', 'doordash', 'grubhub', 'unknown');

alter type "public"."source_type_enum" rename to "source_type_enum__old_version_to_be_dropped";

create type "public"."source_type_enum" as enum ('weekly_statement_csv', 'personal_data_export', 'manual_csv', 'manual_entry', 'app_gps', 'derived', 'other');

alter table "public"."import_batches" alter column source_platform type "public"."platform_enum" using source_platform::text::"public"."platform_enum";

alter table "public"."import_batches" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."platform_accounts" alter column platform type "public"."platform_enum" using platform::text::"public"."platform_enum";

alter table "public"."shift_source_links" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."trip_source_links" alter column source_type type "public"."source_type_enum" using source_type::text::"public"."source_type_enum";

alter table "public"."trips" alter column platform type "public"."platform_enum" using platform::text::"public"."platform_enum";

drop type "public"."platform_enum__old_version_to_be_dropped";

drop type "public"."source_type_enum__old_version_to_be_dropped";

alter table "core"."asset" add constraint "chk_asset_type" CHECK (((asset_type)::text = ANY ((ARRAY['image'::character varying, 'receipt'::character varying, 'export_file'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."asset" validate constraint "chk_asset_type";

alter table "core"."capture_event" add constraint "chk_capture_type" CHECK (((capture_type)::text = ANY ((ARRAY['screenshot'::character varying, 'ocr'::character varying, 'accessibility_text'::character varying, 'manual_entry'::character varying, 'csv_import'::character varying, 'api_import'::character varying])::text[]))) not valid;

alter table "core"."capture_event" validate constraint "chk_capture_type";

alter table "core"."capture_event" add constraint "chk_processing_status" CHECK (((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'parsed'::character varying, 'failed'::character varying, 'ignored'::character varying])::text[]))) not valid;

alter table "core"."capture_event" validate constraint "chk_processing_status";

alter table "core"."decision_rule" add constraint "chk_rule_type" CHECK (((rule_type)::text = ANY ((ARRAY['accept'::character varying, 'reject'::character varying, 'warn'::character varying, 'score_modifier'::character varying])::text[]))) not valid;

alter table "core"."decision_rule" validate constraint "chk_rule_type";

alter table "core"."delivery_issue" add constraint "chk_issue_severity" CHECK (((issue_severity IS NULL) OR ((issue_severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))) not valid;

alter table "core"."delivery_issue" validate constraint "chk_issue_severity";

alter table "core"."delivery_issue" add constraint "chk_issue_type" CHECK (((issue_type)::text = ANY ((ARRAY['long_wait'::character varying, 'closed_store'::character varying, 'address_problem'::character varying, 'customer_unreachable'::character varying, 'order_not_ready'::character varying, 'app_glitch'::character varying, 'traffic_delay'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."delivery_issue" validate constraint "chk_issue_type";

alter table "core"."delivery_order" add constraint "chk_delivery_status" CHECK (((delivery_status)::text = ANY ((ARRAY['accepted'::character varying, 'en_route_pickup'::character varying, 'picked_up'::character varying, 'en_route_dropoff'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."delivery_order" validate constraint "chk_delivery_status";

alter table "core"."delivery_stop" add constraint "chk_stop_type" CHECK (((stop_type)::text = ANY ((ARRAY['pickup'::character varying, 'dropoff'::character varying])::text[]))) not valid;

alter table "core"."delivery_stop" validate constraint "chk_stop_type";

alter table "core"."driver" add constraint "chk_driver_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'deleted'::character varying])::text[]))) not valid;

alter table "core"."driver" validate constraint "chk_driver_status";

alter table "core"."earning_event" add constraint "chk_earning_type" CHECK (((earning_type)::text = ANY ((ARRAY['base_pay'::character varying, 'tip'::character varying, 'surge'::character varying, 'boost'::character varying, 'peak_pay'::character varying, 'quest_bonus'::character varying, 'promo_bonus'::character varying, 'adjustment'::character varying, 'cancellation_pay'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."earning_event" validate constraint "chk_earning_type";

alter table "core"."expense" add constraint "chk_expense_category" CHECK (((expense_category)::text = ANY ((ARRAY['fuel'::character varying, 'maintenance'::character varying, 'insurance'::character varying, 'phone'::character varying, 'car_wash'::character varying, 'parking'::character varying, 'tolls'::character varying, 'supplies'::character varying, 'subscription'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."expense" validate constraint "chk_expense_category";

alter table "core"."location" add constraint "chk_location_type" CHECK (((location_type IS NULL) OR ((location_type)::text = ANY ((ARRAY['merchant'::character varying, 'customer'::character varying, 'hotspot'::character varying, 'home'::character varying, 'gas_station'::character varying, 'parking_zone'::character varying, 'other'::character varying])::text[])))) not valid;

alter table "core"."location" validate constraint "chk_location_type";

alter table "core"."mileage_log" add constraint "chk_mileage_source_type" CHECK (((source_type)::text = ANY ((ARRAY['gps'::character varying, 'manual'::character varying, 'calculated'::character varying, 'import'::character varying])::text[]))) not valid;

alter table "core"."mileage_log" validate constraint "chk_mileage_source_type";

alter table "core"."mileage_log" add constraint "chk_mileage_type" CHECK (((mileage_type)::text = ANY ((ARRAY['active_delivery'::character varying, 'deadhead'::character varying, 'positioning'::character varying, 'personal'::character varying, 'commute'::character varying])::text[]))) not valid;

alter table "core"."mileage_log" validate constraint "chk_mileage_type";

alter table "core"."offer" add constraint "chk_offer_source_type" CHECK (((offer_source_type)::text = ANY ((ARRAY['screen_capture'::character varying, 'manual_entry'::character varying, 'ocr'::character varying, 'import'::character varying, 'api'::character varying])::text[]))) not valid;

alter table "core"."offer" validate constraint "chk_offer_source_type";

alter table "core"."offer" add constraint "chk_offer_type" CHECK (((offer_type)::text = ANY ((ARRAY['single'::character varying, 'stacked'::character varying, 'batched'::character varying, 'add_on'::character varying])::text[]))) not valid;

alter table "core"."offer" validate constraint "chk_offer_type";

alter table "core"."offer_decision" add constraint "chk_action_source" CHECK (((action_source)::text = ANY ((ARRAY['manual'::character varying, 'automation_rule'::character varying, 'assisted_tap'::character varying, 'system_default'::character varying])::text[]))) not valid;

alter table "core"."offer_decision" validate constraint "chk_action_source";

alter table "core"."offer_decision" add constraint "chk_driver_action" CHECK (((driver_action)::text = ANY ((ARRAY['accepted'::character varying, 'rejected'::character varying, 'timed_out'::character varying, 'missed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."offer_decision" validate constraint "chk_driver_action";

alter table "core"."offer_decision" add constraint "chk_system_recommendation" CHECK (((system_recommendation IS NULL) OR ((system_recommendation)::text = ANY ((ARRAY['accept'::character varying, 'reject'::character varying, 'review'::character varying])::text[])))) not valid;

alter table "core"."offer_decision" validate constraint "chk_system_recommendation";

alter table "core"."platform" add constraint "chk_platform_type" CHECK (((platform_type)::text = ANY ((ARRAY['food_delivery'::character varying, 'package_delivery'::character varying, 'rideshare'::character varying, 'grocery'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."platform" validate constraint "chk_platform_type";

alter table "core"."platform_account" add constraint "chk_platform_account_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'disconnected'::character varying, 'error'::character varying])::text[]))) not valid;

alter table "core"."platform_account" validate constraint "chk_platform_account_status";

alter table "core"."vehicle" add constraint "chk_vehicle_fuel_type" CHECK (((fuel_type IS NULL) OR ((fuel_type)::text = ANY ((ARRAY['gasoline'::character varying, 'hybrid'::character varying, 'diesel'::character varying, 'electric'::character varying, 'other'::character varying])::text[])))) not valid;

alter table "core"."vehicle" validate constraint "chk_vehicle_fuel_type";

alter table "core"."work_session" add constraint "chk_session_status" CHECK (((session_status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."work_session" validate constraint "chk_session_status";

alter table "core"."zone" add constraint "chk_zone_type" CHECK (((zone_type)::text = ANY ((ARRAY['hotspot'::character varying, 'delivery_corridor'::character varying, 'avoidance_zone'::character varying, 'preferred_zone'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."zone" validate constraint "chk_zone_type";

create or replace view "public"."v_trip_import_review" as  SELECT t.trip_id,
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
    t.pickup_zone_id,
    t.dropoff_zone_id,
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
   FROM ((public.trips t
     LEFT JOIN public.trip_financials tf ON ((tf.trip_id = t.trip_id)))
     LEFT JOIN public.trip_metrics tm ON ((tm.trip_id = t.trip_id)));



