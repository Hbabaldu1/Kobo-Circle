export type ListingType = 'sale' | 'service' | 'request';
export type ListingStatus = 'active' | 'sold' | 'closed';

export interface Database {
  public: {
    Tables: {
      states: { Row: { id: string; name: string; created_at: string }; Insert: { id?: string; name: string; created_at?: string }; Update: Partial<{ name: string }>; Relationships: []; };
      lgas: { Row: { id: string; state_id: string; name: string; created_at: string }; Insert: { id?: string; state_id: string; name: string; created_at?: string }; Update: Partial<{ state_id: string; name: string }>; Relationships: []; };
      wards: { Row: { id: string; lga_id: string; name: string; created_at: string }; Insert: { id?: string; lga_id: string; name: string; created_at?: string }; Update: Partial<{ lga_id: string; name: string }>; Relationships: []; };
      estates: {
        Row: { id: string; name: string; city: string; created_at: string };
        Insert: { id?: string; name: string; city: string; created_at?: string };
        Update: Partial<{ name: string; city: string }>;
        Relationships: [];
      };
      streets: {
        Row: { id: string; estate_id: string; name: string };
        Insert: { id?: string; estate_id: string; name: string };
        Update: Partial<{ estate_id: string; name: string }>;
        Relationships: [{
          foreignKeyName: 'streets_estate_id_fkey';
          columns: ['estate_id'];
          isOneToOne: false;
          referencedRelation: 'estates';
          referencedColumns: ['id'];
        }];
      };
      users: {
        Row: { id: string; name: string; email: string; phone: string | null; avatar_url: string | null; street_id: string | null; estate_id: string | null; state_id: string; lga_id: string; ward_id: string; created_at: string };
        Insert: { id: string; name: string; email: string; phone?: string | null; avatar_url?: string | null; street_id?: string | null; estate_id?: string | null; state_id: string; lga_id: string; ward_id: string; created_at?: string };
        Update: Partial<{ name: string; email: string; phone: string | null; avatar_url: string | null; street_id: string | null; estate_id: string | null; state_id: string; lga_id: string; ward_id: string }>;
        Relationships: [{
          foreignKeyName: 'users_estate_id_fkey';
          columns: ['estate_id'];
          isOneToOne: false;
          referencedRelation: 'estates';
          referencedColumns: ['id'];
        }, {
          foreignKeyName: 'users_street_id_fkey';
          columns: ['street_id'];
          isOneToOne: false;
          referencedRelation: 'streets';
          referencedColumns: ['id'];
        }];
      };
      listings: {
        Row: { id: string; user_id: string; estate_id: string | null; state_id: string; lga_id: string; type: ListingType; title: string; price: string | null; description: string | null; photo_url: string | null; status: ListingStatus; created_at: string };
        Insert: { id?: string; user_id: string; estate_id?: string | null; state_id: string; lga_id: string; type: ListingType; title: string; price?: string | null; description?: string | null; photo_url?: string | null; status?: ListingStatus; created_at?: string };
        Update: Partial<{ title: string; price: string | null; description: string | null; photo_url: string | null; status: ListingStatus }>;
        Relationships: [{
          foreignKeyName: 'listings_estate_id_fkey';
          columns: ['estate_id'];
          isOneToOne: false;
          referencedRelation: 'estates';
          referencedColumns: ['id'];
        }, {
          foreignKeyName: 'listings_user_id_fkey';
          columns: ['user_id'];
          isOneToOne: false;
          referencedRelation: 'users';
          referencedColumns: ['id'];
        }];
      };
      conversations: {
        Row: { id: string; participant_one: string; participant_two: string; listing_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; participant_one: string; participant_two: string; listing_id?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<{ updated_at: string }>;
        Relationships: [];
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; read_at: string | null; created_at: string };
        Insert: { id?: string; conversation_id: string; sender_id: string; content: string; read_at?: string | null; created_at?: string };
        Update: Partial<{ read_at: string }>;
        Relationships: [];
      };
      vouches: {
        Row: { id: string; voucher_id: string; vouched_for_id: string; note: string | null; created_at: string };
        Insert: { id?: string; voucher_id: string; vouched_for_id: string; note?: string | null; created_at?: string };
        Update: never;
        Relationships: [{
          foreignKeyName: 'vouches_voucher_id_fkey';
          columns: ['voucher_id'];
          isOneToOne: false;
          referencedRelation: 'users';
          referencedColumns: ['id'];
        }, {
          foreignKeyName: 'vouches_vouched_for_id_fkey';
          columns: ['vouched_for_id'];
          isOneToOne: false;
          referencedRelation: 'users';
          referencedColumns: ['id'];
        }];
      };
    };
    Views: {
      seller_trust: {
        Row: { user_id: string; vouch_count: number; trust_ratio: number };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
