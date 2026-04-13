import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Globe,
  Heart,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  QrCode,
  Rss,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Users,
  Video,
} from 'lucide-react';
import type { CustomerSourceIconId } from '../shared/customerSourceIconIds';
import {
  CUSTOMER_SOURCE_ICON_IDS,
  DEFAULT_CUSTOMER_SOURCE_ICON,
  normalizeCustomerSourceIcon,
} from '../shared/customerSourceIconIds';

const ICON_MAP: Record<CustomerSourceIconId, ComponentType<LucideProps>> = {
  share2: Share2,
  users: Users,
  globe: Globe,
  smartphone: Smartphone,
  messageCircle: MessageCircle,
  mapPin: MapPin,
  store: Store,
  megaphone: Megaphone,
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  phone: Phone,
  mail: Mail,
  qrCode: QrCode,
  search: Search,
  video: Video,
  rss: Rss,
};

export function CustomerSourceIcon({
  iconId,
  size = 18,
  className,
}: {
  iconId?: string | null;
  size?: number;
  className?: string;
}) {
  const id = normalizeCustomerSourceIcon(iconId);
  const Cmp = ICON_MAP[id];
  return <Cmp size={size} className={className} aria-hidden />;
}

export const CUSTOMER_SOURCE_ICON_OPTIONS = CUSTOMER_SOURCE_ICON_IDS.map((id) => ({
  id,
  component: ICON_MAP[id],
}));

export { DEFAULT_CUSTOMER_SOURCE_ICON, normalizeCustomerSourceIcon };
