export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'cashier'
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'manager' | 'cashier'
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'cashier'
          full_name?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          barcode: string | null
          name: string
          description: string | null
          price: number
          stock_quantity: number
          category_id: string | null
          low_stock_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          barcode?: string | null
          name: string
          description?: string | null
          price: number
          stock_quantity?: number
          category_id?: string | null
          low_stock_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          barcode?: string | null
          name?: string
          description?: string | null
          price?: number
          stock_quantity?: number
          category_id?: string | null
          low_stock_threshold?: number
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          loyalty_points: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          loyalty_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          loyalty_points?: number
        }
      }
      transactions: {
        Row: {
          id: string
          cashier_id: string
          customer_id: string | null
          subtotal: number
          tax: number
          discount: number
          total: number
          payment_method: string
          status: 'completed' | 'refunded' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          cashier_id: string
          customer_id?: string | null
          subtotal: number
          tax: number
          discount?: number
          total: number
          payment_method: string
          status?: 'completed' | 'refunded' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          status?: 'completed' | 'refunded' | 'pending'
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id: string
          quantity: number
          unit_price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          quantity?: number
          unit_price?: number
          total?: number
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          quantity_change: number
          type: 'sale' | 'restock' | 'adjustment'
          user_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity_change: number
          type: 'sale' | 'restock' | 'adjustment'
          user_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: {}
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
