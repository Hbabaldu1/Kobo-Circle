export type ListingType = 'sale' | 'service' | 'request';
export type ListingStatus = 'active' | 'sold' | 'closed';

/**
 * Generated-schema-compatible application types.
 *
 * PostgreSQL enforces the composite location foreign keys. TypeScript cannot
 * represent that relationship, so callers must always derive state_id, lga_id,
 * and ward_id from one trusted location record rather than combining IDs from
 * separate client inputs.
 */
export interface Database {
  public: {
    Tables: {
      states: { Row: { id: string; name: string; created_at: string }; Insert: { id?: string; name: string; created_at?: string }; Update: Partial<{ name: string }>; Relationships: [] };
      lgas: { Row: { id: string; state_id: string; name: string; created_at: string }; Insert: { id?: string; state_id: string; name: string; created_at?: string }; Update: Partial<{ state_id: string; name: string }>; Relationships: [] };
      wards: { Row: { id: string; lga_id: string; state_id: string; name: string; created_at: string }; Insert: { id?: string; lga_id: string; state_id: string; name: string; created_at?: string }; Update: Partial<{ lga_id: string; state_id: string; name: string }>; Relationships: [] };
      users: {
        Row: { id: string; name: string; email: string; phone: string | null; avatar_url: string | null; state_id: string; lga_id: string; ward_id: string | null; created_at: string };
        Insert: { id: string; name: string; email: string; phone?: string | null; avatar_url?: string | null; state_id: string; lga_id: string; ward_id?: string | null; created_at?: string };
        Update: Partial<{ name: string; email: string; phone: string | null; avatar_url: string | null; state_id: string; lga_id: string; ward_id: string | null }>;
        Relationships: [];
      };
      listings: {
        Row: { id: string; user_id: string; state_id: string; lga_id: string; ward_id: string | null; type: ListingType; title: string; price: string | null; description: string | null; photo_url: string | null; status: ListingStatus; created_at: string };
        Insert: { id?: string; user_id: string; state_id: string; lga_id: string; ward_id?: string | null; type: ListingType; title: string; price?: string | null; description?: string | null; photo_url?: string | null; status?: ListingStatus; created_at?: string };
        Update: Partial<{ title: string; price: string | null; description: string | null; photo_url: string | null; status: ListingStatus }>;
        Relationships: [{ foreignKeyName: 'listings_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }];
      };
      conversations: { Row: { id: string; participant_one: string; participant_two: string; listing_id: string | null; created_at: string; updated_at: string }; Insert: { id?: string; participant_one: string; participant_two: string; listing_id?: string | null; created_at?: string; updated_at?: string }; Update: Partial<{ updated_at: string }>; Relationships: [] };
      messages: { Row: { id: string; conversation_id: string; sender_id: string; content: string; message_type: 'text' | 'listing_reference'; reference_listing_id: string | null; read_at: string | null; created_at: string }; Insert: { id?: string; conversation_id: string; sender_id: string; content: string; message_type?: 'text' | 'listing_reference'; reference_listing_id?: string | null; read_at?: string | null; created_at?: string }; Update: Partial<{ read_at: string }>; Relationships: [] };
      vouches: { Row: { id: string; voucher_id: string; vouched_for_id: string; vouch_type: 'community' | 'tenure' | 'transaction'; note: string | null; created_at: string }; Insert: { id?: string; voucher_id: string; vouched_for_id: string; vouch_type: 'community' | 'tenure' | 'transaction'; note?: string | null; created_at?: string }; Update: never; Relationships: [] };
      phone_update_attempts: { Row: { id: string; user_id: string; attempted_at: string }; Insert: { id?: string; user_id: string; attempted_at?: string }; Update: never; Relationships: [] };
      notification_preferences: { Row: { user_id: string; vouch_enabled: boolean; message_enabled: boolean; listing_enabled: boolean; created_at: string; updated_at: string }; Insert: { user_id: string; vouch_enabled?: boolean; message_enabled?: boolean; listing_enabled?: boolean; created_at?: string; updated_at?: string }; Update: Partial<{ vouch_enabled: boolean; message_enabled: boolean; listing_enabled: boolean; updated_at: string }>; Relationships: [] };
      push_subscriptions: { Row: { id: string; user_id: string; endpoint: string; keys: { p256dh: string; auth: string }; created_at: string }; Insert: { id?: string; user_id: string; endpoint: string; keys: { p256dh: string; auth: string }; created_at?: string }; Update: never; Relationships: [] };
    };
    Views: { seller_trust: { Row: { user_id: string; community_vouch_count: number; tenure_vouch_count: number; transaction_vouch_count: number; weighted_score: number; trust_ratio: number }; Insert: never; Update: never; Relationships: [] } };
    Functions: Record<string, never>;
  };
}
