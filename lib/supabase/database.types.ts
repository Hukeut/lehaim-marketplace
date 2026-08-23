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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          dietary_notes: string | null
          dismissed_at: string | null
          email: string
          event_id: string | null
          event_was_deleted: boolean | null
          first_name: string
          guests: Json | null
          id: string
          last_name: string
          number_of_seats: number
          phone: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          dietary_notes?: string | null
          dismissed_at?: string | null
          email: string
          event_id?: string | null
          event_was_deleted?: boolean | null
          first_name: string
          guests?: Json | null
          id?: string
          last_name: string
          number_of_seats?: number
          phone: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          dietary_notes?: string | null
          dismissed_at?: string | null
          email?: string
          event_id?: string | null
          event_was_deleted?: boolean | null
          first_name?: string
          guests?: Json | null
          id?: string
          last_name?: string
          number_of_seats?: number
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          note: string | null
          option_ids: string[]
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          id?: string
          note?: string | null
          option_ids?: string[]
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          id?: string
          note?: string | null
          option_ids?: string[]
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          shop_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          created_at: string
          id: string
          profile_id: string
          shabbat_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          profile_id: string
          shabbat_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          profile_id?: string
          shabbat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          capacity: number
          closed: boolean
          created_at: string
          ends_at: string
          id: string
          mode: string
          shop_id: string
          starts_at: string
        }
        Insert: {
          capacity?: number
          closed?: boolean
          created_at?: string
          ends_at: string
          id?: string
          mode: string
          shop_id: string
          starts_at: string
        }
        Update: {
          capacity?: number
          closed?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          mode?: string
          shop_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_slots_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          fee: number
          id: string
          label: string
          minimum_order: number
          position: number
          shop_id: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          label: string
          minimum_order?: number
          position?: number
          shop_id: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          label?: string
          minimum_order?: number
          position?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          claimed_by: string | null
          emoji: string | null
          id: string
          name: string
          needed: number
          owned: number
          position: number
          shabbat_id: string
        }
        Insert: {
          claimed_by?: string | null
          emoji?: string | null
          id?: string
          name: string
          needed?: number
          owned?: number
          position?: number
          shabbat_id: string
        }
        Update: {
          claimed_by?: string | null
          emoji?: string | null
          id?: string
          name?: string
          needed?: number
          owned?: number
          position?: number
          shabbat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          age_ranges: string[] | null
          atmosphere_tags: string[]
          cover_image_url: string | null
          created_at: string
          currency: string
          date: string
          description: string | null
          end_time: string | null
          format: string | null
          full_address: string | null
          has_food: boolean | null
          has_shelter: boolean | null
          id: string
          is_tsniout: boolean | null
          kashrut: string
          languages: string[]
          neighborhood: string | null
          organizer_id: string
          parking: string | null
          payment_link: string | null
          price: number
          published_at: string | null
          religious_stream: string | null
          seats_taken: number
          seats_total: number
          slug: string | null
          start_time: string | null
          status: string
          title: string
          tradition: string
          type: string
          updated_at: string
          venue_type: string | null
        }
        Insert: {
          age_ranges?: string[] | null
          atmosphere_tags?: string[]
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          date: string
          description?: string | null
          end_time?: string | null
          format?: string | null
          full_address?: string | null
          has_food?: boolean | null
          has_shelter?: boolean | null
          id?: string
          is_tsniout?: boolean | null
          kashrut?: string
          languages?: string[]
          neighborhood?: string | null
          organizer_id: string
          parking?: string | null
          payment_link?: string | null
          price?: number
          published_at?: string | null
          religious_stream?: string | null
          seats_taken?: number
          seats_total: number
          slug?: string | null
          start_time?: string | null
          status?: string
          title: string
          tradition?: string
          type: string
          updated_at?: string
          venue_type?: string | null
        }
        Update: {
          age_ranges?: string[] | null
          atmosphere_tags?: string[]
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          date?: string
          description?: string | null
          end_time?: string | null
          format?: string | null
          full_address?: string | null
          has_food?: boolean | null
          has_shelter?: boolean | null
          id?: string
          is_tsniout?: boolean | null
          kashrut?: string
          languages?: string[]
          neighborhood?: string | null
          organizer_id?: string
          parking?: string | null
          payment_link?: string | null
          price?: number
          published_at?: string | null
          religious_stream?: string | null
          seats_taken?: number
          seats_total?: number
          slug?: string | null
          start_time?: string | null
          status?: string
          title?: string
          tradition?: string
          type?: string
          updated_at?: string
          venue_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          mission_id: string | null
          paid_by: string | null
          settled: boolean
          shabbat_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label: string
          mission_id?: string | null
          paid_by?: string | null
          settled?: boolean
          shabbat_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          mission_id?: string | null
          paid_by?: string | null
          settled?: boolean
          shabbat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          can_manage_expenses: boolean
          can_manage_guests: boolean
          can_manage_messages: boolean
          can_manage_missions: boolean
          created_at: string
          guest_id: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_cohost: boolean
          role_detail: string | null
          role_name: string | null
          shabbat_id: string
          sleeping_room_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          can_manage_expenses?: boolean
          can_manage_guests?: boolean
          can_manage_messages?: boolean
          can_manage_missions?: boolean
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_cohost?: boolean
          role_detail?: string | null
          role_name?: string | null
          shabbat_id: string
          sleeping_room_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          can_manage_expenses?: boolean
          can_manage_guests?: boolean
          can_manage_messages?: boolean
          can_manage_missions?: boolean
          created_at?: string
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_cohost?: boolean
          role_detail?: string | null
          role_name?: string | null
          shabbat_id?: string
          sleeping_room_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_sleeping_room_id_fkey"
            columns: ["sleeping_room_id"]
            isOneToOne: false
            referencedRelation: "sleeping_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      kashrut_certificates: {
        Row: {
          authority: string
          created_at: string
          detail: string | null
          document_id: string | null
          id: string
          mentions: string[]
          shop_id: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          authority: string
          created_at?: string
          detail?: string | null
          document_id?: string | null
          id?: string
          mentions?: string[]
          shop_id: string
          valid_from: string
          valid_to: string
        }
        Update: {
          authority?: string
          created_at?: string
          detail?: string | null
          document_id?: string | null
          id?: string
          mentions?: string[]
          shop_id?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "kashrut_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shop_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kashrut_certificates_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          shabbat_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          shabbat_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          shabbat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_claims: {
        Row: {
          created_at: string
          dish_custom: string | null
          dish_keys: string[] | null
          id: string
          mission_id: string
          profile_id: string
          role_key: string | null
        }
        Insert: {
          created_at?: string
          dish_custom?: string | null
          dish_keys?: string[] | null
          id?: string
          mission_id: string
          profile_id: string
          role_key?: string | null
        }
        Update: {
          created_at?: string
          dish_custom?: string | null
          dish_keys?: string[] | null
          id?: string
          mission_id?: string
          profile_id?: string
          role_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_claims_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          category: string
          created_at: string
          emoji: string | null
          id: string
          moment_id: string | null
          notes: string | null
          position: number
          priority: string
          quantity: string | null
          shabbat_id: string
          slots: number
          status: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          emoji?: string | null
          id?: string
          moment_id?: string | null
          notes?: string | null
          position?: number
          priority?: string
          quantity?: string | null
          shabbat_id: string
          slots?: number
          status?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          emoji?: string | null
          id?: string
          moment_id?: string | null
          notes?: string | null
          position?: number
          priority?: string
          quantity?: string | null
          shabbat_id?: string
          slots?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          capacity: number | null
          detail: string | null
          id: string
          kind: string
          label: string
          meet_at: string | null
          position: number
          shabbat_id: string
          sleeping_policy: string | null
        }
        Insert: {
          capacity?: number | null
          detail?: string | null
          id?: string
          kind: string
          label: string
          meet_at?: string | null
          position?: number
          shabbat_id: string
          sleeping_policy?: string | null
        }
        Update: {
          capacity?: number | null
          detail?: string | null
          id?: string
          kind?: string
          label?: string
          meet_at?: string | null
          position?: number
          shabbat_id?: string
          sleeping_policy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moments_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          name: string
          note: string | null
          options: Json
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          name: string
          note?: string | null
          options?: Json
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          name?: string
          note?: string | null
          options?: Json
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          order_id: string
          profile_id: string
          rating: number
          shop_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          order_id: string
          profile_id: string
          rating: number
          shop_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          order_id?: string
          profile_id?: string
          rating?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ratings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commission_amount: number
          commission_rate: number
          completed_at: string | null
          customer_id: string
          customer_name: string | null
          customer_note: string | null
          customer_phone: string | null
          decided_at: string | null
          delivery_address: string | null
          delivery_fee: number
          delivery_zone: string | null
          id: string
          items_total: number
          mode: string
          payout_amount: number
          placed_at: string
          reference: string
          refusal_reason: string | null
          shop_id: string
          slot_ends_at: string | null
          slot_id: string | null
          slot_starts_at: string | null
          status: string
          total: number
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          completed_at?: string | null
          customer_id: string
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          decided_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_zone?: string | null
          id?: string
          items_total?: number
          mode: string
          payout_amount?: number
          placed_at?: string
          reference?: string
          refusal_reason?: string | null
          shop_id: string
          slot_ends_at?: string | null
          slot_id?: string | null
          slot_starts_at?: string | null
          status?: string
          total?: number
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          completed_at?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          decided_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_zone?: string | null
          id?: string
          items_total?: number
          mode?: string
          payout_amount?: number
          placed_at?: string
          reference?: string
          refusal_reason?: string | null
          shop_id?: string
          slot_ends_at?: string | null
          slot_id?: string | null
          slot_starts_at?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_follows: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_follows_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          city: string
          community_name: string
          created_at: string
          id: string
          is_verified: boolean
          languages: string[]
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          welcome_popup_shown: boolean
          whatsapp_group_url: string | null
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string
          community_name: string
          created_at?: string
          id?: string
          is_verified?: boolean
          languages?: string[]
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          welcome_popup_shown?: boolean
          whatsapp_group_url?: string | null
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string
          community_name?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          languages?: string[]
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          welcome_popup_shown?: boolean
          whatsapp_group_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          created_at: string
          id: string
          label: string
          multiple: boolean
          position: number
          product_id: string
          required: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          multiple?: boolean
          position?: number
          product_id: string
          required?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          multiple?: boolean
          position?: number
          product_id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          available: boolean
          group_id: string
          id: string
          label: string
          position: number
          price_delta: number
        }
        Insert: {
          available?: boolean
          group_id: string
          id?: string
          label: string
          position?: number
          price_delta?: number
        }
        Update: {
          available?: boolean
          group_id?: string
          id?: string
          label?: string
          position?: number
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          back_office_role: string | null
          content_pref: string | null
          country_code: string | null
          created_at: string
          deleted_at: string | null
          diet_tags: string[] | null
          dish_specialty: string | null
          email: string
          first_name: string | null
          hosting_style: string | null
          id: string
          last_name: string | null
          locale: string | null
          onboarding_done_at: string | null
          onboarding_step: string | null
          phone: string | null
          profile_survey_done_at: string | null
          profile_survey_skipped_at: string | null
          role: string
          shabbat_frequency: string | null
          synagogue_habit: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          back_office_role?: string | null
          content_pref?: string | null
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          diet_tags?: string[] | null
          dish_specialty?: string | null
          email: string
          first_name?: string | null
          hosting_style?: string | null
          id: string
          last_name?: string | null
          locale?: string | null
          onboarding_done_at?: string | null
          onboarding_step?: string | null
          phone?: string | null
          profile_survey_done_at?: string | null
          profile_survey_skipped_at?: string | null
          role?: string
          shabbat_frequency?: string | null
          synagogue_habit?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          back_office_role?: string | null
          content_pref?: string | null
          country_code?: string | null
          created_at?: string
          deleted_at?: string | null
          diet_tags?: string[] | null
          dish_specialty?: string | null
          email?: string
          first_name?: string | null
          hosting_style?: string | null
          id?: string
          last_name?: string | null
          locale?: string | null
          onboarding_done_at?: string | null
          onboarding_step?: string | null
          phone?: string | null
          profile_survey_done_at?: string | null
          profile_survey_skipped_at?: string | null
          role?: string
          shabbat_frequency?: string | null
          synagogue_habit?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          attending: boolean
          id: string
          invitation_id: string
          moment_id: string
        }
        Insert: {
          attending?: boolean
          id?: string
          invitation_id: string
          moment_id: string
        }
        Update: {
          attending?: boolean
          id?: string
          invitation_id?: string
          moment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      shabbats: {
        Row: {
          address: string | null
          budget_planned: number | null
          cohost_token: string
          created_at: string
          funding_mode: string
          guest_target: number
          host_id: string
          id: string
          join_code: string
          locked_at: string | null
          neighbourhood: string | null
          ready_by: string | null
          share_token: string
          starts_at: string
          status: string
          template: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          address?: string | null
          budget_planned?: number | null
          cohost_token?: string
          created_at?: string
          funding_mode?: string
          guest_target?: number
          host_id: string
          id?: string
          join_code?: string
          locked_at?: string | null
          neighbourhood?: string | null
          ready_by?: string | null
          share_token?: string
          starts_at: string
          status?: string
          template?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          address?: string | null
          budget_planned?: number | null
          cohost_token?: string
          created_at?: string
          funding_mode?: string
          guest_target?: number
          host_id?: string
          id?: string
          join_code?: string
          locked_at?: string | null
          neighbourhood?: string | null
          ready_by?: string | null
          share_token?: string
          starts_at?: string
          status?: string
          template?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "shabbats_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_applications: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          id: string
          reference: string
          shop_id: string
          status: string
          step: number
          submitted_at: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          reference?: string
          shop_id: string
          status?: string
          step?: number
          submitted_at?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          id?: string
          reference?: string
          shop_id?: string
          status?: string
          step?: number
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_applications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_documents: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          kind: string
          rejected_reason: string | null
          shop_id: string
          status: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind: string
          rejected_reason?: string | null
          shop_id: string
          status?: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          rejected_reason?: string | null
          shop_id?: string
          status?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_documents_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_favorites: {
        Row: {
          created_at: string
          profile_id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          shop_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_favorites_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_hours: {
        Row: {
          closes_at: string
          id: string
          opens_at: string
          shop_id: string
          weekday: number
        }
        Insert: {
          closes_at: string
          id?: string
          opens_at: string
          shop_id: string
          weekday: number
        }
        Update: {
          closes_at?: string
          id?: string
          opens_at?: string
          shop_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_hours_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          allergens_contains: string[]
          allergens_free: string[]
          allergens_traces: string[]
          available: boolean
          category: string
          created_at: string
          description: string | null
          dish_key: string | null
          hint: string | null
          id: string
          name: string
          photo_path: string | null
          position: number
          price: number
          shop_id: string
          sold_count: number
          workshop_note: string | null
        }
        Insert: {
          allergens_contains?: string[]
          allergens_free?: string[]
          allergens_traces?: string[]
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          dish_key?: string | null
          hint?: string | null
          id?: string
          name: string
          photo_path?: string | null
          position?: number
          price?: number
          shop_id: string
          sold_count?: number
          workshop_note?: string | null
        }
        Update: {
          allergens_contains?: string[]
          allergens_free?: string[]
          allergens_traces?: string[]
          available?: boolean
          category?: string
          created_at?: string
          description?: string | null
          dish_key?: string | null
          hint?: string | null
          id?: string
          name?: string
          photo_path?: string | null
          position?: number
          price?: number
          shop_id?: string
          sold_count?: number
          workshop_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          category: string
          city: string | null
          commission_rate: number
          contract_signature: string | null
          contract_signed_at: string | null
          cover_path: string | null
          created_at: string
          delivery_modes: string[]
          description: string | null
          emoji: string
          featured_note: string | null
          featured_rank: number | null
          hours: Json
          iban: string | null
          id: string
          legal_name: string | null
          logo_path: string | null
          name: string
          owner_id: string | null
          paused: boolean
          payout_frequency: string
          phone: string | null
          preorder_deadline: string | null
          prep_minutes: number
          siret: string | null
          slot_capacity: number
          slug: string
          status: string
          tone: string
        }
        Insert: {
          address?: string | null
          category?: string
          city?: string | null
          commission_rate?: number
          contract_signature?: string | null
          contract_signed_at?: string | null
          cover_path?: string | null
          created_at?: string
          delivery_modes?: string[]
          description?: string | null
          emoji?: string
          featured_note?: string | null
          featured_rank?: number | null
          hours?: Json
          iban?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          owner_id?: string | null
          paused?: boolean
          payout_frequency?: string
          phone?: string | null
          preorder_deadline?: string | null
          prep_minutes?: number
          siret?: string | null
          slot_capacity?: number
          slug: string
          status?: string
          tone?: string
        }
        Update: {
          address?: string | null
          category?: string
          city?: string | null
          commission_rate?: number
          contract_signature?: string | null
          contract_signed_at?: string | null
          cover_path?: string | null
          created_at?: string
          delivery_modes?: string[]
          description?: string | null
          emoji?: string
          featured_note?: string | null
          featured_rank?: number | null
          hours?: Json
          iban?: string | null
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name?: string
          owner_id?: string | null
          paused?: boolean
          payout_frequency?: string
          phone?: string | null
          preorder_deadline?: string | null
          prep_minutes?: number
          siret?: string | null
          slot_capacity?: number
          slug?: string
          status?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sleeping_rooms: {
        Row: {
          capacity: number
          created_at: string
          id: string
          label: string
          policy: string | null
          position: number
          shabbat_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          label: string
          policy?: string | null
          position?: number
          shabbat_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          label?: string
          policy?: string | null
          position?: number
          shabbat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleeping_rooms_shabbat_id_fkey"
            columns: ["shabbat_id"]
            isOneToOne: false
            referencedRelation: "shabbats"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_votes: {
        Row: {
          profile_id: string
          suggestion_id: string
        }
        Insert: {
          profile_id: string
          suggestion_id: string
        }
        Update: {
          profile_id?: string
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          author_id: string | null
          body: string
          chosen: boolean
          created_at: string
          id: string
          mission_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          chosen?: boolean
          created_at?: string
          id?: string
          mission_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          chosen?: boolean
          created_at?: string
          id?: string
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_unread: boolean
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_hidden: boolean
          user_id: string
          user_unread: boolean
        }
        Insert: {
          admin_unread?: boolean
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_hidden?: boolean
          user_id: string
          user_unread?: boolean
        }
        Update: {
          admin_unread?: boolean
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_hidden?: boolean
          user_id?: string
          user_unread?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swaps: {
        Row: {
          created_at: string
          from_id: string
          id: string
          mission_id: string
          resolved_at: string | null
          status: string
          to_id: string | null
        }
        Insert: {
          created_at?: string
          from_id: string
          id?: string
          mission_id: string
          resolved_at?: string | null
          status?: string
          to_id?: string | null
        }
        Update: {
          created_at?: string
          from_id?: string
          id?: string
          mission_id?: string
          resolved_at?: string | null
          status?: string
          to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swaps_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swaps_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swaps_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shop_ratings: {
        Row: {
          average: number | null
          reviews: number | null
          shop_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_set_role: {
        Args: { next_role: string; target: string }
        Returns: undefined
      }
      admin_user_list: {
        Args: never
        Returns: {
          back_office_role: string
          confirmed_at: string
          created_at: string
          email: string
          first_name: string
          hosted: number
          id: string
          joined: number
          last_name: string
          last_sign_in_at: string
          locale: string
          phone: string
        }[]
      }
      become_cohost: { Args: { token: string }; Returns: string }
      code_preview: {
        Args: { code: string }
        Returns: {
          host_name: string
          starts_at: string
          title: string
        }[]
      }
      cohost_preview: {
        Args: { token: string }
        Returns: {
          host_name: string
          starts_at: string
          title: string
        }[]
      }
      delete_my_account: { Args: never; Returns: undefined }
      generate_join_code: { Args: never; Returns: string }
      generate_slots: {
        Args: { p_days?: number; p_shop: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_client_write: { Args: never; Returns: boolean }
      is_guest_of: { Args: { sid: string }; Returns: boolean }
      is_host: { Args: { sid: string }; Returns: boolean }
      is_member: { Args: { sid: string }; Returns: boolean }
      join_by_code: { Args: { code: string }; Returns: string }
      join_by_token: { Args: { token: string }; Returns: string }
      mission_is_member: { Args: { mid: string }; Returns: boolean }
      moment_attendance: {
        Args: { shabbat: string }
        Returns: {
          attending: number
          moment_id: string
        }[]
      }
      owns_shop: { Args: { target: string }; Returns: boolean }
      place_order: {
        Args: {
          p_address?: string
          p_mode: string
          p_note?: string
          p_shop: string
          p_slot?: string
          p_zone?: string
        }
        Returns: string
      }
      respond_by_token: {
        Args: { answer: string; token: string }
        Returns: string
      }
      shabbat_preview: {
        Args: { token: string }
        Returns: {
          confirmed: number
          funding_mode: string
          guest_target: number
          has_sleepover: boolean
          host_name: string
          id: string
          moments: string[]
          neighbourhood: string
          starts_at: string
          title: string
          visibility: string
        }[]
      }
      shop_of_path: { Args: { name: string }; Returns: string }
      suggestion_is_member: { Args: { sid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
