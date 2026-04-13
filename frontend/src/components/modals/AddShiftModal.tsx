import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
}

export function AddShiftModal({ isOpen, onClose, employeeName }: AddShiftModalProps) {
  const [shiftType, setShiftType] = useState<'regular' | 'overtime' | 'oncall'>('regular');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="p-12 space-y-10">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif text-primary">Thêm Ca Làm Việc</h2>
              <p className="text-stone-500 text-sm">Ghi nhận khung thời gian trực mới cho {employeeName}.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NGÀY LÀM VIỆC</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                <input 
                  type="text" 
                  defaultValue="11/13/2023"
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIỜ BẮT ĐẦU</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                  <input 
                    type="text" 
                    defaultValue="08:00 AM"
                    className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">KẾT THÚC</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                  <input 
                    type="text" 
                    defaultValue="05:00 PM"
                    className="w-full bg-stone-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-primary focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LOẠI CA LÀM VIỆC</label>
              <div className="flex bg-stone-50 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setShiftType('regular')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    shiftType === 'regular' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  Thường
                </button>
                <button 
                  onClick={() => setShiftType('overtime')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    shiftType === 'overtime' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  Tăng Ca
                </button>
                <button 
                  onClick={() => setShiftType('oncall')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    shiftType === 'oncall' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  Trực
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GHI CHÚ & YÊU CẦU</label>
              <textarea 
                placeholder="Ghi chú về nhân sự hoặc lưu ý riêng..."
                className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm text-primary focus:ring-2 focus:ring-secondary/20 transition-all min-h-[120px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={onClose}
              className="flex-[2] bg-primary text-white py-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 shadow-2xl hover:bg-primary-light transition-all active:scale-95"
            >
              <CheckCircle2 size={20} />
              Lưu Ca Làm Việc
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
