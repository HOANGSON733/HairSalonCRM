export const CUSTOMER_SOURCE_ICON_IDS = [
  'share2',
  'users',
  'globe',
  'smartphone',
  'messageCircle',
  'mapPin',
  'store',
  'megaphone',
  'sparkles',
  'star',
  'heart',
  'phone',
  'mail',
  'qrCode',
  'search',
  'video',
  'rss',
] as const;

export type CustomerSourceIconId = (typeof CUSTOMER_SOURCE_ICON_IDS)[number];

export const DEFAULT_CUSTOMER_SOURCE_ICON: CustomerSourceIconId = 'share2';

export function isCustomerSourceIconId(value: string): value is CustomerSourceIconId {
  return (CUSTOMER_SOURCE_ICON_IDS as readonly string[]).includes(value);
}

export function normalizeCustomerSourceIcon(value: unknown): CustomerSourceIconId {
  const s = String(value ?? '').trim();
  return isCustomerSourceIconId(s) ? s : DEFAULT_CUSTOMER_SOURCE_ICON;
}
