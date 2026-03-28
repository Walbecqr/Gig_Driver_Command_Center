create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";

create schema if not exists "analytics";

create schema if not exists "core";


  create table "analytics"."merchant_performance_snapshot" (
    "merchant_performance_snapshot_id" uuid not null,
    "merchant_id" uuid not null,
    "snapshot_date" date not null,
    "avg_wait_minutes" numeric(8,2),
    "avg_offer_value" numeric(10,2),
    "avg_tip_amount" numeric(10,2),
    "order_volume" integer,
    "acceptance_rate" numeric(5,2),
    "cancellation_rate" numeric(5,2),
    "computed_at" timestamp with time zone not null default now()
      );



  create table "analytics"."session_metrics" (
    "session_metrics_id" uuid not null,
    "work_session_id" uuid not null,
    "gross_earnings" numeric(10,2) not null default 0,
    "net_earnings" numeric(10,2) not null default 0,
    "tips" numeric(10,2) not null default 0,
    "bonuses" numeric(10,2) not null default 0,
    "active_hours" numeric(8,2) not null default 0,
    "idle_hours" numeric(8,2) not null default 0,
    "total_miles" numeric(10,2) not null default 0,
    "deadhead_miles" numeric(10,2) not null default 0,
    "earnings_per_hour" numeric(10,2),
    "earnings_per_active_hour" numeric(10,2),
    "earnings_per_mile" numeric(10,2),
    "acceptance_rate" numeric(5,2),
    "completion_rate" numeric(5,2),
    "avg_offer_value" numeric(10,2),
    "avg_wait_time_minutes" numeric(8,2),
    "computed_at" timestamp with time zone not null default now()
      );



  create table "analytics"."zone_performance_snapshot" (
    "zone_performance_snapshot_id" uuid not null,
    "zone_id" uuid not null,
    "platform_id" uuid,
    "snapshot_date" date not null,
    "hour_block" smallint not null,
    "avg_offer_count" numeric(10,2),
    "avg_earnings_per_hour" numeric(10,2),
    "avg_earnings_per_mile" numeric(10,2),
    "avg_tip_rate" numeric(5,2),
    "avg_wait_minutes" numeric(8,2),
    "avg_deadhead_miles" numeric(10,2),
    "offer_acceptance_rate" numeric(5,2),
    "computed_at" timestamp with time zone not null default now()
      );



  create table "core"."asset" (
    "asset_id" uuid not null,
    "asset_type" character varying(30) not null,
    "file_name" character varying(255) not null,
    "mime_type" character varying(100),
    "storage_uri" text not null,
    "file_size_bytes" bigint,
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."capture_event" (
    "capture_event_id" uuid not null,
    "driver_id" uuid not null,
    "platform_account_id" uuid,
    "captured_at" timestamp with time zone not null,
    "capture_type" character varying(50) not null,
    "source_app_name" character varying(100),
    "raw_text_payload" text,
    "raw_json_payload" jsonb,
    "parsed_successfully" boolean not null default false,
    "parse_confidence_score" numeric(5,2),
    "asset_id" uuid,
    "processing_status" character varying(30) not null default 'pending'::character varying,
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."decision_rule" (
    "rule_id" uuid not null,
    "driver_id" uuid not null,
    "platform_id" uuid,
    "rule_name" character varying(150) not null,
    "priority_order" integer not null,
    "is_active" boolean not null default true,
    "rule_type" character varying(30) not null,
    "condition_expression" text not null,
    "action_expression" text not null,
    "effective_start" timestamp with time zone not null,
    "effective_end" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."delivery_issue" (
    "delivery_issue_id" uuid not null,
    "delivery_order_id" uuid not null,
    "issue_type" character varying(50) not null,
    "issue_severity" character varying(20),
    "reported_at" timestamp with time zone not null,
    "resolved_at" timestamp with time zone,
    "resolution_type" character varying(50),
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."delivery_order" (
    "delivery_order_id" uuid not null,
    "offer_id" uuid not null,
    "platform_account_id" uuid not null,
    "work_session_id" uuid not null,
    "accepted_at" timestamp with time zone not null,
    "pickup_arrived_at" timestamp with time zone,
    "pickup_completed_at" timestamp with time zone,
    "dropoff_arrived_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "delivery_status" character varying(30) not null,
    "merchant_id" uuid,
    "pickup_location_id" uuid,
    "dropoff_location_id" uuid,
    "actual_distance_miles" numeric(8,2),
    "actual_duration_minutes" numeric(8,2),
    "customer_tip_final" numeric(10,2),
    "base_pay_final" numeric(10,2),
    "bonus_pay_final" numeric(10,2),
    "total_payout_final" numeric(10,2),
    "cancellation_pay" numeric(10,2),
    "customer_rating_impact" numeric(4,2),
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."delivery_stop" (
    "delivery_stop_id" uuid not null,
    "delivery_order_id" uuid not null,
    "stop_type" character varying(20) not null,
    "sequence_number" integer not null,
    "merchant_id" uuid,
    "location_id" uuid not null,
    "planned_arrival_time" timestamp with time zone,
    "actual_arrival_time" timestamp with time zone,
    "actual_departure_time" timestamp with time zone,
    "status" character varying(30),
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."driver" (
    "driver_id" uuid not null,
    "first_name" character varying(100),
    "last_name" character varying(100),
    "display_name" character varying(150),
    "email" character varying(255),
    "phone" character varying(30),
    "home_market_id" uuid,
    "time_zone" character varying(100) not null,
    "preferred_currency" character(3) not null default 'USD'::bpchar,
    "status" character varying(30) not null default 'active'::character varying,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."earning_event" (
    "earning_event_id" uuid not null,
    "platform_account_id" uuid not null,
    "work_session_id" uuid,
    "delivery_order_id" uuid,
    "event_time" timestamp with time zone not null,
    "earning_type" character varying(50) not null,
    "amount" numeric(10,2) not null,
    "currency_code" character(3) not null default 'USD'::bpchar,
    "is_estimated" boolean not null default false,
    "source_reference" character varying(255),
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."entity_attribute" (
    "entity_attribute_id" uuid not null,
    "entity_name" character varying(100) not null,
    "entity_id" uuid not null,
    "attribute_name" character varying(100) not null,
    "attribute_value_text" text,
    "attribute_value_number" numeric(18,4),
    "attribute_value_boolean" boolean,
    "source" character varying(50),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."expense" (
    "expense_id" uuid not null,
    "driver_id" uuid not null,
    "vehicle_id" uuid,
    "work_session_id" uuid,
    "expense_time" timestamp with time zone not null,
    "expense_category" character varying(50) not null,
    "amount" numeric(10,2) not null,
    "currency_code" character(3) not null default 'USD'::bpchar,
    "vendor_name" character varying(200),
    "location_id" uuid,
    "is_recurring" boolean not null default false,
    "receipt_asset_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."location" (
    "location_id" uuid not null,
    "address_line_1" character varying(200),
    "address_line_2" character varying(200),
    "city" character varying(100),
    "state_region" character varying(100),
    "postal_code" character varying(20),
    "country_code" character(2) not null default 'US'::bpchar,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "location_type" character varying(50),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."market" (
    "market_id" uuid not null,
    "market_name" character varying(150) not null,
    "state_region" character varying(100),
    "country_code" character(2) not null default 'US'::bpchar,
    "time_zone" character varying(100) not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."merchant" (
    "merchant_id" uuid not null,
    "platform_id" uuid,
    "merchant_name" character varying(200) not null,
    "merchant_category" character varying(100),
    "location_id" uuid,
    "is_chain" boolean not null default false,
    "chain_name" character varying(200),
    "active_flag" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."mileage_log" (
    "mileage_log_id" uuid not null,
    "driver_id" uuid not null,
    "vehicle_id" uuid not null,
    "work_session_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "start_odometer" numeric(10,2),
    "end_odometer" numeric(10,2),
    "distance_miles" numeric(10,2) not null,
    "mileage_type" character varying(30) not null,
    "source_type" character varying(30) not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."offer" (
    "offer_id" uuid not null,
    "platform_account_id" uuid not null,
    "work_session_id" uuid not null,
    "capture_event_id" uuid,
    "offer_received_at" timestamp with time zone not null,
    "offer_expires_at" timestamp with time zone,
    "offer_source_type" character varying(30) not null,
    "offer_type" character varying(30) not null,
    "display_amount" numeric(10,2),
    "display_tip_included" boolean,
    "estimated_distance_miles" numeric(8,2),
    "estimated_duration_minutes" numeric(8,2),
    "pickup_count" integer not null default 1,
    "dropoff_count" integer not null default 1,
    "merchant_count" integer not null default 1,
    "is_shop_and_pay" boolean not null default false,
    "is_alcohol" boolean not null default false,
    "is_large_order" boolean not null default false,
    "surge_amount" numeric(10,2),
    "boost_amount" numeric(10,2),
    "peak_pay_amount" numeric(10,2),
    "guaranteed_minimum" numeric(10,2),
    "origin_location_id" uuid,
    "destination_location_id" uuid,
    "current_driver_location_id" uuid,
    "raw_offer_text" text,
    "confidence_score" numeric(5,2),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."offer_decision" (
    "offer_decision_id" uuid not null,
    "offer_id" uuid not null,
    "decision_time" timestamp with time zone not null,
    "system_recommendation" character varying(20),
    "system_score" numeric(8,4),
    "driver_action" character varying(20) not null,
    "action_source" character varying(30) not null,
    "decision_reason_code" character varying(100),
    "decision_reason_text" text,
    "seconds_to_decision" integer,
    "was_rule_applied" boolean not null default false,
    "rule_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."offer_dropoff" (
    "offer_dropoff_id" uuid not null,
    "offer_id" uuid not null,
    "sequence_number" integer not null,
    "dropoff_location_id" uuid not null,
    "estimated_dropoff_pay_component" numeric(10,2),
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."offer_merchant" (
    "offer_merchant_id" uuid not null,
    "offer_id" uuid not null,
    "merchant_id" uuid not null,
    "sequence_number" integer not null,
    "pickup_location_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."platform" (
    "platform_id" uuid not null,
    "platform_name" character varying(100) not null,
    "platform_type" character varying(50) not null,
    "supports_offer_capture" boolean not null default false,
    "supports_manual_import" boolean not null default true,
    "supports_csv_import" boolean not null default false,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."platform_account" (
    "platform_account_id" uuid not null,
    "driver_id" uuid not null,
    "platform_id" uuid not null,
    "account_display_name" character varying(150),
    "external_account_reference" character varying(255),
    "market_id" uuid,
    "status" character varying(30) not null default 'active'::character varying,
    "connected_at" timestamp with time zone,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."rule_execution_log" (
    "rule_execution_log_id" uuid not null,
    "rule_id" uuid not null,
    "offer_id" uuid not null,
    "executed_at" timestamp with time zone not null,
    "was_match" boolean not null,
    "execution_result" character varying(50),
    "result_score_delta" numeric(8,4),
    "debug_payload" jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "core"."session_platform_status" (
    "session_platform_status_id" uuid not null,
    "work_session_id" uuid not null,
    "platform_account_id" uuid not null,
    "is_online" boolean not null default true,
    "online_start_time" timestamp with time zone not null,
    "online_end_time" timestamp with time zone,
    "pause_reason" character varying(100),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."vehicle" (
    "vehicle_id" uuid not null,
    "driver_id" uuid not null,
    "nickname" character varying(100),
    "year" integer,
    "make" character varying(100),
    "model" character varying(100),
    "license_plate" character varying(30),
    "fuel_type" character varying(30),
    "mpg_estimate" numeric(6,2),
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."work_session" (
    "work_session_id" uuid not null,
    "driver_id" uuid not null,
    "vehicle_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone,
    "session_status" character varying(30) not null default 'active'::character varying,
    "start_location_id" uuid,
    "end_location_id" uuid,
    "market_id" uuid not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "core"."zone" (
    "zone_id" uuid not null,
    "market_id" uuid not null,
    "zone_name" character varying(150) not null,
    "zone_type" character varying(30) not null,
    "geofence_definition" jsonb not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."delivery_platform_accounts" enable row level security;

alter table "public"."shifts" enable row level security;

alter table "public"."users" enable row level security;

CREATE INDEX idx_merchant_snapshot_lookup ON analytics.merchant_performance_snapshot USING btree (merchant_id, snapshot_date);

CREATE INDEX idx_zone_snapshot_lookup ON analytics.zone_performance_snapshot USING btree (zone_id, snapshot_date, hour_block);

CREATE UNIQUE INDEX merchant_performance_snapshot_merchant_id_snapshot_date_key ON analytics.merchant_performance_snapshot USING btree (merchant_id, snapshot_date);

CREATE UNIQUE INDEX merchant_performance_snapshot_pkey ON analytics.merchant_performance_snapshot USING btree (merchant_performance_snapshot_id);

CREATE UNIQUE INDEX session_metrics_pkey ON analytics.session_metrics USING btree (session_metrics_id);

CREATE UNIQUE INDEX session_metrics_work_session_id_key ON analytics.session_metrics USING btree (work_session_id);

CREATE UNIQUE INDEX zone_performance_snapshot_pkey ON analytics.zone_performance_snapshot USING btree (zone_performance_snapshot_id);

CREATE UNIQUE INDEX zone_performance_snapshot_zone_id_platform_id_snapshot_date_key ON analytics.zone_performance_snapshot USING btree (zone_id, platform_id, snapshot_date, hour_block);

CREATE UNIQUE INDEX asset_pkey ON core.asset USING btree (asset_id);

CREATE UNIQUE INDEX capture_event_pkey ON core.capture_event USING btree (capture_event_id);

CREATE UNIQUE INDEX decision_rule_driver_id_rule_name_key ON core.decision_rule USING btree (driver_id, rule_name);

CREATE UNIQUE INDEX decision_rule_pkey ON core.decision_rule USING btree (rule_id);

CREATE UNIQUE INDEX delivery_issue_pkey ON core.delivery_issue USING btree (delivery_issue_id);

CREATE UNIQUE INDEX delivery_order_offer_id_key ON core.delivery_order USING btree (offer_id);

CREATE UNIQUE INDEX delivery_order_pkey ON core.delivery_order USING btree (delivery_order_id);

CREATE UNIQUE INDEX delivery_stop_delivery_order_id_sequence_number_key ON core.delivery_stop USING btree (delivery_order_id, sequence_number);

CREATE UNIQUE INDEX delivery_stop_pkey ON core.delivery_stop USING btree (delivery_stop_id);

CREATE UNIQUE INDEX driver_email_key ON core.driver USING btree (email);

CREATE UNIQUE INDEX driver_pkey ON core.driver USING btree (driver_id);

CREATE UNIQUE INDEX earning_event_pkey ON core.earning_event USING btree (earning_event_id);

CREATE UNIQUE INDEX entity_attribute_entity_name_entity_id_attribute_name_key ON core.entity_attribute USING btree (entity_name, entity_id, attribute_name);

CREATE UNIQUE INDEX entity_attribute_pkey ON core.entity_attribute USING btree (entity_attribute_id);

CREATE UNIQUE INDEX expense_pkey ON core.expense USING btree (expense_id);

CREATE INDEX idx_capture_event_driver_captured ON core.capture_event USING btree (driver_id, captured_at DESC);

CREATE INDEX idx_capture_event_raw_json_gin ON core.capture_event USING gin (raw_json_payload);

CREATE INDEX idx_delivery_order_session_accepted ON core.delivery_order USING btree (work_session_id, accepted_at DESC);

CREATE INDEX idx_delivery_order_status ON core.delivery_order USING btree (delivery_status);

CREATE INDEX idx_earning_event_order ON core.earning_event USING btree (delivery_order_id);

CREATE INDEX idx_earning_event_session_time ON core.earning_event USING btree (work_session_id, event_time DESC);

CREATE INDEX idx_entity_attribute_lookup ON core.entity_attribute USING btree (entity_name, entity_id);

CREATE INDEX idx_expense_driver_time ON core.expense USING btree (driver_id, expense_time DESC);

CREATE INDEX idx_mileage_log_driver_time ON core.mileage_log USING btree (driver_id, start_time DESC);

CREATE INDEX idx_offer_decision_action ON core.offer_decision USING btree (driver_action);

CREATE INDEX idx_offer_platform_account_received ON core.offer USING btree (platform_account_id, offer_received_at DESC);

CREATE INDEX idx_offer_session_received ON core.offer USING btree (work_session_id, offer_received_at DESC);

CREATE INDEX idx_platform_account_driver_platform ON core.platform_account USING btree (driver_id, platform_id);

CREATE INDEX idx_rule_driver_active_priority ON core.decision_rule USING btree (driver_id, is_active, priority_order);

CREATE INDEX idx_rule_execution_debug_payload_gin ON core.rule_execution_log USING gin (debug_payload);

CREATE INDEX idx_rule_execution_offer ON core.rule_execution_log USING btree (offer_id);

CREATE INDEX idx_work_session_driver_start ON core.work_session USING btree (driver_id, start_time DESC);

CREATE INDEX idx_zone_geofence_gin ON core.zone USING gin (geofence_definition);

CREATE UNIQUE INDEX location_pkey ON core.location USING btree (location_id);

CREATE UNIQUE INDEX market_market_name_state_region_country_code_key ON core.market USING btree (market_name, state_region, country_code);

CREATE UNIQUE INDEX market_pkey ON core.market USING btree (market_id);

CREATE UNIQUE INDEX merchant_pkey ON core.merchant USING btree (merchant_id);

CREATE UNIQUE INDEX mileage_log_pkey ON core.mileage_log USING btree (mileage_log_id);

CREATE UNIQUE INDEX offer_decision_offer_id_key ON core.offer_decision USING btree (offer_id);

CREATE UNIQUE INDEX offer_decision_pkey ON core.offer_decision USING btree (offer_decision_id);

CREATE UNIQUE INDEX offer_dropoff_offer_id_sequence_number_key ON core.offer_dropoff USING btree (offer_id, sequence_number);

CREATE UNIQUE INDEX offer_dropoff_pkey ON core.offer_dropoff USING btree (offer_dropoff_id);

CREATE UNIQUE INDEX offer_merchant_offer_id_sequence_number_key ON core.offer_merchant USING btree (offer_id, sequence_number);

CREATE UNIQUE INDEX offer_merchant_pkey ON core.offer_merchant USING btree (offer_merchant_id);

CREATE UNIQUE INDEX offer_pkey ON core.offer USING btree (offer_id);

CREATE UNIQUE INDEX platform_account_driver_id_platform_id_account_display_name_key ON core.platform_account USING btree (driver_id, platform_id, account_display_name);

CREATE UNIQUE INDEX platform_account_pkey ON core.platform_account USING btree (platform_account_id);

CREATE UNIQUE INDEX platform_pkey ON core.platform USING btree (platform_id);

CREATE UNIQUE INDEX platform_platform_name_key ON core.platform USING btree (platform_name);

CREATE UNIQUE INDEX rule_execution_log_pkey ON core.rule_execution_log USING btree (rule_execution_log_id);

CREATE UNIQUE INDEX session_platform_status_pkey ON core.session_platform_status USING btree (session_platform_status_id);

CREATE UNIQUE INDEX vehicle_pkey ON core.vehicle USING btree (vehicle_id);

CREATE UNIQUE INDEX work_session_pkey ON core.work_session USING btree (work_session_id);

CREATE UNIQUE INDEX zone_market_id_zone_name_key ON core.zone USING btree (market_id, zone_name);

CREATE UNIQUE INDEX zone_pkey ON core.zone USING btree (zone_id);

alter table "analytics"."merchant_performance_snapshot" add constraint "merchant_performance_snapshot_pkey" PRIMARY KEY using index "merchant_performance_snapshot_pkey";

alter table "analytics"."session_metrics" add constraint "session_metrics_pkey" PRIMARY KEY using index "session_metrics_pkey";

alter table "analytics"."zone_performance_snapshot" add constraint "zone_performance_snapshot_pkey" PRIMARY KEY using index "zone_performance_snapshot_pkey";

alter table "core"."asset" add constraint "asset_pkey" PRIMARY KEY using index "asset_pkey";

alter table "core"."capture_event" add constraint "capture_event_pkey" PRIMARY KEY using index "capture_event_pkey";

alter table "core"."decision_rule" add constraint "decision_rule_pkey" PRIMARY KEY using index "decision_rule_pkey";

alter table "core"."delivery_issue" add constraint "delivery_issue_pkey" PRIMARY KEY using index "delivery_issue_pkey";

alter table "core"."delivery_order" add constraint "delivery_order_pkey" PRIMARY KEY using index "delivery_order_pkey";

alter table "core"."delivery_stop" add constraint "delivery_stop_pkey" PRIMARY KEY using index "delivery_stop_pkey";

alter table "core"."driver" add constraint "driver_pkey" PRIMARY KEY using index "driver_pkey";

alter table "core"."earning_event" add constraint "earning_event_pkey" PRIMARY KEY using index "earning_event_pkey";

alter table "core"."entity_attribute" add constraint "entity_attribute_pkey" PRIMARY KEY using index "entity_attribute_pkey";

alter table "core"."expense" add constraint "expense_pkey" PRIMARY KEY using index "expense_pkey";

alter table "core"."location" add constraint "location_pkey" PRIMARY KEY using index "location_pkey";

alter table "core"."market" add constraint "market_pkey" PRIMARY KEY using index "market_pkey";

alter table "core"."merchant" add constraint "merchant_pkey" PRIMARY KEY using index "merchant_pkey";

alter table "core"."mileage_log" add constraint "mileage_log_pkey" PRIMARY KEY using index "mileage_log_pkey";

alter table "core"."offer" add constraint "offer_pkey" PRIMARY KEY using index "offer_pkey";

alter table "core"."offer_decision" add constraint "offer_decision_pkey" PRIMARY KEY using index "offer_decision_pkey";

alter table "core"."offer_dropoff" add constraint "offer_dropoff_pkey" PRIMARY KEY using index "offer_dropoff_pkey";

alter table "core"."offer_merchant" add constraint "offer_merchant_pkey" PRIMARY KEY using index "offer_merchant_pkey";

alter table "core"."platform" add constraint "platform_pkey" PRIMARY KEY using index "platform_pkey";

alter table "core"."platform_account" add constraint "platform_account_pkey" PRIMARY KEY using index "platform_account_pkey";

alter table "core"."rule_execution_log" add constraint "rule_execution_log_pkey" PRIMARY KEY using index "rule_execution_log_pkey";

alter table "core"."session_platform_status" add constraint "session_platform_status_pkey" PRIMARY KEY using index "session_platform_status_pkey";

alter table "core"."vehicle" add constraint "vehicle_pkey" PRIMARY KEY using index "vehicle_pkey";

alter table "core"."work_session" add constraint "work_session_pkey" PRIMARY KEY using index "work_session_pkey";

alter table "core"."zone" add constraint "zone_pkey" PRIMARY KEY using index "zone_pkey";

alter table "analytics"."merchant_performance_snapshot" add constraint "merchant_performance_snapshot_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES core.merchant(merchant_id) ON DELETE CASCADE not valid;

alter table "analytics"."merchant_performance_snapshot" validate constraint "merchant_performance_snapshot_merchant_id_fkey";

alter table "analytics"."merchant_performance_snapshot" add constraint "merchant_performance_snapshot_merchant_id_snapshot_date_key" UNIQUE using index "merchant_performance_snapshot_merchant_id_snapshot_date_key";

alter table "analytics"."session_metrics" add constraint "session_metrics_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE CASCADE not valid;

alter table "analytics"."session_metrics" validate constraint "session_metrics_work_session_id_fkey";

alter table "analytics"."session_metrics" add constraint "session_metrics_work_session_id_key" UNIQUE using index "session_metrics_work_session_id_key";

alter table "analytics"."zone_performance_snapshot" add constraint "chk_hour_block" CHECK (((hour_block >= 0) AND (hour_block <= 23))) not valid;

alter table "analytics"."zone_performance_snapshot" validate constraint "chk_hour_block";

alter table "analytics"."zone_performance_snapshot" add constraint "zone_performance_snapshot_platform_id_fkey" FOREIGN KEY (platform_id) REFERENCES core.platform(platform_id) ON DELETE SET NULL not valid;

alter table "analytics"."zone_performance_snapshot" validate constraint "zone_performance_snapshot_platform_id_fkey";

alter table "analytics"."zone_performance_snapshot" add constraint "zone_performance_snapshot_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES core.zone(zone_id) ON DELETE CASCADE not valid;

alter table "analytics"."zone_performance_snapshot" validate constraint "zone_performance_snapshot_zone_id_fkey";

alter table "analytics"."zone_performance_snapshot" add constraint "zone_performance_snapshot_zone_id_platform_id_snapshot_date_key" UNIQUE using index "zone_performance_snapshot_zone_id_platform_id_snapshot_date_key";

alter table "core"."asset" add constraint "chk_asset_type" CHECK (((asset_type)::text = ANY ((ARRAY['image'::character varying, 'receipt'::character varying, 'export_file'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."asset" validate constraint "chk_asset_type";

alter table "core"."capture_event" add constraint "capture_event_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES core.asset(asset_id) not valid;

alter table "core"."capture_event" validate constraint "capture_event_asset_id_fkey";

alter table "core"."capture_event" add constraint "capture_event_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."capture_event" validate constraint "capture_event_driver_id_fkey";

alter table "core"."capture_event" add constraint "capture_event_platform_account_id_fkey" FOREIGN KEY (platform_account_id) REFERENCES core.platform_account(platform_account_id) ON DELETE SET NULL not valid;

alter table "core"."capture_event" validate constraint "capture_event_platform_account_id_fkey";

alter table "core"."capture_event" add constraint "chk_capture_type" CHECK (((capture_type)::text = ANY ((ARRAY['screenshot'::character varying, 'ocr'::character varying, 'accessibility_text'::character varying, 'manual_entry'::character varying, 'csv_import'::character varying, 'api_import'::character varying])::text[]))) not valid;

alter table "core"."capture_event" validate constraint "chk_capture_type";

alter table "core"."capture_event" add constraint "chk_parse_confidence" CHECK (((parse_confidence_score IS NULL) OR ((parse_confidence_score >= (0)::numeric) AND (parse_confidence_score <= (100)::numeric)))) not valid;

alter table "core"."capture_event" validate constraint "chk_parse_confidence";

alter table "core"."capture_event" add constraint "chk_processing_status" CHECK (((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'parsed'::character varying, 'failed'::character varying, 'ignored'::character varying])::text[]))) not valid;

alter table "core"."capture_event" validate constraint "chk_processing_status";

alter table "core"."decision_rule" add constraint "chk_rule_effective" CHECK (((effective_end IS NULL) OR (effective_end >= effective_start))) not valid;

alter table "core"."decision_rule" validate constraint "chk_rule_effective";

alter table "core"."decision_rule" add constraint "chk_rule_type" CHECK (((rule_type)::text = ANY ((ARRAY['accept'::character varying, 'reject'::character varying, 'warn'::character varying, 'score_modifier'::character varying])::text[]))) not valid;

alter table "core"."decision_rule" validate constraint "chk_rule_type";

alter table "core"."decision_rule" add constraint "decision_rule_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."decision_rule" validate constraint "decision_rule_driver_id_fkey";

alter table "core"."decision_rule" add constraint "decision_rule_driver_id_rule_name_key" UNIQUE using index "decision_rule_driver_id_rule_name_key";

alter table "core"."decision_rule" add constraint "decision_rule_platform_id_fkey" FOREIGN KEY (platform_id) REFERENCES core.platform(platform_id) ON DELETE SET NULL not valid;

alter table "core"."decision_rule" validate constraint "decision_rule_platform_id_fkey";

alter table "core"."delivery_issue" add constraint "chk_issue_severity" CHECK (((issue_severity IS NULL) OR ((issue_severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))) not valid;

alter table "core"."delivery_issue" validate constraint "chk_issue_severity";

alter table "core"."delivery_issue" add constraint "chk_issue_time" CHECK (((resolved_at IS NULL) OR (resolved_at >= reported_at))) not valid;

alter table "core"."delivery_issue" validate constraint "chk_issue_time";

alter table "core"."delivery_issue" add constraint "chk_issue_type" CHECK (((issue_type)::text = ANY ((ARRAY['long_wait'::character varying, 'closed_store'::character varying, 'address_problem'::character varying, 'customer_unreachable'::character varying, 'order_not_ready'::character varying, 'app_glitch'::character varying, 'traffic_delay'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."delivery_issue" validate constraint "chk_issue_type";

alter table "core"."delivery_issue" add constraint "delivery_issue_delivery_order_id_fkey" FOREIGN KEY (delivery_order_id) REFERENCES core.delivery_order(delivery_order_id) ON DELETE CASCADE not valid;

alter table "core"."delivery_issue" validate constraint "delivery_issue_delivery_order_id_fkey";

alter table "core"."delivery_order" add constraint "chk_delivery_status" CHECK (((delivery_status)::text = ANY ((ARRAY['accepted'::character varying, 'en_route_pickup'::character varying, 'picked_up'::character varying, 'en_route_dropoff'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."delivery_order" validate constraint "chk_delivery_status";

alter table "core"."delivery_order" add constraint "delivery_order_dropoff_location_id_fkey" FOREIGN KEY (dropoff_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_dropoff_location_id_fkey";

alter table "core"."delivery_order" add constraint "delivery_order_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES core.merchant(merchant_id) not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_merchant_id_fkey";

alter table "core"."delivery_order" add constraint "delivery_order_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES core.offer(offer_id) ON DELETE CASCADE not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_offer_id_fkey";

alter table "core"."delivery_order" add constraint "delivery_order_offer_id_key" UNIQUE using index "delivery_order_offer_id_key";

alter table "core"."delivery_order" add constraint "delivery_order_pickup_location_id_fkey" FOREIGN KEY (pickup_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_pickup_location_id_fkey";

alter table "core"."delivery_order" add constraint "delivery_order_platform_account_id_fkey" FOREIGN KEY (platform_account_id) REFERENCES core.platform_account(platform_account_id) ON DELETE CASCADE not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_platform_account_id_fkey";

alter table "core"."delivery_order" add constraint "delivery_order_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE CASCADE not valid;

alter table "core"."delivery_order" validate constraint "delivery_order_work_session_id_fkey";

alter table "core"."delivery_stop" add constraint "chk_stop_type" CHECK (((stop_type)::text = ANY ((ARRAY['pickup'::character varying, 'dropoff'::character varying])::text[]))) not valid;

alter table "core"."delivery_stop" validate constraint "chk_stop_type";

alter table "core"."delivery_stop" add constraint "delivery_stop_delivery_order_id_fkey" FOREIGN KEY (delivery_order_id) REFERENCES core.delivery_order(delivery_order_id) ON DELETE CASCADE not valid;

alter table "core"."delivery_stop" validate constraint "delivery_stop_delivery_order_id_fkey";

alter table "core"."delivery_stop" add constraint "delivery_stop_delivery_order_id_sequence_number_key" UNIQUE using index "delivery_stop_delivery_order_id_sequence_number_key";

alter table "core"."delivery_stop" add constraint "delivery_stop_location_id_fkey" FOREIGN KEY (location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."delivery_stop" validate constraint "delivery_stop_location_id_fkey";

alter table "core"."delivery_stop" add constraint "delivery_stop_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES core.merchant(merchant_id) not valid;

alter table "core"."delivery_stop" validate constraint "delivery_stop_merchant_id_fkey";

alter table "core"."driver" add constraint "chk_driver_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'deleted'::character varying])::text[]))) not valid;

alter table "core"."driver" validate constraint "chk_driver_status";

alter table "core"."driver" add constraint "driver_email_key" UNIQUE using index "driver_email_key";

alter table "core"."driver" add constraint "driver_home_market_id_fkey" FOREIGN KEY (home_market_id) REFERENCES core.market(market_id) not valid;

alter table "core"."driver" validate constraint "driver_home_market_id_fkey";

alter table "core"."earning_event" add constraint "chk_earning_type" CHECK (((earning_type)::text = ANY ((ARRAY['base_pay'::character varying, 'tip'::character varying, 'surge'::character varying, 'boost'::character varying, 'peak_pay'::character varying, 'quest_bonus'::character varying, 'promo_bonus'::character varying, 'adjustment'::character varying, 'cancellation_pay'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."earning_event" validate constraint "chk_earning_type";

alter table "core"."earning_event" add constraint "earning_event_delivery_order_id_fkey" FOREIGN KEY (delivery_order_id) REFERENCES core.delivery_order(delivery_order_id) ON DELETE SET NULL not valid;

alter table "core"."earning_event" validate constraint "earning_event_delivery_order_id_fkey";

alter table "core"."earning_event" add constraint "earning_event_platform_account_id_fkey" FOREIGN KEY (platform_account_id) REFERENCES core.platform_account(platform_account_id) ON DELETE CASCADE not valid;

alter table "core"."earning_event" validate constraint "earning_event_platform_account_id_fkey";

alter table "core"."earning_event" add constraint "earning_event_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE SET NULL not valid;

alter table "core"."earning_event" validate constraint "earning_event_work_session_id_fkey";

alter table "core"."entity_attribute" add constraint "entity_attribute_entity_name_entity_id_attribute_name_key" UNIQUE using index "entity_attribute_entity_name_entity_id_attribute_name_key";

alter table "core"."expense" add constraint "chk_expense_amount" CHECK ((amount >= (0)::numeric)) not valid;

alter table "core"."expense" validate constraint "chk_expense_amount";

alter table "core"."expense" add constraint "chk_expense_category" CHECK (((expense_category)::text = ANY ((ARRAY['fuel'::character varying, 'maintenance'::character varying, 'insurance'::character varying, 'phone'::character varying, 'car_wash'::character varying, 'parking'::character varying, 'tolls'::character varying, 'supplies'::character varying, 'subscription'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."expense" validate constraint "chk_expense_category";

alter table "core"."expense" add constraint "expense_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."expense" validate constraint "expense_driver_id_fkey";

alter table "core"."expense" add constraint "expense_location_id_fkey" FOREIGN KEY (location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."expense" validate constraint "expense_location_id_fkey";

alter table "core"."expense" add constraint "expense_receipt_asset_id_fkey" FOREIGN KEY (receipt_asset_id) REFERENCES core.asset(asset_id) not valid;

alter table "core"."expense" validate constraint "expense_receipt_asset_id_fkey";

alter table "core"."expense" add constraint "expense_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES core.vehicle(vehicle_id) ON DELETE SET NULL not valid;

alter table "core"."expense" validate constraint "expense_vehicle_id_fkey";

alter table "core"."expense" add constraint "expense_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE SET NULL not valid;

alter table "core"."expense" validate constraint "expense_work_session_id_fkey";

alter table "core"."location" add constraint "chk_location_type" CHECK (((location_type IS NULL) OR ((location_type)::text = ANY ((ARRAY['merchant'::character varying, 'customer'::character varying, 'hotspot'::character varying, 'home'::character varying, 'gas_station'::character varying, 'parking_zone'::character varying, 'other'::character varying])::text[])))) not valid;

alter table "core"."location" validate constraint "chk_location_type";

alter table "core"."market" add constraint "market_market_name_state_region_country_code_key" UNIQUE using index "market_market_name_state_region_country_code_key";

alter table "core"."merchant" add constraint "merchant_location_id_fkey" FOREIGN KEY (location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."merchant" validate constraint "merchant_location_id_fkey";

alter table "core"."merchant" add constraint "merchant_platform_id_fkey" FOREIGN KEY (platform_id) REFERENCES core.platform(platform_id) not valid;

alter table "core"."merchant" validate constraint "merchant_platform_id_fkey";

alter table "core"."mileage_log" add constraint "chk_distance_miles" CHECK ((distance_miles >= (0)::numeric)) not valid;

alter table "core"."mileage_log" validate constraint "chk_distance_miles";

alter table "core"."mileage_log" add constraint "chk_mileage_source_type" CHECK (((source_type)::text = ANY ((ARRAY['gps'::character varying, 'manual'::character varying, 'calculated'::character varying, 'import'::character varying])::text[]))) not valid;

alter table "core"."mileage_log" validate constraint "chk_mileage_source_type";

alter table "core"."mileage_log" add constraint "chk_mileage_time" CHECK ((end_time >= start_time)) not valid;

alter table "core"."mileage_log" validate constraint "chk_mileage_time";

alter table "core"."mileage_log" add constraint "chk_mileage_type" CHECK (((mileage_type)::text = ANY ((ARRAY['active_delivery'::character varying, 'deadhead'::character varying, 'positioning'::character varying, 'personal'::character varying, 'commute'::character varying])::text[]))) not valid;

alter table "core"."mileage_log" validate constraint "chk_mileage_type";

alter table "core"."mileage_log" add constraint "chk_odometer" CHECK (((start_odometer IS NULL) OR (end_odometer IS NULL) OR (end_odometer >= start_odometer))) not valid;

alter table "core"."mileage_log" validate constraint "chk_odometer";

alter table "core"."mileage_log" add constraint "mileage_log_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."mileage_log" validate constraint "mileage_log_driver_id_fkey";

alter table "core"."mileage_log" add constraint "mileage_log_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES core.vehicle(vehicle_id) ON DELETE CASCADE not valid;

alter table "core"."mileage_log" validate constraint "mileage_log_vehicle_id_fkey";

alter table "core"."mileage_log" add constraint "mileage_log_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE SET NULL not valid;

alter table "core"."mileage_log" validate constraint "mileage_log_work_session_id_fkey";

alter table "core"."offer" add constraint "chk_offer_confidence" CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (100)::numeric)))) not valid;

alter table "core"."offer" validate constraint "chk_offer_confidence";

alter table "core"."offer" add constraint "chk_offer_counts" CHECK (((pickup_count >= 0) AND (dropoff_count >= 0) AND (merchant_count >= 0))) not valid;

alter table "core"."offer" validate constraint "chk_offer_counts";

alter table "core"."offer" add constraint "chk_offer_expiry" CHECK (((offer_expires_at IS NULL) OR (offer_expires_at >= offer_received_at))) not valid;

alter table "core"."offer" validate constraint "chk_offer_expiry";

alter table "core"."offer" add constraint "chk_offer_source_type" CHECK (((offer_source_type)::text = ANY ((ARRAY['screen_capture'::character varying, 'manual_entry'::character varying, 'ocr'::character varying, 'import'::character varying, 'api'::character varying])::text[]))) not valid;

alter table "core"."offer" validate constraint "chk_offer_source_type";

alter table "core"."offer" add constraint "chk_offer_type" CHECK (((offer_type)::text = ANY ((ARRAY['single'::character varying, 'stacked'::character varying, 'batched'::character varying, 'add_on'::character varying])::text[]))) not valid;

alter table "core"."offer" validate constraint "chk_offer_type";

alter table "core"."offer" add constraint "offer_capture_event_id_fkey" FOREIGN KEY (capture_event_id) REFERENCES core.capture_event(capture_event_id) ON DELETE SET NULL not valid;

alter table "core"."offer" validate constraint "offer_capture_event_id_fkey";

alter table "core"."offer" add constraint "offer_current_driver_location_id_fkey" FOREIGN KEY (current_driver_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."offer" validate constraint "offer_current_driver_location_id_fkey";

alter table "core"."offer" add constraint "offer_destination_location_id_fkey" FOREIGN KEY (destination_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."offer" validate constraint "offer_destination_location_id_fkey";

alter table "core"."offer" add constraint "offer_origin_location_id_fkey" FOREIGN KEY (origin_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."offer" validate constraint "offer_origin_location_id_fkey";

alter table "core"."offer" add constraint "offer_platform_account_id_fkey" FOREIGN KEY (platform_account_id) REFERENCES core.platform_account(platform_account_id) ON DELETE CASCADE not valid;

alter table "core"."offer" validate constraint "offer_platform_account_id_fkey";

alter table "core"."offer" add constraint "offer_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE CASCADE not valid;

alter table "core"."offer" validate constraint "offer_work_session_id_fkey";

alter table "core"."offer_decision" add constraint "chk_action_source" CHECK (((action_source)::text = ANY ((ARRAY['manual'::character varying, 'automation_rule'::character varying, 'assisted_tap'::character varying, 'system_default'::character varying])::text[]))) not valid;

alter table "core"."offer_decision" validate constraint "chk_action_source";

alter table "core"."offer_decision" add constraint "chk_driver_action" CHECK (((driver_action)::text = ANY ((ARRAY['accepted'::character varying, 'rejected'::character varying, 'timed_out'::character varying, 'missed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."offer_decision" validate constraint "chk_driver_action";

alter table "core"."offer_decision" add constraint "chk_seconds_to_decision" CHECK (((seconds_to_decision IS NULL) OR (seconds_to_decision >= 0))) not valid;

alter table "core"."offer_decision" validate constraint "chk_seconds_to_decision";

alter table "core"."offer_decision" add constraint "chk_system_recommendation" CHECK (((system_recommendation IS NULL) OR ((system_recommendation)::text = ANY ((ARRAY['accept'::character varying, 'reject'::character varying, 'review'::character varying])::text[])))) not valid;

alter table "core"."offer_decision" validate constraint "chk_system_recommendation";

alter table "core"."offer_decision" add constraint "fk_offer_decision_rule" FOREIGN KEY (rule_id) REFERENCES core.decision_rule(rule_id) ON DELETE SET NULL not valid;

alter table "core"."offer_decision" validate constraint "fk_offer_decision_rule";

alter table "core"."offer_decision" add constraint "offer_decision_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES core.offer(offer_id) ON DELETE CASCADE not valid;

alter table "core"."offer_decision" validate constraint "offer_decision_offer_id_fkey";

alter table "core"."offer_decision" add constraint "offer_decision_offer_id_key" UNIQUE using index "offer_decision_offer_id_key";

alter table "core"."offer_dropoff" add constraint "offer_dropoff_dropoff_location_id_fkey" FOREIGN KEY (dropoff_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."offer_dropoff" validate constraint "offer_dropoff_dropoff_location_id_fkey";

alter table "core"."offer_dropoff" add constraint "offer_dropoff_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES core.offer(offer_id) ON DELETE CASCADE not valid;

alter table "core"."offer_dropoff" validate constraint "offer_dropoff_offer_id_fkey";

alter table "core"."offer_dropoff" add constraint "offer_dropoff_offer_id_sequence_number_key" UNIQUE using index "offer_dropoff_offer_id_sequence_number_key";

alter table "core"."offer_merchant" add constraint "offer_merchant_merchant_id_fkey" FOREIGN KEY (merchant_id) REFERENCES core.merchant(merchant_id) not valid;

alter table "core"."offer_merchant" validate constraint "offer_merchant_merchant_id_fkey";

alter table "core"."offer_merchant" add constraint "offer_merchant_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES core.offer(offer_id) ON DELETE CASCADE not valid;

alter table "core"."offer_merchant" validate constraint "offer_merchant_offer_id_fkey";

alter table "core"."offer_merchant" add constraint "offer_merchant_offer_id_sequence_number_key" UNIQUE using index "offer_merchant_offer_id_sequence_number_key";

alter table "core"."offer_merchant" add constraint "offer_merchant_pickup_location_id_fkey" FOREIGN KEY (pickup_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."offer_merchant" validate constraint "offer_merchant_pickup_location_id_fkey";

alter table "core"."platform" add constraint "chk_platform_type" CHECK (((platform_type)::text = ANY ((ARRAY['food_delivery'::character varying, 'package_delivery'::character varying, 'rideshare'::character varying, 'grocery'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."platform" validate constraint "chk_platform_type";

alter table "core"."platform" add constraint "platform_platform_name_key" UNIQUE using index "platform_platform_name_key";

alter table "core"."platform_account" add constraint "chk_platform_account_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'disconnected'::character varying, 'error'::character varying])::text[]))) not valid;

alter table "core"."platform_account" validate constraint "chk_platform_account_status";

alter table "core"."platform_account" add constraint "platform_account_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."platform_account" validate constraint "platform_account_driver_id_fkey";

alter table "core"."platform_account" add constraint "platform_account_driver_id_platform_id_account_display_name_key" UNIQUE using index "platform_account_driver_id_platform_id_account_display_name_key";

alter table "core"."platform_account" add constraint "platform_account_market_id_fkey" FOREIGN KEY (market_id) REFERENCES core.market(market_id) not valid;

alter table "core"."platform_account" validate constraint "platform_account_market_id_fkey";

alter table "core"."platform_account" add constraint "platform_account_platform_id_fkey" FOREIGN KEY (platform_id) REFERENCES core.platform(platform_id) not valid;

alter table "core"."platform_account" validate constraint "platform_account_platform_id_fkey";

alter table "core"."rule_execution_log" add constraint "rule_execution_log_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES core.offer(offer_id) ON DELETE CASCADE not valid;

alter table "core"."rule_execution_log" validate constraint "rule_execution_log_offer_id_fkey";

alter table "core"."rule_execution_log" add constraint "rule_execution_log_rule_id_fkey" FOREIGN KEY (rule_id) REFERENCES core.decision_rule(rule_id) ON DELETE CASCADE not valid;

alter table "core"."rule_execution_log" validate constraint "rule_execution_log_rule_id_fkey";

alter table "core"."session_platform_status" add constraint "chk_session_platform_time" CHECK (((online_end_time IS NULL) OR (online_end_time >= online_start_time))) not valid;

alter table "core"."session_platform_status" validate constraint "chk_session_platform_time";

alter table "core"."session_platform_status" add constraint "session_platform_status_platform_account_id_fkey" FOREIGN KEY (platform_account_id) REFERENCES core.platform_account(platform_account_id) ON DELETE CASCADE not valid;

alter table "core"."session_platform_status" validate constraint "session_platform_status_platform_account_id_fkey";

alter table "core"."session_platform_status" add constraint "session_platform_status_work_session_id_fkey" FOREIGN KEY (work_session_id) REFERENCES core.work_session(work_session_id) ON DELETE CASCADE not valid;

alter table "core"."session_platform_status" validate constraint "session_platform_status_work_session_id_fkey";

alter table "core"."vehicle" add constraint "chk_vehicle_fuel_type" CHECK (((fuel_type IS NULL) OR ((fuel_type)::text = ANY ((ARRAY['gasoline'::character varying, 'hybrid'::character varying, 'diesel'::character varying, 'electric'::character varying, 'other'::character varying])::text[])))) not valid;

alter table "core"."vehicle" validate constraint "chk_vehicle_fuel_type";

alter table "core"."vehicle" add constraint "vehicle_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."vehicle" validate constraint "vehicle_driver_id_fkey";

alter table "core"."work_session" add constraint "chk_session_status" CHECK (((session_status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "core"."work_session" validate constraint "chk_session_status";

alter table "core"."work_session" add constraint "chk_session_time" CHECK (((end_time IS NULL) OR (end_time >= start_time))) not valid;

alter table "core"."work_session" validate constraint "chk_session_time";

alter table "core"."work_session" add constraint "work_session_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES core.driver(driver_id) ON DELETE CASCADE not valid;

alter table "core"."work_session" validate constraint "work_session_driver_id_fkey";

alter table "core"."work_session" add constraint "work_session_end_location_id_fkey" FOREIGN KEY (end_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."work_session" validate constraint "work_session_end_location_id_fkey";

alter table "core"."work_session" add constraint "work_session_market_id_fkey" FOREIGN KEY (market_id) REFERENCES core.market(market_id) not valid;

alter table "core"."work_session" validate constraint "work_session_market_id_fkey";

alter table "core"."work_session" add constraint "work_session_start_location_id_fkey" FOREIGN KEY (start_location_id) REFERENCES core.location(location_id) not valid;

alter table "core"."work_session" validate constraint "work_session_start_location_id_fkey";

alter table "core"."work_session" add constraint "work_session_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES core.vehicle(vehicle_id) not valid;

alter table "core"."work_session" validate constraint "work_session_vehicle_id_fkey";

alter table "core"."zone" add constraint "chk_zone_type" CHECK (((zone_type)::text = ANY ((ARRAY['hotspot'::character varying, 'delivery_corridor'::character varying, 'avoidance_zone'::character varying, 'preferred_zone'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "core"."zone" validate constraint "chk_zone_type";

alter table "core"."zone" add constraint "zone_market_id_fkey" FOREIGN KEY (market_id) REFERENCES core.market(market_id) ON DELETE CASCADE not valid;

alter table "core"."zone" validate constraint "zone_market_id_fkey";

alter table "core"."zone" add constraint "zone_market_id_zone_name_key" UNIQUE using index "zone_market_id_zone_name_key";

set check_function_bodies = off;

create or replace view "analytics"."v_offer_outcome" as  SELECT o.offer_id,
    o.work_session_id,
    o.platform_account_id,
    o.offer_received_at,
    o.offer_type,
    o.display_amount,
    o.estimated_distance_miles,
    o.estimated_duration_minutes,
    od.driver_action,
    od.system_recommendation,
    od.system_score,
    d.delivery_order_id,
    d.delivery_status,
    d.actual_distance_miles,
    d.actual_duration_minutes,
    d.total_payout_final,
    d.customer_tip_final,
        CASE
            WHEN ((o.display_amount IS NOT NULL) AND (d.total_payout_final IS NOT NULL)) THEN (d.total_payout_final - o.display_amount)
            ELSE NULL::numeric
        END AS payout_delta
   FROM ((core.offer o
     LEFT JOIN core.offer_decision od ON ((od.offer_id = o.offer_id)))
     LEFT JOIN core.delivery_order d ON ((d.offer_id = o.offer_id)));


create or replace view "analytics"."v_session_profitability" as  SELECT ws.work_session_id,
    ws.driver_id,
    ws.start_time,
    ws.end_time,
    COALESCE(sum(
        CASE
            WHEN (ee.amount IS NOT NULL) THEN ee.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS gross_earnings,
    COALESCE(sum(
        CASE
            WHEN (ex.amount IS NOT NULL) THEN ex.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS expenses,
    COALESCE(sum(
        CASE
            WHEN (ml.distance_miles IS NOT NULL) THEN ml.distance_miles
            ELSE (0)::numeric
        END), (0)::numeric) AS total_miles,
    COALESCE(sum(
        CASE
            WHEN ((ml.mileage_type)::text = 'deadhead'::text) THEN ml.distance_miles
            ELSE (0)::numeric
        END), (0)::numeric) AS deadhead_miles,
    (COALESCE(sum(
        CASE
            WHEN (ee.amount IS NOT NULL) THEN ee.amount
            ELSE (0)::numeric
        END), (0)::numeric) - COALESCE(sum(
        CASE
            WHEN (ex.amount IS NOT NULL) THEN ex.amount
            ELSE (0)::numeric
        END), (0)::numeric)) AS net_earnings
   FROM (((core.work_session ws
     LEFT JOIN core.earning_event ee ON ((ee.work_session_id = ws.work_session_id)))
     LEFT JOIN core.expense ex ON ((ex.work_session_id = ws.work_session_id)))
     LEFT JOIN core.mileage_log ml ON ((ml.work_session_id = ws.work_session_id)))
  GROUP BY ws.work_session_id, ws.driver_id, ws.start_time, ws.end_time;


create or replace view "analytics"."v_session_profitability_clean" as  WITH earning_totals AS (
         SELECT earning_event.work_session_id,
            sum(earning_event.amount) AS gross_earnings
           FROM core.earning_event
          GROUP BY earning_event.work_session_id
        ), expense_totals AS (
         SELECT expense.work_session_id,
            sum(expense.amount) AS expenses
           FROM core.expense
          GROUP BY expense.work_session_id
        ), mileage_totals AS (
         SELECT mileage_log.work_session_id,
            sum(mileage_log.distance_miles) AS total_miles,
            sum(
                CASE
                    WHEN ((mileage_log.mileage_type)::text = 'deadhead'::text) THEN mileage_log.distance_miles
                    ELSE (0)::numeric
                END) AS deadhead_miles
           FROM core.mileage_log
          GROUP BY mileage_log.work_session_id
        )
 SELECT ws.work_session_id,
    ws.driver_id,
    ws.start_time,
    ws.end_time,
    COALESCE(et.gross_earnings, (0)::numeric) AS gross_earnings,
    COALESCE(ext.expenses, (0)::numeric) AS expenses,
    COALESCE(mt.total_miles, (0)::numeric) AS total_miles,
    COALESCE(mt.deadhead_miles, (0)::numeric) AS deadhead_miles,
    (COALESCE(et.gross_earnings, (0)::numeric) - COALESCE(ext.expenses, (0)::numeric)) AS net_earnings
   FROM (((core.work_session ws
     LEFT JOIN earning_totals et ON ((et.work_session_id = ws.work_session_id)))
     LEFT JOIN expense_totals ext ON ((ext.work_session_id = ws.work_session_id)))
     LEFT JOIN mileage_totals mt ON ((mt.work_session_id = ws.work_session_id)));


CREATE OR REPLACE FUNCTION core.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE TRIGGER trg_decision_rule_updated_at BEFORE UPDATE ON core.decision_rule FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_delivery_issue_updated_at BEFORE UPDATE ON core.delivery_issue FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_delivery_order_updated_at BEFORE UPDATE ON core.delivery_order FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_delivery_stop_updated_at BEFORE UPDATE ON core.delivery_stop FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_driver_updated_at BEFORE UPDATE ON core.driver FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_entity_attribute_updated_at BEFORE UPDATE ON core.entity_attribute FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_expense_updated_at BEFORE UPDATE ON core.expense FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_location_updated_at BEFORE UPDATE ON core.location FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_market_updated_at BEFORE UPDATE ON core.market FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_merchant_updated_at BEFORE UPDATE ON core.merchant FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_mileage_log_updated_at BEFORE UPDATE ON core.mileage_log FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_offer_updated_at BEFORE UPDATE ON core.offer FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_offer_decision_updated_at BEFORE UPDATE ON core.offer_decision FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_platform_updated_at BEFORE UPDATE ON core.platform FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_platform_account_updated_at BEFORE UPDATE ON core.platform_account FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_session_platform_status_updated_at BEFORE UPDATE ON core.session_platform_status FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_vehicle_updated_at BEFORE UPDATE ON core.vehicle FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_work_session_updated_at BEFORE UPDATE ON core.work_session FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_zone_updated_at BEFORE UPDATE ON core.zone FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();


