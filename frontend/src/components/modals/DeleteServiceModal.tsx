import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle, Trash2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Service } from '../../types';

interface DeleteServiceModalProps {
  service: Service;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteServiceModal({ service, onClose, onConfirm }: DeleteServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif text-primary">Xóa dịch vụ?</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Bạn có chắc chắn muốn xóa dịch vụ <span className="font-bold text-primary">"{service.name}"</span>? Thao tác này không thể hoàn tác.
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100">
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Xóa dịch vụ sẽ không ảnh hưởng đến các lịch hẹn đã hoàn thành, nhưng có thể gây lỗi cho các lịch hẹn đang chờ xử lý.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              disabled={isSubmitting}
              onClick={handleConfirm}
              className={cn(
                "w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
                isSubmitting
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed shadow-none"
                  : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              <Trash2 size={18} />
              {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
            </button>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-4 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
