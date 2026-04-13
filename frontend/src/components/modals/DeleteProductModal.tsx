import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Package, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Product } from '../../types';

interface DeleteProductModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteProductModal({ product, onClose, onConfirm }: DeleteProductModalProps) {
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
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-3xl font-serif text-primary">Xác nhận xóa sản phẩm</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone-50 text-stone-400 hover:text-primary transition-colors flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-stone-500 leading-relaxed">
            Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn xóa sản phẩm khỏi hệ thống không?
          </p>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover bg-stone-100"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">{product.name}</p>
              <p className="text-xs text-stone-400">SKU: {product.sku || 'N/A'}</p>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <Package size={12} /> Tồn kho hiện tại: {product.stock} chai
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-500 rounded-xl text-sm font-bold hover:bg-stone-50 transition-all disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
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
