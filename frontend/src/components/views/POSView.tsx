import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  UserPlus,
  Users,
  Trash2,
  Plus,
  Package,
  Scissors,
  CreditCard,
  Banknote,
  QrCode,
  Ticket,
  CheckCircle2,
  ChevronDown,
  Minus,
  X,
} from 'lucide-react';
import { PaymentSuccessModal } from '../modals/PaymentSuccessModal';
import { cn, formatVnd, parseVndPrice } from '../../lib/utils';
import type { Customer, Employee, Product, Service } from '../../types';

interface POSViewProps {
  authToken: string | null;
  customers: Customer[];
  employees: Employee[];
  services: Service[];
  onCheckoutSuccess?: () => void;
}

interface OrderItem {
  id: string;
  refId?: string;
  name: string;
  subtitle?: string;
  staff?: string;
  quantity: number;
  price: number;
  discountAmount: number;
  type: 'service' | 'product';
}

interface InvoiceSnapshot {
  customerName: string;
  paymentMethod: 'cash' | 'card' | 'qr' | 'voucher';
  receivedAmount: number;
  change: number;
  lineItemsTotal: number;
  lineDiscountTotal: number;
  vipDiscount: number;
  tipAmount: number;
  vat: number;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    lineTotal: number;
  }>;
}

function hasVipTag(customer: Customer | null) {
  if (!customer) return false;
  return customer.tags.some((t) => /vip/i.test(String(t)));
}

function makeLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function POSView({ authToken, customers, employees, services, onCheckoutSuccess }: POSViewProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr' | 'voucher'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('0');
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const [tipPercent, setTipPercent] = useState(0);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceSnapshot | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);

  const [posProducts, setPosProducts] = useState<Product[]>([]);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const activeStaff = useMemo(() => {
    const list = employees.filter((e) => e.status !== 'terminated');
    return list.length ? list : employees;
  }, [employees]);

  const defaultStaffName = activeStaff[0]?.name || '—';

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    fetch('/api/products?page=1&pageSize=300', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.products)) setPosProducts(data.products);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const refreshPosProducts = async () => {
    if (!authToken) return;
    const r = await fetch('/api/products?page=1&pageSize=300', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await r.json().catch(() => null);
    if (r.ok && Array.isArray(data?.products)) setPosProducts(data.products);
  };

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.phone || '')
          .replace(/\s/g, '')
          .includes(q.replace(/\s/g, ''))
    );
  }, [customers, customerQuery]);

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return posProducts;
    return posProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [posProducts, productSearch]);

  const lineItemsTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lineDiscountTotal = orderItems.reduce(
    (sum, item) => sum + Math.min(item.price * item.quantity, Math.max(0, Math.round(item.discountAmount || 0))),
    0
  );
  const subtotal = lineItemsTotal - lineDiscountTotal;
  const discount =
    !isWalkIn && selectedCustomer && hasVipTag(selectedCustomer) ? subtotal * 0.1 : 0;
  const afterDiscount = subtotal - discount;
  const tipAmount = Math.round((afterDiscount * tipPercent) / 100);
  const vat = isVatEnabled ? Math.round(afterDiscount * 0.1) : 0;
  const total = afterDiscount + vat + tipAmount;

  const receivedNum = parseVndPrice(receivedAmount);
  const change = receivedNum - total;

  const customerDisplayName = selectedCustomer
    ? selectedCustomer.name
    : isWalkIn
      ? 'Khách vãng lai'
      : 'Chọn khách hàng';

  const customerPhone = selectedCustomer?.phone || '';

  const customerStatusBadge = (() => {
    if (selectedCustomer) {
      if (selectedCustomer.isWalkIn) return 'VÃNG LAI';
      if (hasVipTag(selectedCustomer)) return 'VIP';
      return 'THÀNH VIÊN';
    }
    if (isWalkIn) return 'VÃNG LAI';
    return 'CHƯA CHỌN';
  })();

  const customerDetailLine = (() => {
    if (selectedCustomer) {
      const phone = selectedCustomer.phone?.trim();
      const last = selectedCustomer.lastVisit?.trim();
      const parts = [
        phone ? `SĐT: ${phone}` : null,
        last ? `Lần gần nhất: ${last}` : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Khách từ danh sách Khách hàng';
    }
    if (isWalkIn) return 'Khách vãng lai không tích điểm hội viên qua POS.';
    return 'Bấm Chọn khách hàng hoặc KHÁCH VÃNG LAI.';
  })();

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setReceivedAmount(String(total));
      return;
    }
    if (receivedAmount === '0') {
      setReceivedAmount(String(total));
    }
  }, [paymentMethod, total]);

  const handleNumberClick = (num: string) => {
    setReceivedAmount((prev) => (prev === '0' ? num : prev + num));
  };

  const handleClear = () => setReceivedAmount('0');

  const handleBackspace = () => {
    setReceivedAmount((prev) => {
      if (prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      return next.length ? next : '0';
    });
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(String(amount));
  };

  const addServiceLine = (service: Service) => {
    const unit = parseVndPrice(service.price);
    setOrderItems((prev) => [
      ...prev,
      {
        id: makeLineId(),
        refId: String(service.id),
        name: service.name,
        subtitle: `${service.duration} | ${service.price}đ`,
        staff: defaultStaffName,
        quantity: 1,
        price: unit || 0,
        discountAmount: 0,
        type: 'service',
      },
    ]);
    setIsAddServiceOpen(false);
    setServiceSearch('');
  };

  const addProductLine = (product: Product) => {
    if (product.stock <= 0) {
      setNoticeMessage('Sản phẩm đã hết hàng.');
      return;
    }
    const unit = parseVndPrice(product.sellingPrice);
    setOrderItems((prev) => [
      ...prev,
      {
        id: makeLineId(),
        refId: String(product.id),
        name: product.name,
        subtitle: `${product.brand} | ${product.sellingPrice}đ`,
        staff: defaultStaffName,
        quantity: 1,
        price: unit || 0,
        discountPercent: 0,
        type: 'product',
      },
    ]);
    setIsAddProductOpen(false);
    setProductSearch('');
  };

  const removeLine = (id: string) => {
    setOrderItems((prev) => prev.filter((x) => x.id !== id));
  };

  const setQty = (id: string, next: number) => {
    const q = Math.max(1, next);
    setOrderItems((prev) => prev.map((x) => (x.id === id ? { ...x, quantity: q } : x)));
  };

  const setStaff = (id: string, staff: string) => {
    setOrderItems((prev) => prev.map((x) => (x.id === id ? { ...x, staff } : x)));
  };

  const resetTransaction = () => {
    setOrderItems([]);
    setReceivedAmount('0');
    setTipPercent(0);
    setIsVatEnabled(false);
    setPaymentMethod('cash');
  };

  const confirmPayment = () => {
    if (!orderItems.length) {
      setNoticeMessage('Vui lòng thêm ít nhất một dòng dịch vụ hoặc sản phẩm.');
      return;
    }
    if (paymentMethod === 'cash' && receivedNum < total) {
      setNoticeMessage('Số tiền nhận chưa đủ để thanh toán. Bạn có thể bấm CHẴN TIỀN để tự điền nhanh.');
      return;
    }
    (async () => {
      if (!authToken) {
        setNoticeMessage('Phiên đăng nhập không hợp lệ.');
        return;
      }

      const response = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isWalkIn,
          customerId: !isWalkIn && selectedCustomer ? selectedCustomer.id : null,
          customerName: !isWalkIn && selectedCustomer ? selectedCustomer.name : '',
          paymentMethod,
          receivedAmount: receivedNum,
          tipPercent,
          isVatEnabled,
          items: orderItems.map((i) => ({
            type: i.type,
            refId: i.refId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            discountAmount: Math.max(0, Math.round(i.discountAmount || 0)),
            staff: i.staff,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setNoticeMessage(data?.message || 'Không thể thanh toán POS.');
        return;
      }

      const data = await response.json().catch(() => null);
      setCheckoutOrderId(String(data?.order?.id || ''));
      if (data?.customer && typeof data.customer === 'object') {
        setSelectedCustomer(data.customer);
      }

      setLastInvoice({
        customerName: customerDisplayName,
        paymentMethod,
        receivedAmount: receivedNum,
        change: paymentMethod === 'cash' ? receivedNum - total : 0,
        lineItemsTotal,
        lineDiscountTotal,
        vipDiscount: discount,
        tipAmount,
        vat,
        total,
        items: orderItems.map((i) => {
          const lineGross = i.price * i.quantity;
          const lineDiscount = Math.min(lineGross, Math.max(0, Math.round(i.discountAmount || 0)));
          return {
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            discountAmount: lineDiscount,
            lineTotal: lineGross - lineDiscount,
          };
        }),
      });

      await refreshPosProducts();
      onCheckoutSuccess?.();
      setIsSuccessModalOpen(true);
    })().catch((e) => {
      const msg = e instanceof Error ? e.message : 'Không thể thanh toán POS.';
      setNoticeMessage(msg);
    });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-[#f8f5f0] overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col p-8 space-y-6 overflow-y-auto">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-wrap items-center gap-6">
          <div className="w-16 h-16 bg-stone-100 rounded-full overflow-hidden flex items-center justify-center text-stone-400 shrink-0">
            {selectedCustomer ? (
              selectedCustomer.avatar ? (
                <img src={selectedCustomer.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif text-primary">
                  {selectedCustomer.name.trim().slice(0, 1).toUpperCase() || '?'}
                </span>
              )
            ) : isWalkIn ? (
              <UserPlus size={24} />
            ) : (
              <Users size={24} />
            )}
          </div>
          <div className="flex-1 space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-serif text-primary">{customerDisplayName}</h3>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest',
                  !selectedCustomer && !isWalkIn
                    ? 'bg-stone-100 text-stone-400'
                    : selectedCustomer?.isWalkIn || (isWalkIn && !selectedCustomer)
                      ? 'bg-stone-100 text-stone-500'
                      : hasVipTag(selectedCustomer)
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-primary/10 text-primary'
                )}
              >
                {customerStatusBadge}
              </span>
              {selectedCustomer && customerPhone ? (
                <span className="text-stone-500 text-xs font-medium">{customerPhone}</span>
              ) : null}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">{customerDetailLine}</p>
            {selectedCustomer && !selectedCustomer.isWalkIn ? (
              <p className="text-[11px] text-stone-500 font-bold">
                Điểm: {selectedCustomer.points ?? 0}
                {selectedCustomer.maxPoints != null ? ` / ${selectedCustomer.maxPoints}` : ''}
              </p>
            ) : null}
          </div>
          {!isWalkIn && selectedCustomer && (
            <div className="bg-stone-50 p-4 rounded-2xl flex items-center gap-4 border border-stone-100">
              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GỢI Ý</p>
                <p className="text-sm font-bold text-primary">Thêm dịch vụ từ danh mục</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-primary-light transition-all"
              >
                + Dịch vụ
              </button>
            </div>
          )}
          {!isWalkIn && !selectedCustomer && (
            <div className="bg-stone-50 p-4 rounded-2xl flex items-center gap-4 border border-stone-100">
              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">KHÁCH HÀNG</p>
                <p className="text-sm font-bold text-primary">Chọn khách hàng từ danh sách</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerPickerOpen(true);
                  setCustomerQuery('');
                }}
                className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-primary-light transition-all inline-flex items-center gap-2"
              >
                <Users size={14} />
                Chọn khách hàng
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-stone-50 flex-wrap gap-4">
            <h3 className="text-lg font-serif text-primary">Chi tiết đơn hàng</h3>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(true)}
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary-light transition-all"
              >
                <Scissors size={14} /> + Dịch vụ
              </button>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="bg-white border border-stone-200 text-stone-600 px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-50 transition-all"
              >
                <Package size={14} /> + Sản phẩm
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-16">STT</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">THỢ PHỤ TRÁCH</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-32">SL</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-40">GIẢM (₫)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">
                    THÀNH TIỀN
                  </th>
                  <th className="px-6 py-4 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-stone-400">
                      Chưa có dòng nào. Nhấn <span className="font-bold text-primary">+ Dịch vụ</span> hoặc{' '}
                      <span className="font-bold text-primary">+ Sản phẩm</span>.
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-stone-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-primary">{item.name}</p>
                          <p className="text-[10px] text-stone-400">{item.subtitle}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block min-w-[140px]">
                          <select
                            value={item.staff || ''}
                            onChange={(e) => setStaff(item.id, e.target.value)}
                            className="appearance-none bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg text-[10px] font-bold pr-8 border border-transparent focus:border-primary/20 outline-none"
                          >
                            {activeStaff.map((e) => (
                              <option key={String(e.id)} value={e.name}>
                                {e.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-stone-600 w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          value={item.discountAmount || 0}
                          onChange={(e) => {
                            const next = Number(e.target.value || 0);
                            const lineTotal = item.price * item.quantity;
                            setOrderItems((prev) =>
                              prev.map((x) =>
                                x.id === item.id
                                  ? { ...x, discountAmount: Math.max(0, Math.min(lineTotal, Number.isFinite(next) ? Math.round(next) : 0)) }
                                  : x
                              )
                            );
                          }}
                          className="w-28 bg-stone-100 text-stone-700 px-2 py-1.5 rounded-lg text-xs font-bold border border-transparent focus:border-primary/20 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary text-right">
                        {formatVnd(Math.max(0, Math.round(item.price * item.quantity - Math.min(item.price * item.quantity, Math.max(0, item.discountAmount || 0)))))}đ
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => removeLine(item.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-stone-50/50 border-t border-stone-50 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Tạm tính gốc</span>
                <span className="text-sm font-bold text-primary">{formatVnd(lineItemsTotal)} đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Giảm theo dòng</span>
                <span className="text-sm font-bold text-primary">-{formatVnd(lineDiscountTotal)} đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Tạm tính sau giảm</span>
                <span className="text-sm font-bold text-primary">{formatVnd(subtotal)} đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Khuyến mãi</span>
                <span
                  className={cn(
                    'text-sm font-bold uppercase tracking-wider',
                    isWalkIn || !selectedCustomer || !hasVipTag(selectedCustomer)
                      ? 'text-stone-300'
                      : 'text-secondary'
                  )}
                >
                  {isWalkIn || !selectedCustomer
                    ? '—'
                    : hasVipTag(selectedCustomer)
                      ? 'VIP (-10%)'
                      : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Giảm VIP</span>
                <span className="text-sm font-bold text-primary">-{formatVnd(discount)} đ</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">VAT (10%)</span>
                  <button
                    type="button"
                    onClick={() => setIsVatEnabled(!isVatEnabled)}
                    className={cn(
                      'w-10 h-5 rounded-full transition-all relative p-1',
                      isVatEnabled ? 'bg-secondary' : 'bg-stone-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 bg-white rounded-full transition-all',
                        isVatEnabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
                <span className="text-sm font-bold text-primary">{formatVnd(vat)} đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Tip ({tipPercent}%)</span>
                <span className="text-sm font-bold text-primary">{formatVnd(tipAmount)} đ</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Tiền Tip</span>
                <div className="flex gap-2">
                  {[0, 5, 10].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTipPercent(p)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[10px] font-bold border transition-all',
                        tipPercent === p
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-stone-400 border-stone-200'
                      )}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-stone-400 text-right italic">
                Tip tính trên tạm tính sau giảm (trước VAT).
              </p>
              <div className="h-px bg-stone-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">ĐIỂM TÍCH LŨY (ước tính)</span>
                {isWalkIn || !selectedCustomer || selectedCustomer.isWalkIn ? (
                  <span className="text-xs font-bold text-stone-300 italic">Không áp dụng</span>
                ) : (
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">
                      {selectedCustomer.points ?? 0}{' '}
                      <span className="text-green-600">+{Math.floor(total / 10000)}</span> điểm
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">1 điểm / 10.000đ (demo)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[450px] xl:w-[450px] bg-white border-l border-stone-100 flex flex-col shadow-2xl z-10 min-h-0">
        <div className="p-10 space-y-10 flex-1 overflow-y-auto">
          <div className="text-center space-y-2 py-8 bg-stone-50 rounded-[2.5rem] border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG CỘNG THANH TOÁN</p>
            <h2 className="text-4xl font-serif text-primary">{formatVnd(total)} đ</h2>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">HÌNH THỨC THANH TOÁN</h4>
              <button
                type="button"
                onClick={() => setNoticeMessage('Chia đôi thanh toán sẽ có trong bản sau.')}
                className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest"
              >
                <RefreshCcwIcon size={12} /> CHIA ĐÔI
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PaymentMethodButton
                active={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
                icon={<Banknote size={24} />}
                label="TIỀN MẶT"
              />
              <PaymentMethodButton
                active={paymentMethod === 'card'}
                onClick={() => setPaymentMethod('card')}
                icon={<CreditCard size={24} />}
                label="THẺ NGÂN HÀNG"
              />
              <PaymentMethodButton
                active={paymentMethod === 'qr'}
                onClick={() => setPaymentMethod('qr')}
                icon={<QrCode size={24} />}
                label="QR CODE"
              />
              <PaymentMethodButton
                active={paymentMethod === 'voucher'}
                onClick={() => setPaymentMethod('voucher')}
                icon={<Ticket size={24} />}
                label="VOUCHER"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SỐ TIỀN NHẬN</span>
              <span className="text-3xl font-serif text-primary">{formatVnd(receivedNum)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TIỀN THỐI</span>
              <span className={cn('text-2xl font-serif', change >= 0 ? 'text-green-600' : 'text-red-500')}>
                {formatVnd(change)} đ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <NumberButton label={String(n)} onClick={() => handleNumberClick(String(n))} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleQuickAmount(total)}
              className="w-full h-14 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl text-xs font-bold hover:bg-secondary/20 transition-all"
            >
              CHẴN TIỀN
            </button>
            {[4, 5, 6].map((n) => (
              <div key={n}>
                <NumberButton label={String(n)} onClick={() => handleNumberClick(String(n))} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleQuickAmount(500000)}
              className="w-full h-14 bg-stone-50 text-stone-600 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
            >
              500k
            </button>
            {[7, 8, 9].map((n) => (
              <div key={n}>
                <NumberButton label={String(n)} onClick={() => handleNumberClick(String(n))} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleQuickAmount(200000)}
              className="w-full h-14 bg-stone-50 text-stone-600 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
            >
              200k
            </button>
            <NumberButton label="⌫" onClick={handleBackspace} />
            <NumberButton label="0" onClick={() => handleNumberClick('0')} />
            <NumberButton label="C" onClick={handleClear} />
            <div />
          </div>
        </div>

        <div className="p-8 pt-4 space-y-4 shrink-0 bg-white border-t border-stone-100">
          <button
            type="button"
            onClick={confirmPayment}
            className="w-full bg-primary text-white py-4 rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <CheckCircle2 size={20} />
            XÁC NHẬN THANH TOÁN
          </button>
          <button
            type="button"
            onClick={() => {
              if (orderItems.length && !window.confirm('Hủy toàn bộ đơn hiện tại?')) return;
              resetTransaction();
              setSelectedCustomer(null);
              setIsWalkIn(false);
            }}
            className="w-full text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
          >
            HỦY GIAO DỊCH
          </button>
        </div>
      </div>

      <AnimatePresence>
        {noticeMessage && (
          <NoticeModal
            title="Thông báo thanh toán"
            message={noticeMessage}
            onClose={() => setNoticeMessage(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomerPickerOpen && (
          <PickerOverlay
            title="Chọn khách hàng"
            subtitle="Danh sách lấy từ mục Khách hàng (API /api/customers)"
            onClose={() => setIsCustomerPickerOpen(false)}
          >
            <div className="p-4 border-b border-stone-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                {customers.length} khách trong hệ thống
              </p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {customers.length === 0 ? (
                <p className="p-4 text-sm text-stone-400">Chưa có khách hàng. Thêm tại mục Khách hàng.</p>
              ) : filteredCustomers.length === 0 ? (
                <p className="p-4 text-sm text-stone-400">Không tìm thấy khách phù hợp.</p>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={String(c.id)}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsWalkIn(false);
                      setCustomerQuery('');
                      setIsCustomerPickerOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{c.name}</p>
                      <p className="text-xs text-stone-400">{c.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {c.isWalkIn ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 uppercase tracking-wider">
                          Vãng lai
                        </span>
                      ) : null}
                      {hasVipTag(c) ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary uppercase tracking-wider">
                          VIP
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </PickerOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccessModalOpen && (
          <PaymentSuccessModal
            onClose={() => {
              setIsSuccessModalOpen(false);
              setCheckoutOrderId(null);
              setLastInvoice(null);
              resetTransaction();
              setSelectedCustomer(null);
              setIsWalkIn(false);
            }}
            amount={formatVnd(lastInvoice?.total || total)}
            customerName={lastInvoice?.customerName || customerDisplayName}
            orderId={checkoutOrderId}
            invoice={lastInvoice}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddServiceOpen && (
          <PickerOverlay title="Chọn dịch vụ" onClose={() => setIsAddServiceOpen(false)}>
            <div className="p-4 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Tìm dịch vụ..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filteredServices.length === 0 ? (
                <p className="p-4 text-sm text-stone-400">Không có dịch vụ. Thêm tại mục Dịch vụ & Giá.</p>
              ) : (
                filteredServices.map((s) => (
                  <button
                    key={String(s.id)}
                    type="button"
                    onClick={() => addServiceLine(s)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-50 flex justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-primary">{s.name}</p>
                      <p className="text-[10px] text-stone-400">{s.category} · {s.duration}</p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{s.price}đ</span>
                  </button>
                ))
              )}
            </div>
          </PickerOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddProductOpen && (
          <PickerOverlay title="Chọn sản phẩm" onClose={() => setIsAddProductOpen(false)}>
            <div className="p-4 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-100 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filteredProducts.length === 0 ? (
                <p className="p-4 text-sm text-stone-400">Chưa có sản phẩm. Thêm tại kho Sản phẩm.</p>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={String(p.id)}
                    type="button"
                    disabled={p.stock <= 0}
                    onClick={() => addProductLine(p)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl flex justify-between gap-4',
                      p.stock <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-stone-50'
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold text-primary">{p.name}</p>
                      <p className="text-[10px] text-stone-400">
                        {p.brand} · Tồn: {p.stock}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{p.sellingPrice}đ</span>
                  </button>
                ))
              )}
            </div>
          </PickerOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentMethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-3',
        active
          ? 'bg-white border-primary text-primary shadow-xl scale-105'
          : 'bg-stone-50 border-transparent text-stone-400 hover:bg-white hover:border-stone-200'
      )}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function NumberButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-14 bg-stone-50 text-stone-600 rounded-2xl text-lg font-bold hover:bg-stone-100 transition-all active:scale-95"
    >
      {label}
    </button>
  );
}

function RefreshCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function NoticeModal({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-6 pb-4">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-7 pb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 min-w-[90px] px-5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-light transition-all"
          >
            Đã hiểu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PickerOverlay({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-stone-100"
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-stone-100 gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-serif text-primary">{title}</h3>
            {subtitle ? <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 shrink-0">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
