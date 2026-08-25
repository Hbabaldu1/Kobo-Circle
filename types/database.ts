export type ListingType = 'sale' | 'service' | 'request';
export type ListingStatus = 'active' | 'sold' | 'closed';

export interface Database {
  public: {
    Tables: {
      estates: { Row: { id: string; name: string; city: string; created_at: string }; Insert: never; Update: never };
      streets: { Row: { id: string; estate_id: string; name: string }; Insert: never; Update: never };
      users: { Row: { id: string; name: string; phone: string; street_id: string; estate_id: string; created_at: string }; Insert: never; Update: never };
      listings: { Row: { id: string; user_id: string; estate_id: string; type: ListingType; title: string; price: string | null; description: string; status: ListingStatus; created_at: string }; Insert: never; Update: never };
      vouches: { Row: { id: string; voucher_id: string; vouched_for_id: string; note: string; created_at: string }; Insert: never; Update: never };
    };
  };
}
