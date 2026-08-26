import Image from 'next/image';
import type { ListingType } from '@/types/database';

const placeholderClasses: Record<ListingType, string> = {
  sale: 'bg-adire/15',
  service: 'bg-brick/15',
  request: 'bg-[#EFE7D6]',
};

export function ListingPhoto({ photoUrl, type, title, className = '' }: { photoUrl: string | null; type: ListingType; title: string; className?: string }) {
  if (photoUrl) {
    return <Image src={photoUrl} alt={title} width={640} height={480} loading="lazy" className={`h-44 w-full rounded-xl object-cover ${className}`} />;
  }

  return <div aria-hidden="true" className={`h-44 w-full rounded-xl ${placeholderClasses[type]} ${className}`} />;
}
