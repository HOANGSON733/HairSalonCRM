import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  Percent, 
  Banknote, 
  Gift, 
  ChevronDown, 
  Info,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NewPromoCodeModalProps {
  onClose: () => void;
}

export function NewPromoCodeModal({ onClose }: NewPromoCodeModalProps) {
  const [discountType, setDiscountType] = useState<'percent' | 'amount' | 'free'>('percent');
  const [tiers, setTiers] = useState(['Kim cương', 'Vàng']);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-10 pb-6 flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif text-primary">Tạo mã khuyến mãi</h2>
            <p className="text-sm text-stone-400">Thiết lập chương trình ưu đãi đặc quyền cho khách hàng.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-10 pt-0 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN CHƯƠNG TRÌNH</label>
              <input 
                type="text" 
                placeholder="VD: Ưu đãi Hè Sang"
                className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÃ VOUCHER</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  defaultValue="ATELIER2024"
                  className="flex-1 bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 ring-primary/5 outline-none uppercase"
                />
                <button className="p-4 bg-stone-100 text-stone-500 rounded-2xl hover:bg-stone-200 transition-all">
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="bg-stone-50/50 rounded-[2rem] p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LOẠI GIẢM GIÁ</label>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => setDiscountType('percent')}
                  className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-3 transition-all border-2",
                    discountType === 'percent' ? "bg-white border-primary shadow-sm" : "bg-white/50 border-transparent hover:bg-white"
                  )}
                >
                  <Percent size={20} className={discountType === 'percent' ? "text-primary" : "text-stone-400"} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", discountType === 'percent' ? "text-primary" : "text-stone-400")}>GIẢM %</span>
                </button>
                <button 
                  onClick={() => setDiscountType('amount')}
                  className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-3 transition-all border-2",
                    discountType === 'amount' ? "bg-white border-primary shadow-sm" : "bg-white/50 border-transparent hover:bg-white"
                  )}
                >
                  <Banknote size={20} className={discountType === 'amount' ? "text-primary" : "text-stone-400"} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", discountType === 'amount' ? "text-primary" : "text-stone-400")}>GIẢM TIỀN</span>
                </button>
                <button 
                  onClick={() => setDiscountType('free')}
                  className={cn(
                    "p-6 rounded-2xl flex flex-col items-center gap-3 transition-all border-2",
                    discountType === 'free' ? "bg-white border-primary shadow-sm" : "bg-white/50 border-transparent hover:bg-white"
                  )}
                >
                  <Gift size={20} className={discountType === 'free' ? "text-primary" : "text-stone-400"} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", discountType === 'free' ? "text-primary" : "text-stone-400")}>MIỄN PHÍ DV</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIÁ TRỊ GIẢM</label>
              <div className="relative">
                <input 
                  type="number" 
                  defaultValue="0"
                  className="w-full bg-white border-none rounded-2xl px-6 py-4 text-lg font-bold text-primary focus:ring-2 ring-primary/5 outline-none"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                  {discountType === 'percent' ? '%' : discountType === 'amount' ? 'đ' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Conditions */}
            <div className="space-y-6">
              <h3 className="text-lg font-serif text-primary">Điều kiện áp dụng</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">ĐƠN TỐI THIỂU (VNĐ)</label>
                <input 
                  type="text" 
                  placeholder="VD: 500.000"
                  className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DỊCH VỤ ÁP DỤNG</label>
                <div className="relative">
                  <select className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary appearance-none cursor-pointer focus:ring-2 ring-primary/5 outline-none">
                    <option>Tất cả dịch vụ</option>
                    <option>Cắt tóc & Tạo kiểu</option>
                    <option>Uốn & Nhuộm</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">HẠNG THÀNH VIÊN</label>
                <div className="flex flex-wrap gap-2 p-2 bg-stone-50 rounded-2xl">
                  {tiers.map(tier => (
                    <span key={tier} className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-primary flex items-center gap-2 shadow-sm">
                      {tier}
                      <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setTiers(tiers.filter(t => t !== tier))} />
                    </span>
                  ))}
                  <button className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-stone-400 flex items-center gap-2 hover:bg-stone-100 transition-all">
                    <Plus size={12} />
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            {/* Limits & Duration */}
            <div className="space-y-6">
              <h3 className="text-lg font-serif text-primary">Giới hạn & Thời hạn</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG LƯỢT DÙNG</label>
                  <input 
                    type="number" 
                    defaultValue="100"
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LƯỢT/KHÁCH</label>
                  <input 
                    type="number" 
                    defaultValue="1"
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">THỜI HẠN CHƯƠNG TRÌNH</label>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="date" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                  />
                  <input 
                    type="date" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Mã sẽ tự động vô hiệu hóa khi đạt giới hạn lượt dùng hoặc hết thời hạn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 pt-0 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-stone-100 text-primary rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all"
          >
            Hủy
          </button>
          <button className="flex-[2] py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all">
            Tạo mã khuyến mãi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
