export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  analytics: {
    Tables: {
      merchant_performance_snapshot: {
        Row: {
          acceptance_rate: number | null
          avg_offer_value: number | null
          avg_tip_amount: number | null
          avg_wait_minutes: number | null
          cancellation_rate: number | null
          computed_at: string
          merchant_id: string
          merchant_performance_snapshot_id: string
          order_volume: number | null
          snapshot_date: string
        }
        Insert: {
          acceptance_rate?: number | null
          avg_offer_value?: number | null
          avg_tip_amount?: number | null
          avg_wait_minutes?: number | null
          cancellation_rate?: number | null
          computed_at?: string
          merchant_id: string
          merchant_performance_snapshot_id: string
          order_volume?: number | null
          snapshot_date: string
        }
        Update: {
          acceptance_rate?: number | null
          avg_offer_value?: number | null
          avg_tip_amount?: number | null
          avg_wait_minutes?: number | null
          cancellation_rate?: number | null
          computed_at?: string
          merchant_id?: string
          merchant_performance_snapshot_id?: string
          order_volume?: number | null
          snapshot_date?: string
        }
        Relationships: []
      }
      session_metrics: {
        Row: {
          acceptance_rate: number | null
          active_hours: number
          avg_offer_value: number | null
          avg_wait_time_minutes: number | null
          bonuses: number
          completion_rate: number | null
          computed_at: string
          deadhead_miles: number
          earnings_per_active_hour: number | null
          earnings_per_hour: number | null
          earnings_per_mile: number | null
          gross_earnings: number
          idle_hours: number
          net_earnings: number
          session_metrics_id: string
          tips: number
          total_miles: number
          work_session_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          active_hours?: number
          avg_offer_value?: number | null
          avg_wait_time_minutes?: number | null
          bonuses?: number
          completion_rate?: number | null
          computed_at?: string
          deadhead_miles?: number
          earnings_per_active_hour?: number | null
          earnings_per_hour?: number | null
          earnings_per_mile?: number | null
          gross_earnings?: number
          idle_hours?: number
          net_earnings?: number
          session_metrics_id: string
          tips?: number
          total_miles?: number
          work_session_id: string
        }
        Update: {
          acceptance_rate?: number | null
          active_hours?: number
          avg_offer_value?: number | null
          avg_wait_time_minutes?: number | null
          bonuses?: number
          completion_rate?: number | null
          computed_at?: string
          deadhead_miles?: number
          earnings_per_active_hour?: number | null
          earnings_per_hour?: number | null
          earnings_per_mile?: number | null
          gross_earnings?: number
          idle_hours?: number
          net_earnings?: number
          session_metrics_id?: string
          tips?: number
          total_miles?: number
          work_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_metrics_work_session_id_fkey"
            columns: ["work_session_id"]
            isOneToOne: true
            referencedRelation: "v_session_profitability"
            referencedColumns: ["work_session_id"]
          },
          {
            foreignKeyName: "session_metrics_work_session_id_fkey"
            columns: ["work_session_id"]
            isOneToOne: true
            referencedRelation: "v_session_profitability_clean"
            referencedColumns: ["work_session_id"]
          },
        ]
      }
      zone_performance_snapshot: {
        Row: {
          avg_deadhead_miles: number | null
          avg_earnings_per_hour: number | null
          avg_earnings_per_mile: number | null
          avg_offer_count: number | null
          avg_tip_rate: number | null
          avg_wait_minutes: number | null
          computed_at: string
          hour_block: number
          offer_acceptance_rate: number | null
          platform_id: string | null
          snapshot_date: string
          zone_id: string
          zone_performance_snapshot_id: string
        }
        Insert: {
          avg_deadhead_miles?: number | null
          avg_earnings_per_hour?: number | null
          avg_earnings_per_mile?: number | null
          avg_offer_count?: number | null
          avg_tip_rate?: number | null
          avg_wait_minutes?: number | null
          computed_at?: string
          hour_block: number
          offer_acceptance_rate?: number | null
          platform_id?: string | null
          snapshot_date: string
          zone_id: string
          zone_performance_snapshot_id: string
        }
        Update: {
          avg_deadhead_miles?: number | null
          avg_earnings_per_hour?: number | null
          avg_earnings_per_mile?: number | null
          avg_offer_count?: number | null
          avg_tip_rate?: number | null
          avg_wait_minutes?: number | null
          computed_at?: string
          hour_block?: number
          offer_acceptance_rate?: number | null
          platform_id?: string | null
          snapshot_date?: string
          zone_id?: string
          zone_performance_snapshot_id?: string
        }
        Relationships: []
      }
      zone_time_series: {
        Row: {
          avg_wait_minutes: number | null
          bucket_grain: string
          bucket_start_local: string
          computed_at: string
          gross_amount_sum: number
          offers_accepted_count: number
          offers_seen_count: number
          trips_completed_count: number
          zone_id: string
        }
        Insert: {
          avg_wait_minutes?: number | null
          bucket_grain?: string
          bucket_start_local: string
          computed_at?: string
          gross_amount_sum?: number
          offers_accepted_count?: number
          offers_seen_count?: number
          trips_completed_count?: number
          zone_id: string
        }
        Update: {
          avg_wait_minutes?: number | null
          bucket_grain?: string
          bucket_start_local?: string
          computed_at?: string
          gross_amount_sum?: number
          offers_accepted_count?: number
          offers_seen_count?: number
          trips_completed_count?: number
          zone_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_offer_outcome: {
        Row: {
          actual_distance_miles: number | null
          actual_duration_minutes: number | null
          customer_tip_final: number | null
          delivery_order_id: string | null
          delivery_status: string | null
          display_amount: number | null
          driver_action: string | null
          estimated_distance_miles: number | null
          estimated_duration_minutes: number | null
          offer_id: string | null
          offer_received_at: string | null
          offer_type: string | null
          payout_delta: number | null
          platform_account_id: string | null
          system_recommendation: string | null
          system_score: number | null
          total_payout_final: number | null
          work_session_id: string | null
        }
        Relationships: []
      }
      v_session_profitability: {
        Row: {
          deadhead_miles: number | null
          driver_id: string | null
          end_time: string | null
          expenses: number | null
          gross_earnings: number | null
          net_earnings: number | null
          start_time: string | null
          total_miles: number | null
          work_session_id: string | null
        }
        Relationships: []
      }
      v_session_profitability_clean: {
        Row: {
          deadhead_miles: number | null
          driver_id: string | null
          end_time: string | null
          expenses: number | null
          gross_earnings: number | null
          net_earnings: number | null
          start_time: string | null
          total_miles: number | null
          work_session_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      delivery_platform_accounts: {
        Row: {
          account_name: string | null
          created_at: string
          id: string
          manual_mode: boolean
          platform: string
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          id?: string
          manual_mode?: boolean
          platform: string
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          created_at?: string
          id?: string
          manual_mode?: boolean
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_platform_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          import_batch_id: string
          import_notes: string | null
          import_status: Database["public"]["Enums"]["import_status_enum"]
          imported_at: string
          parser_version: string
          platform_account_id: string
          row_count_parsed: number
          row_count_raw: number
          source_file_hash: string
          source_file_name: string
          source_platform: Database["public"]["Enums"]["platform_enum"]
          source_statement_end_date: string | null
          source_statement_start_date: string | null
          source_type: Database["public"]["Enums"]["source_type_enum"]
          user_id: string
        }
        Insert: {
          import_batch_id?: string
          import_notes?: string | null
          import_status?: Database["public"]["Enums"]["import_status_enum"]
          imported_at?: string
          parser_version: string
          platform_account_id: string
          row_count_parsed?: number
          row_count_raw?: number
          source_file_hash: string
          source_file_name: string
          source_platform: Database["public"]["Enums"]["platform_enum"]
          source_statement_end_date?: string | null
          source_statement_start_date?: string | null
          source_type: Database["public"]["Enums"]["source_type_enum"]
          user_id: string
        }
        Update: {
          import_batch_id?: string
          import_notes?: string | null
          import_status?: Database["public"]["Enums"]["import_status_enum"]
          imported_at?: string
          parser_version?: string
          platform_account_id?: string
          row_count_parsed?: number
          row_count_raw?: number
          source_file_hash?: string
          source_file_name?: string
          source_platform?: Database["public"]["Enums"]["platform_enum"]
          source_statement_end_date?: string | null
          source_statement_start_date?: string | null
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["platform_account_id"]
          },
          {
            foreignKeyName: "import_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_accounts: {
        Row: {
          account_external_id: string | null
          account_label: string | null
          connection_mode: Database["public"]["Enums"]["connection_mode_enum"]
          connection_status: Database["public"]["Enums"]["connection_status_enum"]
          created_at: string
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_external_id?: string | null
          account_label?: string | null
          connection_mode?: Database["public"]["Enums"]["connection_mode_enum"]
          connection_status?: Database["public"]["Enums"]["connection_status_enum"]
          created_at?: string
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_account_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_external_id?: string | null
          account_label?: string | null
          connection_mode?: Database["public"]["Enums"]["connection_mode_enum"]
          connection_status?: Database["public"]["Enums"]["connection_status_enum"]
          created_at?: string
          platform?: Database["public"]["Enums"]["platform_enum"]
          platform_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_import_records: {
        Row: {
          created_at: string
          import_batch_id: string
          parse_error: string | null
          parse_status: Database["public"]["Enums"]["parse_status_enum"]
          parse_warning: string | null
          raw_record_id: string
          row_hash: string
          source_payload_json: Json
          source_record_type: string
          source_row_index: number
        }
        Insert: {
          created_at?: string
          import_batch_id: string
          parse_error?: string | null
          parse_status?: Database["public"]["Enums"]["parse_status_enum"]
          parse_warning?: string | null
          raw_record_id?: string
          row_hash: string
          source_payload_json: Json
          source_record_type: string
          source_row_index: number
        }
        Update: {
          created_at?: string
          import_batch_id?: string
          parse_error?: string | null
          parse_status?: Database["public"]["Enums"]["parse_status_enum"]
          parse_warning?: string | null
          raw_record_id?: string
          row_hash?: string
          source_payload_json?: Json
          source_record_type?: string
          source_row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "raw_import_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["import_batch_id"]
          },
        ]
      }
      reconciliation_issues: {
        Row: {
          created_at: string
          import_batch_id: string | null
          issue_summary: string
          issue_type: Database["public"]["Enums"]["issue_type_enum"]
          platform_account_id: string
          reconciliation_issue_id: string
          resolution_notes: string | null
          resolution_status: Database["public"]["Enums"]["resolution_status_enum"]
          resolved_at: string | null
          severity: Database["public"]["Enums"]["severity_enum"]
          shift_id: string | null
          source_a: string | null
          source_b: string | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          import_batch_id?: string | null
          issue_summary: string
          issue_type: Database["public"]["Enums"]["issue_type_enum"]
          platform_account_id: string
          reconciliation_issue_id?: string
          resolution_notes?: string | null
          resolution_status?: Database["public"]["Enums"]["resolution_status_enum"]
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_enum"]
          shift_id?: string | null
          source_a?: string | null
          source_b?: string | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          import_batch_id?: string | null
          issue_summary?: string
          issue_type?: Database["public"]["Enums"]["issue_type_enum"]
          platform_account_id?: string
          reconciliation_issue_id?: string
          resolution_notes?: string | null
          resolution_status?: Database["public"]["Enums"]["resolution_status_enum"]
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["severity_enum"]
          shift_id?: string | null
          source_a?: string | null
          source_b?: string | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_issues_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["import_batch_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["platform_account_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_issues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_source_links: {
        Row: {
          created_at: string
          import_batch_id: string
          inference_notes: string | null
          shift_id: string
          shift_source_link_id: string
          source_confidence: number
          source_type: Database["public"]["Enums"]["source_type_enum"]
        }
        Insert: {
          created_at?: string
          import_batch_id: string
          inference_notes?: string | null
          shift_id: string
          shift_source_link_id?: string
          source_confidence?: number
          source_type: Database["public"]["Enums"]["source_type_enum"]
        }
        Update: {
          created_at?: string
          import_batch_id?: string
          inference_notes?: string | null
          shift_id?: string
          shift_source_link_id?: string
          source_confidence?: number
          source_type?: Database["public"]["Enums"]["source_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "shift_source_links_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["import_batch_id"]
          },
          {
            foreignKeyName: "shift_source_links_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          end_time: string | null
          ending_mileage: number | null
          id: string
          notes: string | null
          platform_account_id: string | null
          start_time: string
          starting_mileage: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          end_time?: string | null
          ending_mileage?: number | null
          id?: string
          notes?: string | null
          platform_account_id?: string | null
          start_time: string
          starting_mileage?: number | null
          status: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          end_time?: string | null
          ending_mileage?: number | null
          id?: string
          notes?: string | null
          platform_account_id?: string | null
          start_time?: string
          starting_mileage?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "delivery_platform_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stops: {
        Row: {
          address_line_1: string | null
          arrival_ts_local: string | null
          city: string | null
          created_at: string
          departure_ts_local: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          postal_code: string | null
          state: string | null
          stop_id: string
          stop_sequence: number
          stop_status: Database["public"]["Enums"]["stop_status_enum"]
          stop_type: Database["public"]["Enums"]["stop_type_enum"]
          trip_id: string
          zone_id: string | null
        }
        Insert: {
          address_line_1?: string | null
          arrival_ts_local?: string | null
          city?: string | null
          created_at?: string
          departure_ts_local?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          stop_id?: string
          stop_sequence: number
          stop_status?: Database["public"]["Enums"]["stop_status_enum"]
          stop_type?: Database["public"]["Enums"]["stop_type_enum"]
          trip_id: string
          zone_id?: string | null
        }
        Update: {
          address_line_1?: string | null
          arrival_ts_local?: string | null
          city?: string | null
          created_at?: string
          departure_ts_local?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          stop_id?: string
          stop_sequence?: number
          stop_status?: Database["public"]["Enums"]["stop_status_enum"]
          stop_type?: Database["public"]["Enums"]["stop_type_enum"]
          trip_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stops_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "stops_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      trip_financials: {
        Row: {
          adjustment_amt: number | null
          base_fare: number | null
          bonus_amount: number | null
          cancellation_pay: number | null
          currency_code: string
          fee_amount: number | null
          fin_source_type: Database["public"]["Enums"]["financial_source_type_enum"]
          gross_amount: number | null
          net_payout: number | null
          payout_conf: number
          surge_amount: number | null
          tip_amount: number | null
          trip_fin_id: string
          trip_id: string
          wait_time_pay: number | null
        }
        Insert: {
          adjustment_amt?: number | null
          base_fare?: number | null
          bonus_amount?: number | null
          cancellation_pay?: number | null
          currency_code?: string
          fee_amount?: number | null
          fin_source_type: Database["public"]["Enums"]["financial_source_type_enum"]
          gross_amount?: number | null
          net_payout?: number | null
          payout_conf?: number
          surge_amount?: number | null
          tip_amount?: number | null
          trip_fin_id?: string
          trip_id: string
          wait_time_pay?: number | null
        }
        Update: {
          adjustment_amt?: number | null
          base_fare?: number | null
          bonus_amount?: number | null
          cancellation_pay?: number | null
          currency_code?: string
          fee_amount?: number | null
          fin_source_type?: Database["public"]["Enums"]["financial_source_type_enum"]
          gross_amount?: number | null
          net_payout?: number | null
          payout_conf?: number
          surge_amount?: number | null
          tip_amount?: number | null
          trip_fin_id?: string
          trip_id?: string
          wait_time_pay?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_financials_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_financials_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      trip_metrics: {
        Row: {
          active_minutes: number | null
          distance_miles: number | null
          distance_source: Database["public"]["Enums"]["metric_source_enum"]
          duration_minutes: number | null
          duration_source: Database["public"]["Enums"]["metric_source_enum"]
          metric_confidence: number
          pickup_to_drop_minutes: number | null
          trip_id: string
          trip_metric_id: string
        }
        Insert: {
          active_minutes?: number | null
          distance_miles?: number | null
          distance_source: Database["public"]["Enums"]["metric_source_enum"]
          duration_minutes?: number | null
          duration_source: Database["public"]["Enums"]["metric_source_enum"]
          metric_confidence?: number
          pickup_to_drop_minutes?: number | null
          trip_id: string
          trip_metric_id?: string
        }
        Update: {
          active_minutes?: number | null
          distance_miles?: number | null
          distance_source?: Database["public"]["Enums"]["metric_source_enum"]
          duration_minutes?: number | null
          duration_source?: Database["public"]["Enums"]["metric_source_enum"]
          metric_confidence?: number
          pickup_to_drop_minutes?: number | null
          trip_id?: string
          trip_metric_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_metrics_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_metrics_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      trip_source_links: {
        Row: {
          created_at: string
          import_batch_id: string
          raw_record_id: string | null
          source_confidence: number
          source_field_map_json: Json | null
          source_type: Database["public"]["Enums"]["source_type_enum"]
          trip_id: string
          trip_source_link_id: string
        }
        Insert: {
          created_at?: string
          import_batch_id: string
          raw_record_id?: string | null
          source_confidence?: number
          source_field_map_json?: Json | null
          source_type: Database["public"]["Enums"]["source_type_enum"]
          trip_id: string
          trip_source_link_id?: string
        }
        Update: {
          created_at?: string
          import_batch_id?: string
          raw_record_id?: string | null
          source_confidence?: number
          source_field_map_json?: Json | null
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          trip_id?: string
          trip_source_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_source_links_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["import_batch_id"]
          },
          {
            foreignKeyName: "trip_source_links_raw_record_id_fkey"
            columns: ["raw_record_id"]
            isOneToOne: false
            referencedRelation: "raw_import_records"
            referencedColumns: ["raw_record_id"]
          },
          {
            foreignKeyName: "trip_source_links_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_source_links_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
        ]
      }
      trips: {
        Row: {
          completion_confidence: number
          created_at: string
          dropoff_zone_id: string | null
          pickup_zone_id: string | null
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_account_id: string
          platform_order_id: string | null
          platform_trip_id: string | null
          raw_trip_ref: string | null
          service_type: Database["public"]["Enums"]["service_type_enum"]
          shift_id: string | null
          source_priority: number
          trip_date_local: string
          trip_end_ts_local: string | null
          trip_id: string
          trip_start_ts_local: string | null
          trip_status: Database["public"]["Enums"]["trip_status_enum"]
          trip_timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_confidence?: number
          created_at?: string
          dropoff_zone_id?: string | null
          pickup_zone_id?: string | null
          platform: Database["public"]["Enums"]["platform_enum"]
          platform_account_id: string
          platform_order_id?: string | null
          platform_trip_id?: string | null
          raw_trip_ref?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"]
          shift_id?: string | null
          source_priority?: number
          trip_date_local: string
          trip_end_ts_local?: string | null
          trip_id?: string
          trip_start_ts_local?: string | null
          trip_status?: Database["public"]["Enums"]["trip_status_enum"]
          trip_timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_confidence?: number
          created_at?: string
          dropoff_zone_id?: string | null
          pickup_zone_id?: string | null
          platform?: Database["public"]["Enums"]["platform_enum"]
          platform_account_id?: string
          platform_order_id?: string | null
          platform_trip_id?: string | null
          raw_trip_ref?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"]
          shift_id?: string | null
          source_priority?: number
          trip_date_local?: string
          trip_end_ts_local?: string | null
          trip_id?: string
          trip_start_ts_local?: string | null
          trip_status?: Database["public"]["Enums"]["trip_status_enum"]
          trip_timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["platform_account_id"]
          },
          {
            foreignKeyName: "trips_raw_trip_ref_fkey"
            columns: ["raw_trip_ref"]
            isOneToOne: false
            referencedRelation: "raw_import_records"
            referencedColumns: ["raw_record_id"]
          },
          {
            foreignKeyName: "trips_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          preferred_currency: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          preferred_currency?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          preferred_currency?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_open_reconciliation_issues: {
        Row: {
          created_at: string | null
          import_batch_id: string | null
          issue_summary: string | null
          issue_type: Database["public"]["Enums"]["issue_type_enum"] | null
          platform_account_id: string | null
          platform_trip_id: string | null
          reconciliation_issue_id: string | null
          resolution_status:
            | Database["public"]["Enums"]["resolution_status_enum"]
            | null
          severity: Database["public"]["Enums"]["severity_enum"] | null
          shift_id: string | null
          source_a: string | null
          source_b: string | null
          trip_date_local: string | null
          trip_end_ts_local: string | null
          trip_id: string | null
          trip_start_ts_local: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_issues_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["import_batch_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["platform_account_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_issues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "v_trip_import_review"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "reconciliation_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_trip_import_review: {
        Row: {
          active_minutes: number | null
          adjustment_amt: number | null
          base_fare: number | null
          bonus_amount: number | null
          cancellation_pay: number | null
          completion_confidence: number | null
          created_at: string | null
          currency_code: string | null
          distance_miles: number | null
          distance_source:
            | Database["public"]["Enums"]["metric_source_enum"]
            | null
          dropoff_zone_id: string | null
          duration_minutes: number | null
          duration_source:
            | Database["public"]["Enums"]["metric_source_enum"]
            | null
          fee_amount: number | null
          fin_source_type:
            | Database["public"]["Enums"]["financial_source_type_enum"]
            | null
          gross_amount: number | null
          metric_confidence: number | null
          net_payout: number | null
          payout_conf: number | null
          pickup_to_drop_minutes: number | null
          pickup_zone_id: string | null
          platform: Database["public"]["Enums"]["platform_enum"] | null
          platform_account_id: string | null
          platform_order_id: string | null
          platform_trip_id: string | null
          service_type: Database["public"]["Enums"]["service_type_enum"] | null
          shift_id: string | null
          surge_amount: number | null
          tip_amount: number | null
          trip_date_local: string | null
          trip_end_ts_local: string | null
          trip_id: string | null
          trip_start_ts_local: string | null
          trip_status: Database["public"]["Enums"]["trip_status_enum"] | null
          trip_timezone: string | null
          updated_at: string | null
          user_id: string | null
          wait_time_pay: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_platform_account_id_fkey"
            columns: ["platform_account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["platform_account_id"]
          },
          {
            foreignKeyName: "trips_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_mode_enum: "import_only" | "linked" | "manual"
      connection_status_enum: "active" | "disconnected" | "errored" | "unknown"
      financial_source_type_enum:
        | "statement_csv"
        | "personal_data_export"
        | "derived"
      import_status_enum: "processing" | "completed" | "partial" | "failed"
      inference_method_enum:
        | "gap_clustering"
        | "manual_merge"
        | "manual_entry"
        | "app_tracked"
      issue_type_enum:
        | "duplicate"
        | "missing_trip_id"
        | "amount_mismatch"
        | "time_gap"
        | "distance_mismatch"
        | "unmapped_row"
        | "summary_row_detected"
        | "parse_failure"
        | "suspected_duplicate"
      metric_source_enum:
        | "statement"
        | "personal_export"
        | "derived"
        | "app_gps"
      parse_status_enum: "parsed" | "warning" | "failed" | "skipped"
      platform_enum:
        | "uber_driver"
        | "uber_eats"
        | "doordash"
        | "grubhub"
        | "unknown"
      platform_scope_enum: "uber_only" | "multi_platform" | "unknown"
      resolution_status_enum: "open" | "resolved" | "ignored"
      service_type_enum: "delivery" | "rideshare" | "unknown"
      severity_enum: "low" | "medium" | "high"
      source_type_enum:
        | "weekly_statement_csv"
        | "personal_data_export"
        | "manual_csv"
        | "manual_entry"
        | "app_gps"
        | "derived"
        | "other"
      stop_status_enum: "completed" | "skipped" | "unknown"
      stop_type_enum: "pickup" | "dropoff" | "waypoint" | "unknown"
      trip_status_enum: "completed" | "cancelled" | "partial" | "unknown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  analytics: {
    Enums: {},
  },
  public: {
    Enums: {
      connection_mode_enum: ["import_only", "linked", "manual"],
      connection_status_enum: ["active", "disconnected", "errored", "unknown"],
      financial_source_type_enum: [
        "statement_csv",
        "personal_data_export",
        "derived",
      ],
      import_status_enum: ["processing", "completed", "partial", "failed"],
      inference_method_enum: [
        "gap_clustering",
        "manual_merge",
        "manual_entry",
        "app_tracked",
      ],
      issue_type_enum: [
        "duplicate",
        "missing_trip_id",
        "amount_mismatch",
        "time_gap",
        "distance_mismatch",
        "unmapped_row",
        "summary_row_detected",
        "parse_failure",
        "suspected_duplicate",
      ],
      metric_source_enum: [
        "statement",
        "personal_export",
        "derived",
        "app_gps",
      ],
      parse_status_enum: ["parsed", "warning", "failed", "skipped"],
      platform_enum: [
        "uber_driver",
        "uber_eats",
        "doordash",
        "grubhub",
        "unknown",
      ],
      platform_scope_enum: ["uber_only", "multi_platform", "unknown"],
      resolution_status_enum: ["open", "resolved", "ignored"],
      service_type_enum: ["delivery", "rideshare", "unknown"],
      severity_enum: ["low", "medium", "high"],
      source_type_enum: [
        "weekly_statement_csv",
        "personal_data_export",
        "manual_csv",
        "manual_entry",
        "app_gps",
        "derived",
        "other",
      ],
      stop_status_enum: ["completed", "skipped", "unknown"],
      stop_type_enum: ["pickup", "dropoff", "waypoint", "unknown"],
      trip_status_enum: ["completed", "cancelled", "partial", "unknown"],
    },
  },
} as const
