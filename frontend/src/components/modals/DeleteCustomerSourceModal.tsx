import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Share2, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DeleteCustomerSourceModalProps {
  sourceName: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteCustomerSourceModal({ sourceName, onClose, onConfirm }: DeleteCustomerSourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
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
        onClick={() => !isSubmitting && onClose()}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-2xl font-serif text-primary leading-tight">Xóa nguồn khách</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-full bg-stone-50 text-stone-400 hover:text-primary transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-stone-500 leading-relaxed">
            Nguồn này sẽ bị gỡ khỏi danh sách hệ thống. Khách đã lưu trước đó vẫn giữ giá trị nguồn trong hồ sơ. Thao tác không thể hoàn tác.
          </p>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
              <Share2 size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Nguồn khách</p>
              <p className="text-sm font-bold text-primary truncate">{sourceName}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-500 rounded-xl text-sm font-bold hover:bg-stone-50 transition-all disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className={cn(
                'px-6 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2',
                isSubmitting ? 'bg-stone-300 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800 shadow-lg'
              )}
            >
              <Trash2 size={16} />
              {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
