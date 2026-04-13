import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProductCategoryConfig, ServiceCategoryConfig } from '../../types';

interface DeleteServiceCategoryModalProps {
  category: ServiceCategoryConfig | ProductCategoryConfig;
  serviceCount: number;
  allCategories: Array<ServiceCategoryConfig | ProductCategoryConfig>;
  onClose: () => void;
  onConfirm: (replacementCategoryName?: string) => void | Promise<void>;
  title?: string;
  unitLabel?: string;
}

export function DeleteServiceCategoryModal({
  category,
  serviceCount,
  allCategories,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa danh mục',
  unitLabel = 'dịch vụ',
}: DeleteServiceCategoryModalProps) {
  const replacementOptions = useMemo(
    () => allCategories.filter((item) => String(item.id) !== String(category.id)),
    [allCategories, category.id]
  );
  const [replacementCategoryName, setReplacementCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canConfirm = serviceCount === 0 || Boolean(replacementCategoryName);

  const handleConfirm = async () => {
    if (!canConfirm || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onConfirm(replacementCategoryName || undefined);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa danh mục.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
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
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DỌN DẸP HỆ THỐNG</p>
              <h2 className="text-4xl font-serif text-primary mt-1">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-primary transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 flex gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm">
              Danh mục "{category.name}" hiện đang có {serviceCount} {unitLabel} hoạt động. Thao tác này không thể hoàn tác.
            </p>
          </div>

          {serviceCount > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-primary">Chuyển {serviceCount} {unitLabel} này sang danh mục:</label>
              <div className="relative">
                <select
                  value={replacementCategoryName}
                  onChange={(e) => setReplacementCategoryName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 pr-9 text-sm text-primary appearance-none"
                >
                  <option value="">-- Chọn danh mục thay thế --</option>
                  {replacementOptions.map((item) => (
                    <option key={String(item.id)} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          )}

          {errorMessage && <p className="text-xs font-bold text-red-500">{errorMessage}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onClose} disabled={isSubmitting} className="py-3 rounded-xl bg-stone-100 text-stone-500 font-bold">
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isSubmitting}
              className={cn(
                'py-3 rounded-xl text-white font-bold transition-all',
                !canConfirm || isSubmitting ? 'bg-stone-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-lg'
              )}
            >
              {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
