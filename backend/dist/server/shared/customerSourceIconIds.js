"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CUSTOMER_SOURCE_ICON = exports.CUSTOMER_SOURCE_ICON_IDS = void 0;
exports.isCustomerSourceIconId = isCustomerSourceIconId;
exports.normalizeCustomerSourceIcon = normalizeCustomerSourceIcon;
exports.CUSTOMER_SOURCE_ICON_IDS = [
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
];
exports.DEFAULT_CUSTOMER_SOURCE_ICON = 'share2';
function isCustomerSourceIconId(value) {
    return exports.CUSTOMER_SOURCE_ICON_IDS.includes(value);
}
function normalizeCustomerSourceIcon(value) {
    const s = String(value ?? '').trim();
    return isCustomerSourceIconId(s) ? s : exports.DEFAULT_CUSTOMER_SOURCE_ICON;
}
//# sourceMappingURL=customerSourceIconIds.js.map