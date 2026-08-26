const avatarPalette = ['bg-adire', 'bg-leaf', 'bg-brick', 'bg-ochre'];

function hashUserId(id: string): number {
  return Array.from(id).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

export function UserAvatar({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const color = avatarPalette[Math.abs(hashUserId(id)) % avatarPalette.length];
  return <div aria-hidden="true" className={`grid place-items-center rounded-full font-heading font-bold text-white ${color} ${className}`}>{initial}</div>;
}
