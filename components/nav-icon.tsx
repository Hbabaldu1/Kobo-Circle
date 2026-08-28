import {
  ArrowLeft,
  Bell,
  CirclePlus,
  Home,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react';

type IconName = 'home' | 'messages' | 'post' | 'profile' | 'search' | 'notifications' | 'back' | 'attachment' | 'send' | 'settings';

const icons: Record<IconName, LucideIcon> = {
  home: Home,
  messages: MessageCircle,
  post: CirclePlus,
  profile: User,
  search: Search,
  notifications: Bell,
  back: ArrowLeft,
  attachment: Paperclip,
  send: Send,
  settings: Settings,
};

export function NavIcon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const Icon = icons[name];

  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}
