export type ListingType = 'sale' | 'service' | 'request';
export type ListingStatus = 'active' | 'sold' | 'closed';

export interface Database {
  public: {
    Tables: {
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
        Row: { id: string; name: string; email: string; phone: string | null; street_id: string; estate_id: string; created_at: string };
        Insert: { id: string; name: string; email: string; phone?: string | null; street_id: string; estate_id: string; created_at?: string };
        Update: Partial<{ name: string; email: string; phone: string | null; street_id: string; estate_id: string }>;
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
        Row: { id: string; user_id: string; estate_id: string; type: ListingType; title: string; price: string | null; description: string; status: ListingStatus; created_at: string }; 
        Insert: { id?: string; user_id: string; estate_id: string; type: ListingType; title: string; price?: string | null; description: string; status?: ListingStatus; created_at?: string }; 
        Update: Partial<{ title: string; price: string | null; description: string; status: ListingStatus }>;
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
      vouches: { 
        Row: { id: string; voucher_id: string; vouched_for_id: string; note: string; created_at: string }; 
        Insert: { id?: string; voucher_id: string; vouched_for_id: string; note: string; created_at?: string }; 
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
    Views: Record<string, never>;
    Functions: { listings_with_trust: { Args: Record<string, never>; Returns: Array<{ id: string; user_id: string; estate_id: string; type: ListingType; title: string; price: string | null; description: string; status: ListingStatus; created_at: string; seller_name: string; street_name: string; vouch_count: number }> }; };
  };
}
