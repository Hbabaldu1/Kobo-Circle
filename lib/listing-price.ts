import type { ListingType } from '@/types/database';

export function listingPriceLabel(type: ListingType, price: string | null) {
  if (price) return price;
  if (type === 'request') return 'Looking to buy';
  return type === 'service' ? 'Contact seller for pricing' : 'Contact seller for price';
}
