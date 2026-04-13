import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Scissors, Palette, Sparkles, Coffee, Smile, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProductCategoryConfig, ServiceCategoryConfig } from '../../types';

interface EditServiceCategoryModalProps {
  category: ServiceCategoryConfig | ProductCategoryConfig;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    selectedIcon: string;
    selectedColor: string;
    description: string;
    isVisible: boolean;
  }) => void | Promise<void>;
  title?: string;
  saveLabel?: string;
}

const icons = [
  { id: 'scissors', component: <Scissors size={20} /> },
  { id: 'palette', component: <Palette size={20} /> },
  { id: 'sparkles', component: <Sparkles size={20} /> },
  { id: 'coffee', component: <Coffee size={20} /> },
  { id: 'smile', component: <Smile size={20} /> },
];

const colors = ['#4a0e0e', '#c5a059', '#1a1a1a', '#6b21a8', '#374151', '#991b1b', '#d97706'];

export function EditServiceCategoryModal({
  category,
  onClose,
  onSave,
  title = 'Sửa danh mục dịch vụ',
  saveLabel = 'CẬP NHẬT',
}: EditServiceCategoryModalProps) {
  const [name, setName] = useState(category.name || '');
  const [selectedIcon, setSelectedIcon] = useState(category.icon || 'scissors');
  const [selectedColor, setSelectedColor] = useState(category.color || colors[0]);
  const [description, setDescription] = useState(category.description || '');
  const [isVisible, setIsVisible] = useState(category.isVisible !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên danh mục.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      await onSave({ name: name.trim(), selectedIcon, selectedColor, description, isVisible });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật danh mục.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
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
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-serif text-primary">{title}</h2>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-primary transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN DANH MỤC</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 text-sm text-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÔ TẢ NGẮN</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 text-sm text-primary resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">BIỂU TƯỢNG NHẬN DIỆN</label>
            <div className="flex gap-3">
              {icons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                    selectedIcon === icon.id ? 'bg-primary text-white shadow-md' : 'bg-stone-100 text-stone-500'
                  )}
                >
                  {icon.component}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÀU SẮC CHỦ ĐẠO</label>
            <div className="flex gap-3 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn('w-9 h-9 rounded-full border transition-all', selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : 'border-white')}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color ? <Check size={14} className="text-white mx-auto" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-stone-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-serif text-primary">Trạng thái hiển thị</p>
              <p className="text-xs text-stone-400">Cho phép khách hàng đặt dịch vụ này trực tuyến.</p>
            </div>
            <button
              onClick={() => setIsVisible((v) => !v)}
              className={cn('w-12 h-6 rounded-full p-1 transition-all', isVisible ? 'bg-primary' : 'bg-stone-300')}
            >
              <div className={cn('w-4 h-4 bg-white rounded-full transition-all', isVisible ? 'translate-x-6' : 'translate-x-0')} />
            </button>
          </div>

          {errorMessage && <p className="text-xs font-bold text-red-500">{errorMessage}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={handleSave} disabled={isSaving} className="py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60">
              {isSaving ? 'Đang cập nhật...' : saveLabel}
            </button>
            <button onClick={onClose} disabled={isSaving} className="py-3 rounded-xl border border-stone-200 text-stone-500 font-bold">
              HỦY
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
