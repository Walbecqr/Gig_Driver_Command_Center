export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      delivery_platform_accounts: {
        Row: {
          account_name: string | null;
          created_at: string;
          id: string;
          manual_mode: boolean;
          platform: string;
          user_id: string | null;
        };
        Insert: {
          account_name?: string | null;
          created_at?: string;
          id?: string;
          manual_mode?: boolean;
          platform: string;
          user_id?: string | null;
        };
        Update: {
          account_name?: string | null;
          created_at?: string;
          id?: string;
          manual_mode?: boolean;
          platform?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'delivery_platform_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      external_condition_alerts: {
        Row: {
          alert_external_id: string | null;
          certainty: string | null;
          created_at: string;
          description: string | null;
          event_type: string;
          expires_ts: string | null;
          external_condition_alert_id: string;
          zone_id: string;
          headline: string | null;
          onset_ts: string | null;
          properties_json: Json | null;
          reference_dataset_id: string;
          reference_feature_id: string;
          severity: string | null;
          urgency: string | null;
        };
        Insert: {
          alert_external_id?: string | null;
          certainty?: string | null;
          created_at?: string;
          description?: string | null;
          event_type: string;
          expires_ts?: string | null;
          external_condition_alert_id?: string;
          zone_id?: string;
          headline?: string | null;
          onset_ts?: string | null;
          properties_json?: Json | null;
          reference_dataset_id: string;
          reference_feature_id: string;
          severity?: string | null;
          urgency?: string | null;
        };
        Update: {
          alert_external_id?: string | null;
          certainty?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string;
          expires_ts?: string | null;
          external_condition_alert_id?: string;
          zone_id?: string;
          headline?: string | null;
          onset_ts?: string | null;
          properties_json?: Json | null;
          reference_dataset_id?: string;
          reference_feature_id?: string;
          severity?: string | null;
          urgency?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'external_condition_alerts_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
          {
            foreignKeyName: 'external_condition_alerts_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
        ];
      };
      external_conditions: {
        Row: {
          condition_id: string;
          created_at: string;
          humidity_pct: number | null;
          import_batch_id: string | null;
          latitude: number | null;
          longitude: number | null;
          recorded_at: string;
          source_type: string;
          surge_multiplier: number | null;
          temperature_f: number | null;
          visibility_miles: number | null;
          weather_condition: string | null;
          wind_speed_mph: number | null;
          zone_id: string | null;
        };
        Insert: {
          condition_id?: string;
          created_at?: string;
          humidity_pct?: number | null;
          import_batch_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          recorded_at: string;
          source_type?: string;
          surge_multiplier?: number | null;
          temperature_f?: number | null;
          visibility_miles?: number | null;
          weather_condition?: string | null;
          wind_speed_mph?: number | null;
          zone_id?: string | null;
        };
        Update: {
          condition_id?: string;
          created_at?: string;
          humidity_pct?: number | null;
          import_batch_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          recorded_at?: string;
          source_type?: string;
          surge_multiplier?: number | null;
          temperature_f?: number | null;
          visibility_miles?: number | null;
          weather_condition?: string | null;
          wind_speed_mph?: number | null;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'external_conditions_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
        ];
      };
      import_batches: {
        Row: {
          import_batch_id: string;
          import_notes: string | null;
          import_status: Database['public']['Enums']['import_status_enum'];
          imported_at: string;
          parser_version: string;
          platform_account_id: string;
          row_count_parsed: number;
          row_count_raw: number;
          source_file_hash: string;
          source_file_name: string;
          source_platform: Database['public']['Enums']['platform_enum'];
          source_statement_end_date: string | null;
          source_statement_start_date: string | null;
          source_type: Database['public']['Enums']['source_type_enum'];
          user_id: string;
        };
        Insert: {
          import_batch_id?: string;
          import_notes?: string | null;
          import_status?: Database['public']['Enums']['import_status_enum'];
          imported_at?: string;
          parser_version: string;
          platform_account_id: string;
          row_count_parsed?: number;
          row_count_raw?: number;
          source_file_hash: string;
          source_file_name: string;
          source_platform: Database['public']['Enums']['platform_enum'];
          source_statement_end_date?: string | null;
          source_statement_start_date?: string | null;
          source_type: Database['public']['Enums']['source_type_enum'];
          user_id: string;
        };
        Update: {
          import_batch_id?: string;
          import_notes?: string | null;
          import_status?: Database['public']['Enums']['import_status_enum'];
          imported_at?: string;
          parser_version?: string;
          platform_account_id?: string;
          row_count_parsed?: number;
          row_count_raw?: number;
          source_file_hash?: string;
          source_file_name?: string;
          source_platform?: Database['public']['Enums']['platform_enum'];
          source_statement_end_date?: string | null;
          source_statement_start_date?: string | null;
          source_type?: Database['public']['Enums']['source_type_enum'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'import_batches_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'platform_accounts';
            referencedColumns: ['platform_account_id'];
          },
          {
            foreignKeyName: 'import_batches_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      merchant_locations: {
        Row: {
          address_line_1: string | null;
          city: string | null;
          created_at: string;
          cuisine_type: string | null;
          delivery_fee: number | null;
          estimated_delivery_time_minutes: number | null;
          import_batch_id: string | null;
          latitude: number | null;
          longitude: number | null;
          merchant_id: string;
          name: string;
          platform: Database['public']['Enums']['platform_enum'];
          postal_code: string | null;
          price_level: number | null;
          rating: number | null;
          source_type: string;
          state: string | null;
          updated_at: string;
          zone_id: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          city?: string | null;
          created_at?: string;
          cuisine_type?: string | null;
          delivery_fee?: number | null;
          estimated_delivery_time_minutes?: number | null;
          import_batch_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          merchant_id?: string;
          name: string;
          platform: Database['public']['Enums']['platform_enum'];
          postal_code?: string | null;
          price_level?: number | null;
          rating?: number | null;
          source_type?: string;
          state?: string | null;
          updated_at?: string;
          zone_id?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          city?: string | null;
          created_at?: string;
          cuisine_type?: string | null;
          delivery_fee?: number | null;
          estimated_delivery_time_minutes?: number | null;
          import_batch_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          merchant_id?: string;
          name?: string;
          platform?: Database['public']['Enums']['platform_enum'];
          postal_code?: string | null;
          price_level?: number | null;
          rating?: number | null;
          source_type?: string;
          state?: string | null;
          updated_at?: string;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'merchant_locations_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
        ];
      };
      reference_datasets: {
        Row: {
          created_at: string;
          dataset_name: string;
          dataset_slug: string | null;
          description: string | null;
          is_active: boolean;
          layer_category: Database['public']['Enums']['reference_layer_category_enum'];
          notes: string | null;
          parser_version: string | null;
          reference_dataset_id: string;
          refresh_cadence: Database['public']['Enums']['refresh_cadence_enum'];
          source_agency: string | null;
          source_type: Database['public']['Enums']['reference_source_type_enum'];
          source_url: string | null;
          source_vintage: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_name: string;
          dataset_slug?: string | null;
          description?: string | null;
          is_active?: boolean;
          layer_category: Database['public']['Enums']['reference_layer_category_enum'];
          notes?: string | null;
          parser_version?: string | null;
          reference_dataset_id?: string;
          refresh_cadence?: Database['public']['Enums']['refresh_cadence_enum'];
          source_agency?: string | null;
          source_type: Database['public']['Enums']['reference_source_type_enum'];
          source_url?: string | null;
          source_vintage?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_name?: string;
          dataset_slug?: string | null;
          description?: string | null;
          is_active?: boolean;
          layer_category?: Database['public']['Enums']['reference_layer_category_enum'];
          notes?: string | null;
          parser_version?: string | null;
          reference_dataset_id?: string;
          refresh_cadence?: Database['public']['Enums']['refresh_cadence_enum'];
          source_agency?: string | null;
          source_type?: Database['public']['Enums']['reference_source_type_enum'];
          source_url?: string | null;
          source_vintage?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reference_features: {
        Row: {
          centroid_lat: number | null;
          centroid_lng: number | null;
          created_at: string;
          effective_end_ts: string | null;
          effective_start_ts: string | null;
          feature_external_id: string | null;
          feature_name: string | null;
          feature_subtype: string | null;
          geometry_json: Json | null;
          geometry_type: string;
          h3_res6: string | null;
          h3_res7: string | null;
          h3_res8: string | null;
          normalized_properties_json: Json | null;
          raw_properties_json: Json | null;
          reference_dataset_id: string;
          reference_feature_id: string;
          reference_ingest_batch_id: string | null;
          source_confidence: number;
          updated_at: string;
        };
        Insert: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          created_at?: string;
          effective_end_ts?: string | null;
          effective_start_ts?: string | null;
          feature_external_id?: string | null;
          feature_name?: string | null;
          feature_subtype?: string | null;
          geometry_json?: Json | null;
          geometry_type?: string;
          h3_res6?: string | null;
          h3_res7?: string | null;
          h3_res8?: string | null;
          normalized_properties_json?: Json | null;
          raw_properties_json?: Json | null;
          reference_dataset_id: string;
          reference_feature_id?: string;
          reference_ingest_batch_id?: string | null;
          source_confidence?: number;
          updated_at?: string;
        };
        Update: {
          centroid_lat?: number | null;
          centroid_lng?: number | null;
          created_at?: string;
          effective_end_ts?: string | null;
          effective_start_ts?: string | null;
          feature_external_id?: string | null;
          feature_name?: string | null;
          feature_subtype?: string | null;
          geometry_json?: Json | null;
          geometry_type?: string;
          h3_res6?: string | null;
          h3_res7?: string | null;
          h3_res8?: string | null;
          normalized_properties_json?: Json | null;
          raw_properties_json?: Json | null;
          reference_dataset_id?: string;
          reference_feature_id?: string;
          reference_ingest_batch_id?: string | null;
          source_confidence?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      reference_ingest_batches: {
        Row: {
          import_batch_id: string | null;
          ingest_notes: string | null;
          ingest_status: string;
          ingested_at: string;
          parsed_record_count: number;
          reference_dataset_id: string;
          reference_ingest_batch_id: string;
          source_file_hash: string | null;
          source_file_name: string | null;
          source_record_count: number;
        };
        Insert: {
          import_batch_id?: string | null;
          ingest_notes?: string | null;
          ingest_status?: string;
          ingested_at?: string;
          parsed_record_count?: number;
          reference_dataset_id: string;
          reference_ingest_batch_id?: string;
          source_file_hash?: string | null;
          source_file_name?: string | null;
          source_record_count?: number;
        };
        Update: {
          import_batch_id?: string | null;
          ingest_notes?: string | null;
          ingest_status?: string;
          ingested_at?: string;
          parsed_record_count?: number;
          reference_dataset_id?: string;
          reference_ingest_batch_id?: string;
          source_file_hash?: string | null;
          source_file_name?: string | null;
          source_record_count?: number;
        };
        Relationships: [];
      };
      platform_accounts: {
        Row: {
          account_external_id: string | null;
          account_label: string | null;
          connection_mode: Database['public']['Enums']['connection_mode_enum'];
          connection_status: Database['public']['Enums']['connection_status_enum'];
          created_at: string;
          platform: Database['public']['Enums']['platform_enum'];
          platform_account_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_external_id?: string | null;
          account_label?: string | null;
          connection_mode?: Database['public']['Enums']['connection_mode_enum'];
          connection_status?: Database['public']['Enums']['connection_status_enum'];
          created_at?: string;
          platform: Database['public']['Enums']['platform_enum'];
          platform_account_id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_external_id?: string | null;
          account_label?: string | null;
          connection_mode?: Database['public']['Enums']['connection_mode_enum'];
          connection_status?: Database['public']['Enums']['connection_status_enum'];
          created_at?: string;
          platform?: Database['public']['Enums']['platform_enum'];
          platform_account_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'platform_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      raw_import_records: {
        Row: {
          created_at: string;
          import_batch_id: string;
          parse_error: string | null;
          parse_status: Database['public']['Enums']['parse_status_enum'];
          parse_warning: string | null;
          raw_record_id: string;
          row_hash: string;
          source_payload_json: Json;
          source_record_type: string;
          source_row_index: number;
        };
        Insert: {
          created_at?: string;
          import_batch_id: string;
          parse_error?: string | null;
          parse_status?: Database['public']['Enums']['parse_status_enum'];
          parse_warning?: string | null;
          raw_record_id?: string;
          row_hash: string;
          source_payload_json: Json;
          source_record_type: string;
          source_row_index: number;
        };
        Update: {
          created_at?: string;
          import_batch_id?: string;
          parse_error?: string | null;
          parse_status?: Database['public']['Enums']['parse_status_enum'];
          parse_warning?: string | null;
          raw_record_id?: string;
          row_hash?: string;
          source_payload_json?: Json;
          source_record_type?: string;
          source_row_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'raw_import_records_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
        ];
      };
      reconciliation_issues: {
        Row: {
          created_at: string;
          import_batch_id: string | null;
          issue_summary: string;
          issue_type: Database['public']['Enums']['issue_type_enum'];
          platform_account_id: string;
          reconciliation_issue_id: string;
          resolution_notes: string | null;
          resolution_status: Database['public']['Enums']['resolution_status_enum'];
          resolved_at: string | null;
          severity: Database['public']['Enums']['severity_enum'];
          shift_id: string | null;
          source_a: string | null;
          source_b: string | null;
          trip_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          import_batch_id?: string | null;
          issue_summary: string;
          issue_type: Database['public']['Enums']['issue_type_enum'];
          platform_account_id: string;
          reconciliation_issue_id?: string;
          resolution_notes?: string | null;
          resolution_status?: Database['public']['Enums']['resolution_status_enum'];
          resolved_at?: string | null;
          severity?: Database['public']['Enums']['severity_enum'];
          shift_id?: string | null;
          source_a?: string | null;
          source_b?: string | null;
          trip_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          import_batch_id?: string | null;
          issue_summary?: string;
          issue_type?: Database['public']['Enums']['issue_type_enum'];
          platform_account_id?: string;
          reconciliation_issue_id?: string;
          resolution_notes?: string | null;
          resolution_status?: Database['public']['Enums']['resolution_status_enum'];
          resolved_at?: string | null;
          severity?: Database['public']['Enums']['severity_enum'];
          shift_id?: string | null;
          source_a?: string | null;
          source_b?: string | null;
          trip_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reconciliation_issues_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'platform_accounts';
            referencedColumns: ['platform_account_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      shift_source_links: {
        Row: {
          created_at: string;
          import_batch_id: string;
          inference_notes: string | null;
          shift_id: string;
          shift_source_link_id: string;
          source_confidence: number;
          source_type: Database['public']['Enums']['source_type_enum'];
        };
        Insert: {
          created_at?: string;
          import_batch_id: string;
          inference_notes?: string | null;
          shift_id: string;
          shift_source_link_id?: string;
          source_confidence?: number;
          source_type: Database['public']['Enums']['source_type_enum'];
        };
        Update: {
          created_at?: string;
          import_batch_id?: string;
          inference_notes?: string | null;
          shift_id?: string;
          shift_source_link_id?: string;
          source_confidence?: number;
          source_type?: Database['public']['Enums']['source_type_enum'];
        };
        Relationships: [
          {
            foreignKeyName: 'shift_source_links_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
          {
            foreignKeyName: 'shift_source_links_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
        ];
      };
      shifts: {
        Row: {
          end_time: string | null;
          ending_mileage: number | null;
          id: string;
          notes: string | null;
          platform_account_id: string | null;
          start_time: string;
          starting_mileage: number | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          end_time?: string | null;
          ending_mileage?: number | null;
          id?: string;
          notes?: string | null;
          platform_account_id?: string | null;
          start_time: string;
          starting_mileage?: number | null;
          status: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          end_time?: string | null;
          ending_mileage?: number | null;
          id?: string;
          notes?: string | null;
          platform_account_id?: string | null;
          start_time?: string;
          starting_mileage?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shifts_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'delivery_platform_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stops: {
        Row: {
          address_line_1: string | null;
          arrival_ts_local: string | null;
          city: string | null;
          created_at: string;
          departure_ts_local: string | null;
          latitude: number | null;
          location_name: string | null;
          longitude: number | null;
          postal_code: string | null;
          state: string | null;
          stop_id: string;
          stop_sequence: number;
          stop_status: Database['public']['Enums']['stop_status_enum'];
          stop_type: Database['public']['Enums']['stop_type_enum'];
          trip_id: string;
          zone_id: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          arrival_ts_local?: string | null;
          city?: string | null;
          created_at?: string;
          departure_ts_local?: string | null;
          latitude?: number | null;
          location_name?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          state?: string | null;
          stop_id?: string;
          stop_sequence: number;
          stop_status?: Database['public']['Enums']['stop_status_enum'];
          stop_type?: Database['public']['Enums']['stop_type_enum'];
          trip_id: string;
          zone_id?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          arrival_ts_local?: string | null;
          city?: string | null;
          created_at?: string;
          departure_ts_local?: string | null;
          latitude?: number | null;
          location_name?: string | null;
          longitude?: number | null;
          postal_code?: string | null;
          state?: string | null;
          stop_id?: string;
          stop_sequence?: number;
          stop_status?: Database['public']['Enums']['stop_status_enum'];
          stop_type?: Database['public']['Enums']['stop_type_enum'];
          trip_id?: string;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stops_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'stops_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
        ];
      };
      trip_financials: {
        Row: {
          adjustment_amt: number | null;
          base_fare: number | null;
          bonus_amount: number | null;
          cancellation_pay: number | null;
          currency_code: string;
          fee_amount: number | null;
          fin_source_type: Database['public']['Enums']['financial_source_type_enum'];
          gross_amount: number | null;
          net_payout: number | null;
          payout_conf: number;
          surge_amount: number | null;
          tip_amount: number | null;
          trip_fin_id: string;
          trip_id: string;
          wait_time_pay: number | null;
        };
        Insert: {
          adjustment_amt?: number | null;
          base_fare?: number | null;
          bonus_amount?: number | null;
          cancellation_pay?: number | null;
          currency_code?: string;
          fee_amount?: number | null;
          fin_source_type: Database['public']['Enums']['financial_source_type_enum'];
          gross_amount?: number | null;
          net_payout?: number | null;
          payout_conf?: number;
          surge_amount?: number | null;
          tip_amount?: number | null;
          trip_fin_id?: string;
          trip_id: string;
          wait_time_pay?: number | null;
        };
        Update: {
          adjustment_amt?: number | null;
          base_fare?: number | null;
          bonus_amount?: number | null;
          cancellation_pay?: number | null;
          currency_code?: string;
          fee_amount?: number | null;
          fin_source_type?: Database['public']['Enums']['financial_source_type_enum'];
          gross_amount?: number | null;
          net_payout?: number | null;
          payout_conf?: number;
          surge_amount?: number | null;
          tip_amount?: number | null;
          trip_fin_id?: string;
          trip_id?: string;
          wait_time_pay?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_financials_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: true;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'trip_financials_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: true;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
        ];
      };
      trip_metrics: {
        Row: {
          active_minutes: number | null;
          distance_miles: number | null;
          distance_source: Database['public']['Enums']['metric_source_enum'];
          duration_minutes: number | null;
          duration_source: Database['public']['Enums']['metric_source_enum'];
          metric_confidence: number;
          pickup_to_drop_minutes: number | null;
          trip_id: string;
          trip_metric_id: string;
        };
        Insert: {
          active_minutes?: number | null;
          distance_miles?: number | null;
          distance_source: Database['public']['Enums']['metric_source_enum'];
          duration_minutes?: number | null;
          duration_source: Database['public']['Enums']['metric_source_enum'];
          metric_confidence?: number;
          pickup_to_drop_minutes?: number | null;
          trip_id: string;
          trip_metric_id?: string;
        };
        Update: {
          active_minutes?: number | null;
          distance_miles?: number | null;
          distance_source?: Database['public']['Enums']['metric_source_enum'];
          duration_minutes?: number | null;
          duration_source?: Database['public']['Enums']['metric_source_enum'];
          metric_confidence?: number;
          pickup_to_drop_minutes?: number | null;
          trip_id?: string;
          trip_metric_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_metrics_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: true;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'trip_metrics_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: true;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
        ];
      };
      trip_source_links: {
        Row: {
          created_at: string;
          import_batch_id: string;
          raw_record_id: string | null;
          source_confidence: number;
          source_field_map_json: Json | null;
          source_type: Database['public']['Enums']['source_type_enum'];
          trip_id: string;
          trip_source_link_id: string;
        };
        Insert: {
          created_at?: string;
          import_batch_id: string;
          raw_record_id?: string | null;
          source_confidence?: number;
          source_field_map_json?: Json | null;
          source_type: Database['public']['Enums']['source_type_enum'];
          trip_id: string;
          trip_source_link_id?: string;
        };
        Update: {
          created_at?: string;
          import_batch_id?: string;
          raw_record_id?: string | null;
          source_confidence?: number;
          source_field_map_json?: Json | null;
          source_type?: Database['public']['Enums']['source_type_enum'];
          trip_id?: string;
          trip_source_link_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_source_links_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
          {
            foreignKeyName: 'trip_source_links_raw_record_id_fkey';
            columns: ['raw_record_id'];
            isOneToOne: false;
            referencedRelation: 'raw_import_records';
            referencedColumns: ['raw_record_id'];
          },
          {
            foreignKeyName: 'trip_source_links_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'trip_source_links_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
        ];
      };
      trips: {
        Row: {
          completion_confidence: number;
          created_at: string;
          dropoff_zone_id: string | null;
          pickup_zone_id: string | null;
          platform: Database['public']['Enums']['platform_enum'];
          platform_account_id: string;
          platform_order_id: string | null;
          platform_trip_id: string | null;
          raw_trip_ref: string | null;
          service_type: Database['public']['Enums']['service_type_enum'];
          shift_id: string | null;
          source_priority: number;
          trip_date_local: string;
          trip_end_ts_local: string | null;
          trip_id: string;
          trip_start_ts_local: string | null;
          trip_status: Database['public']['Enums']['trip_status_enum'];
          trip_timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completion_confidence?: number;
          created_at?: string;
          dropoff_zone_id?: string | null;
          pickup_zone_id?: string | null;
          platform: Database['public']['Enums']['platform_enum'];
          platform_account_id: string;
          platform_order_id?: string | null;
          platform_trip_id?: string | null;
          raw_trip_ref?: string | null;
          service_type?: Database['public']['Enums']['service_type_enum'];
          shift_id?: string | null;
          source_priority?: number;
          trip_date_local: string;
          trip_end_ts_local?: string | null;
          trip_id?: string;
          trip_start_ts_local?: string | null;
          trip_status?: Database['public']['Enums']['trip_status_enum'];
          trip_timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completion_confidence?: number;
          created_at?: string;
          dropoff_zone_id?: string | null;
          pickup_zone_id?: string | null;
          platform?: Database['public']['Enums']['platform_enum'];
          platform_account_id?: string;
          platform_order_id?: string | null;
          platform_trip_id?: string | null;
          raw_trip_ref?: string | null;
          service_type?: Database['public']['Enums']['service_type_enum'];
          shift_id?: string | null;
          source_priority?: number;
          trip_date_local?: string;
          trip_end_ts_local?: string | null;
          trip_id?: string;
          trip_start_ts_local?: string | null;
          trip_status?: Database['public']['Enums']['trip_status_enum'];
          trip_timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'platform_accounts';
            referencedColumns: ['platform_account_id'];
          },
          {
            foreignKeyName: 'trips_raw_trip_ref_fkey';
            columns: ['raw_trip_ref'];
            isOneToOne: false;
            referencedRelation: 'raw_import_records';
            referencedColumns: ['raw_record_id'];
          },
          {
            foreignKeyName: 'trips_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          preferred_currency: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          preferred_currency?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          preferred_currency?: string | null;
        };
        Relationships: [];
      };
      zone_risk_layers: {
        Row: {
          zone_risk_layer_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          risk_type: string;
          risk_value_numeric: number | null;
          risk_value_text: string | null;
          units: string | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          zone_risk_layer_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          risk_type: string;
          risk_value_numeric?: number | null;
          risk_value_text?: string | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          zone_risk_layer_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          risk_type?: string;
          risk_value_numeric?: number | null;
          risk_value_text?: string | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_risk_layers_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_risk_layers_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_transport_layers: {
        Row: {
          zone_transport_layer_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          metric_key: string;
          metric_value_numeric: number | null;
          metric_value_text: string | null;
          units: string | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          zone_transport_layer_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          metric_key: string;
          metric_value_numeric?: number | null;
          metric_value_text?: string | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          zone_transport_layer_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          metric_key?: string;
          metric_value_numeric?: number | null;
          metric_value_text?: string | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_transport_layers_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_transport_layers_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_reference_layers: {
        Row: {
          zone_reference_layer_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          boundary_type: string;
          boundary_external_id: string | null;
          boundary_name: string | null;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          zone_reference_layer_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          boundary_type: string;
          boundary_external_id?: string | null;
          boundary_name?: string | null;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          zone_reference_layer_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          boundary_type?: string;
          boundary_external_id?: string | null;
          boundary_name?: string | null;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_reference_layers_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_reference_layers_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_demand_drivers: {
        Row: {
          zone_demand_driver_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          driver_type: string;
          driver_name: string | null;
          driver_weight: number | null;
          capacity_value: number | null;
          units: string | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          zone_demand_driver_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          driver_type: string;
          driver_name?: string | null;
          driver_weight?: number | null;
          capacity_value?: number | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          zone_demand_driver_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          driver_type?: string;
          driver_name?: string | null;
          driver_weight?: number | null;
          capacity_value?: number | null;
          units?: string | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_demand_drivers_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_demand_drivers_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      poi_reference: {
        Row: {
          poi_reference_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          poi_type: string;
          poi_name: string | null;
          latitude: number | null;
          longitude: number | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          poi_reference_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          poi_type: string;
          poi_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          poi_reference_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          poi_type?: string;
          poi_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poi_reference_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'poi_reference_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_land_use_layers: {
        Row: {
          zone_land_use_layer_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          land_use_type: string;
          coverage_fraction: number | null;
          intensity_score: number | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          zone_land_use_layer_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          land_use_type: string;
          coverage_fraction?: number | null;
          intensity_score?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          zone_land_use_layer_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          land_use_type?: string;
          coverage_fraction?: number | null;
          intensity_score?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_land_use_layers_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_land_use_layers_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      infrastructure_reference: {
        Row: {
          infrastructure_reference_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id: string;
          infrastructure_type: string;
          infrastructure_name: string | null;
          latitude: number | null;
          longitude: number | null;
          source_confidence: number;
          properties_json: Json | null;
          created_at: string;
        };
        Insert: {
          infrastructure_reference_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          zone_id?: string;
          infrastructure_type: string;
          infrastructure_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Update: {
          infrastructure_reference_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          zone_id?: string;
          infrastructure_type?: string;
          infrastructure_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          source_confidence?: number;
          properties_json?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'infrastructure_reference_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'infrastructure_reference_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_demographics: {
        Row: {
          zone_demographic_id: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          boundary_type: string;
          boundary_external_id: string | null;
          zone_id: string;
          metric_key: string;
          metric_value_numeric: number | null;
          metric_value_text: string | null;
          units: string | null;
          source_vintage: string | null;
          source_confidence: number;
          created_at: string;
        };
        Insert: {
          zone_demographic_id?: string;
          reference_feature_id: string;
          reference_dataset_id: string;
          boundary_type?: string;
          boundary_external_id?: string | null;
          zone_id?: string;
          metric_key: string;
          metric_value_numeric?: number | null;
          metric_value_text?: string | null;
          units?: string | null;
          source_vintage?: string | null;
          source_confidence?: number;
          created_at?: string;
        };
        Update: {
          zone_demographic_id?: string;
          reference_feature_id?: string;
          reference_dataset_id?: string;
          boundary_type?: string;
          boundary_external_id?: string | null;
          zone_id?: string;
          metric_key?: string;
          metric_value_numeric?: number | null;
          metric_value_text?: string | null;
          units?: string | null;
          source_vintage?: string | null;
          source_confidence?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zone_demographics_reference_feature_id_fkey';
            columns: ['reference_feature_id'];
            isOneToOne: false;
            referencedRelation: 'reference_features';
            referencedColumns: ['reference_feature_id'];
          },
          {
            foreignKeyName: 'zone_demographics_reference_dataset_id_fkey';
            columns: ['reference_dataset_id'];
            isOneToOne: false;
            referencedRelation: 'reference_datasets';
            referencedColumns: ['reference_dataset_id'];
          },
        ];
      };
      zone_metric_registry: {
        Row: {
          metric_key: string;
          display_name: string;
          description: string | null;
          units: string | null;
          layer_category: Database['public']['Enums']['reference_layer_category_enum'];
          source_type: Database['public']['Enums']['reference_source_type_enum'] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          metric_key: string;
          display_name: string;
          description?: string | null;
          units?: string | null;
          layer_category: Database['public']['Enums']['reference_layer_category_enum'];
          source_type?: Database['public']['Enums']['reference_source_type_enum'] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          metric_key?: string;
          display_name?: string;
          description?: string | null;
          units?: string | null;
          layer_category?: Database['public']['Enums']['reference_layer_category_enum'];
          source_type?: Database['public']['Enums']['reference_source_type_enum'] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_open_reconciliation_issues: {
        Row: {
          created_at: string | null;
          import_batch_id: string | null;
          issue_summary: string | null;
          issue_type: Database['public']['Enums']['issue_type_enum'] | null;
          platform_account_id: string | null;
          platform_trip_id: string | null;
          reconciliation_issue_id: string | null;
          resolution_status: Database['public']['Enums']['resolution_status_enum'] | null;
          severity: Database['public']['Enums']['severity_enum'] | null;
          shift_id: string | null;
          source_a: string | null;
          source_b: string | null;
          trip_date_local: string | null;
          trip_end_ts_local: string | null;
          trip_id: string | null;
          trip_start_ts_local: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reconciliation_issues_import_batch_id_fkey';
            columns: ['import_batch_id'];
            isOneToOne: false;
            referencedRelation: 'import_batches';
            referencedColumns: ['import_batch_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'platform_accounts';
            referencedColumns: ['platform_account_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'v_trip_import_review';
            referencedColumns: ['trip_id'];
          },
          {
            foreignKeyName: 'reconciliation_issues_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      v_trip_import_review: {
        Row: {
          active_minutes: number | null;
          adjustment_amt: number | null;
          base_fare: number | null;
          bonus_amount: number | null;
          cancellation_pay: number | null;
          completion_confidence: number | null;
          created_at: string | null;
          currency_code: string | null;
          distance_miles: number | null;
          distance_source: Database['public']['Enums']['metric_source_enum'] | null;
          dropoff_zone_id: string | null;
          duration_minutes: number | null;
          duration_source: Database['public']['Enums']['metric_source_enum'] | null;
          fee_amount: number | null;
          fin_source_type: Database['public']['Enums']['financial_source_type_enum'] | null;
          gross_amount: number | null;
          metric_confidence: number | null;
          net_payout: number | null;
          payout_conf: number | null;
          pickup_to_drop_minutes: number | null;
          pickup_zone_id: string | null;
          platform: Database['public']['Enums']['platform_enum'] | null;
          platform_account_id: string | null;
          platform_order_id: string | null;
          platform_trip_id: string | null;
          service_type: Database['public']['Enums']['service_type_enum'] | null;
          shift_id: string | null;
          surge_amount: number | null;
          tip_amount: number | null;
          trip_date_local: string | null;
          trip_end_ts_local: string | null;
          trip_id: string | null;
          trip_start_ts_local: string | null;
          trip_status: Database['public']['Enums']['trip_status_enum'] | null;
          trip_timezone: string | null;
          updated_at: string | null;
          user_id: string | null;
          wait_time_pay: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_platform_account_id_fkey';
            columns: ['platform_account_id'];
            isOneToOne: false;
            referencedRelation: 'platform_accounts';
            referencedColumns: ['platform_account_id'];
          },
          {
            foreignKeyName: 'trips_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      connection_mode_enum: 'import_only' | 'linked' | 'manual';
      connection_status_enum: 'active' | 'disconnected' | 'errored' | 'unknown';
      financial_source_type_enum: 'statement_csv' | 'personal_data_export' | 'derived';
      import_status_enum: 'processing' | 'review_pending' | 'completed' | 'partial' | 'failed';
      inference_method_enum: 'gap_clustering' | 'manual_merge' | 'manual_entry' | 'app_tracked';
      issue_type_enum:
        | 'duplicate'
        | 'missing_trip_id'
        | 'amount_mismatch'
        | 'time_gap'
        | 'distance_mismatch'
        | 'unmapped_row'
        | 'summary_row_detected'
        | 'parse_failure'
        | 'suspected_duplicate';
      metric_source_enum: 'statement' | 'personal_export' | 'derived' | 'app_gps';
      parse_status_enum: 'parsed' | 'warning' | 'failed' | 'skipped';
      platform_enum: 'uber_driver' | 'uber_eats' | 'doordash' | 'grubhub' | 'unknown' | 'synthetic';
      platform_scope_enum: 'uber_only' | 'multi_platform' | 'unknown';
      reference_layer_category_enum:
        | 'external_conditions'
        | 'external_alerts'
        | 'demographics'
        | 'risk'
        | 'transport'
        | 'reference'
        | 'demand'
        | 'poi'
        | 'land_use'
        | 'infrastructure';
      reference_source_type_enum:
        | 'nws'
        | 'census_acs'
        | 'geojson_file'
        | 'data_gov_api'
        | 'manual';
      refresh_cadence_enum: 'daily' | 'weekly' | 'monthly' | 'on_demand' | 'annually';
      resolution_status_enum: 'open' | 'resolved' | 'ignored';
      service_type_enum: 'delivery' | 'rideshare' | 'unknown';
      severity_enum: 'low' | 'medium' | 'high';
      source_type_enum:
        | 'weekly_statement_csv'
        | 'personal_data_export'
        | 'manual_csv'
        | 'manual_entry'
        | 'app_gps'
        | 'derived'
        | 'other'
        | 'kaggle_csv'
        | 'simulation';
      stop_status_enum: 'completed' | 'skipped' | 'unknown';
      stop_type_enum: 'pickup' | 'dropoff' | 'waypoint' | 'unknown';
      trip_status_enum: 'completed' | 'cancelled' | 'partial' | 'unknown';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      connection_mode_enum: ['import_only', 'linked', 'manual'],
      connection_status_enum: ['active', 'disconnected', 'errored', 'unknown'],
      financial_source_type_enum: ['statement_csv', 'personal_data_export', 'derived'],
      import_status_enum: ['processing', 'review_pending', 'completed', 'partial', 'failed'],
      inference_method_enum: ['gap_clustering', 'manual_merge', 'manual_entry', 'app_tracked'],
      issue_type_enum: [
        'duplicate',
        'missing_trip_id',
        'amount_mismatch',
        'time_gap',
        'distance_mismatch',
        'unmapped_row',
        'summary_row_detected',
        'parse_failure',
        'suspected_duplicate',
      ],
      metric_source_enum: ['statement', 'personal_export', 'derived', 'app_gps'],
      parse_status_enum: ['parsed', 'warning', 'failed', 'skipped'],
      platform_enum: ['uber_driver', 'uber_eats', 'doordash', 'grubhub', 'unknown', 'synthetic'],
      platform_scope_enum: ['uber_only', 'multi_platform', 'unknown'],
      refresh_cadence_enum: ['daily', 'weekly', 'monthly', 'on_demand', 'annually'],
      resolution_status_enum: ['open', 'resolved', 'ignored'],
      service_type_enum: ['delivery', 'rideshare', 'unknown'],
      severity_enum: ['low', 'medium', 'high'],
      source_type_enum: [
        'weekly_statement_csv',
        'personal_data_export',
        'manual_csv',
        'manual_entry',
        'app_gps',
        'derived',
        'other',
        'kaggle_csv',
        'simulation',
      ],
      stop_status_enum: ['completed', 'skipped', 'unknown'],
      stop_type_enum: ['pickup', 'dropoff', 'waypoint', 'unknown'],
      trip_status_enum: ['completed', 'cancelled', 'partial', 'unknown'],
    },
  },
} as const;
