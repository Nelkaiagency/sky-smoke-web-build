export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string | null
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string | null
          shop_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_users_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      age_verifications: {
        Row: {
          customer_phone: string
          id: string
          method: string | null
          shop_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          customer_phone: string
          id?: string
          method?: string | null
          shop_id: string
          verified: boolean
          verified_at?: string | null
        }
        Update: {
          customer_phone?: string
          id?: string
          method?: string | null
          shop_id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'age_verifications_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          shop_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_profiles_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      discount_tiers: {
        Row: {
          active: boolean
          created_at: string
          discount_percent: number
          id: string
          min_order_total: number
          shop_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_percent: number
          id?: string
          min_order_total: number
          shop_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_percent?: number
          id?: string
          min_order_total?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'discount_tiers_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          age_verification_id: string
          collected_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          discount_applied_percent: number | null
          id: string
          items: Json
          shop_id: string
          source: string | null
          status: string | null
          subtotal_before_discount: number | null
          total_eur: number
        }
        Insert: {
          age_verification_id: string
          collected_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          discount_applied_percent?: number | null
          id?: string
          items: Json
          shop_id: string
          source?: string | null
          status?: string | null
          subtotal_before_discount?: number | null
          total_eur: number
        }
        Update: {
          age_verification_id?: string
          collected_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          discount_applied_percent?: number | null
          id?: string
          items?: Json
          shop_id?: string
          source?: string | null
          status?: string | null
          subtotal_before_discount?: number | null
          total_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: 'orders_age_verification_id_fkey'
            columns: ['age_verification_id']
            isOneToOne: false
            referencedRelation: 'age_verifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customer_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      product_categories: {
        Row: {
          id: string
          name: string
          shop_id: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          shop_id: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          shop_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'product_categories_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          age_restricted: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_eur: number
          shop_id: string
          stock_qty: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          age_restricted?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_eur: number
          shop_id: string
          stock_qty?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          age_restricted?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_eur?: number
          shop_id?: string
          stock_qty?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      shops: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          id: string
          name: string
          opening_hours: Json | null
          phone: string | null
          slug: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          opening_hours?: Json | null
          phone?: string | null
          slug: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          slug?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          change_qty: number
          created_at: string | null
          id: string
          product_id: string
          reason: string | null
          shop_id: string
          source: string | null
        }
        Insert: {
          change_qty: number
          created_at?: string | null
          id?: string
          product_id: string
          reason?: string | null
          shop_id: string
          source?: string | null
        }
        Update: {
          change_qty?: number
          created_at?: string | null
          id?: string
          product_id?: string
          reason?: string | null
          shop_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_movements_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          direction: string
          from_number: string | null
          id: string
          parsed_intent: Json | null
          raw_message: string | null
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          from_number?: string | null
          id?: string
          parsed_intent?: Json | null
          raw_message?: string | null
          shop_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          from_number?: string | null
          id?: string
          parsed_intent?: Json | null
          raw_message?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'whatsapp_messages_shop_id_fkey'
            columns: ['shop_id']
            isOneToOne: false
            referencedRelation: 'shops'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
