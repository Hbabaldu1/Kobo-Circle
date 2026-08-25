export type ListingType = 'sale' | 'service' | 'request';
export type ListingStatus = 'active' | 'sold' | 'closed';

export interface Database {
  public: {
    Tables: {
      estates: { Row: { id: string; name: string; city: string; created_at: string }; Insert: { id?: string; name: string; city: string; created_at?: string }; Update: Partial<{ name: string; city: string }> };
      streets: { Row: { id: string; estate_id: string; name: string }; Insert: { id?: string; estate_id: string; name: string }; Update: Partial<{ estate_id: string; name: string }> };
      users: { Row: { id: string; name: string; phone: string; street_id: string; estate_id: string; created_at: string }; Insert: { id: string; name: string; phone: string; street_id: string; estate_id: string; created_at?: string }; Update: Partial<{ name: string; phone: string; street_id: string; estate_id: string }> };
      listings: { Row: { id: string; user_id: string; estate_id: string; type: ListingType; title: string; price: string | null; description: string; status: ListingStatus; created_at: string }; Insert: { id?: string; user_id: string; estate_id: string; type: ListingType; title: string; price?: string | null; description: string; status?: ListingStatus; created_at?: string }; Update: Partial<{ title: string; price: string | null; description: string; status: ListingStatus }> };
      vouches: { Row: { id: string; voucher_id: string; vouched_for_id: string; note: string; created_at: string }; Insert: { id?: string; voucher_id: string; vouched_for_id: string; note: string; created_at?: string }; Update: never };
    };
  };
}
