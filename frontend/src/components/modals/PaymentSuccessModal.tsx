import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Printer, Share2, X } from 'lucide-react';

interface PaymentSuccessModalProps {
  onClose: () => void;
  amount: string;
  customerName: string;
  orderId?: string | null;
  invoice?: {
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
  } | null;
}

function paymentMethodLabel(method: 'cash' | 'card' | 'qr' | 'voucher') {
  if (method === 'cash') return 'Tiền mặt';
  if (method === 'card') return 'Thẻ ngân hàng';
  if (method === 'qr') return 'QR code';
  return 'Voucher';
}

export function PaymentSuccessModal({ onClose, amount, customerName, orderId, invoice = null }: PaymentSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12 text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <CheckCircle2 size={48} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-primary">Thanh toán thành công!</h2>
          <p className="text-stone-500 text-sm">Giao dịch đã được ghi nhận vào hệ thống.</p>
        </div>

        <div className="bg-stone-50 rounded-3xl p-6 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">KHÁCH HÀNG</span>
            <span className="text-sm font-bold text-primary text-right">{customerName}</span>
          </div>
          {orderId ? (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÃ HÓA ĐƠN</span>
              <span className="text-sm font-bold text-primary text-right">{orderId}</span>
            </div>
          ) : null}

          {invoice ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">THANH TOÁN</span>
                <span className="text-sm font-bold text-primary">{paymentMethodLabel(invoice.paymentMethod)}</span>
              </div>

              <div className="rounded-2xl bg-white border border-stone-200 p-3 space-y-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">CHI TIẾT DÒNG HÓA ĐƠN</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {invoice.items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="text-xs text-stone-700">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold truncate">{item.name} x{item.quantity}</span>
                        <span>{item.lineTotal.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {item.discountAmount > 0 ? (
                        <p className="text-[10px] text-stone-400">Giảm: -{item.discountAmount.toLocaleString('vi-VN')}đ</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Tạm tính gốc</span>
                  <span>{invoice.lineItemsTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Giảm theo dòng</span>
                  <span>-{invoice.lineDiscountTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Giảm VIP</span>
                  <span>-{Math.round(invoice.vipDiscount).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Tip</span>
                  <span>{invoice.tipAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>VAT</span>
                  <span>{invoice.vat.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="h-px bg-stone-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG THANH TOÁN</span>
                  <span className="text-xl font-serif text-primary">{invoice.total.toLocaleString('vi-VN')} đ</span>
                </div>
                {invoice.paymentMethod === 'cash' ? (
                  <>
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>Khách đưa</span>
                      <span>{invoice.receivedAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-green-700">
                      <span>Tiền thối</span>
                      <span>{invoice.change.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SỐ TIỀN</span>
              <span className="text-xl font-serif text-primary">{amount} đ</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-light transition-all shadow-lg">
            <Printer size={18} /> IN HÓA ĐƠN
          </button>
          <button className="flex items-center justify-center gap-2 py-4 border border-stone-200 text-stone-600 rounded-2xl text-sm font-bold hover:bg-stone-50 transition-all">
            <Share2 size={18} /> GỬI ZALO
          </button>
        </div>

        <button 
          onClick={onClose}
          className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-primary transition-colors"
        >
          ĐÓNG CỬA SỔ
        </button>
      </motion.div>
    </div>
  );
}
