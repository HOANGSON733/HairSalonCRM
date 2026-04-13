/**
 * Danh sách nguồn khách dùng chung: Hệ thống → Nguồn khách, form thêm khách, v.v.
 * Chỉnh tại đây để đồng bộ toàn app.
 */
export const CUSTOMER_SOURCES = [
  'Facebook',
  'Instagram',
  'TikTok',
  'Zalo',
  'Google / Website',
  'Người quen giới thiệu',
  'Vãng lai',
] as const;

export type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

export const DEFAULT_CUSTOMER_SOURCE: string = CUSTOMER_SOURCES[0];
