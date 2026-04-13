import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Scissors, 
  Palette, 
  Sparkles, 
  Coffee, 
  Smile, 
  Droplets, 
  Wind, 
  Zap, 
  Heart, 
  Star, 
  Sun,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NewCategoryModalProps {
  onClose: () => void;
  onSave: (data: any) => void | Promise<void>;
}

const icons = [
  { id: 'scissors', component: <Scissors size={20} /> },
  { id: 'palette', component: <Palette size={20} /> },
  { id: 'sparkles', component: <Sparkles size={20} /> },
  { id: 'coffee', component: <Coffee size={20} /> },
  { id: 'smile', component: <Smile size={20} /> },
  { id: 'droplets', component: <Droplets size={20} /> },
  { id: 'wind', component: <Wind size={20} /> },
  { id: 'zap', component: <Zap size={20} /> },
  { id: 'heart', component: <Heart size={20} /> },
  { id: 'star', component: <Star size={20} /> },
  { id: 'sun', component: <Sun size={20} /> },
];

const colors = [
  '#4a0e0e', // Burgundy
  '#c5a059', // Gold
  '#1a1a1a', // Black
  '#6b21a8', // Purple
  '#374151', // Slate
  '#991b1b', // Red
  '#d97706', // Amber
  '#b45309', // Brown
];

export function NewCategoryModal({ onClose, onSave }: NewCategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('scissors');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên danh mục.');
      return;
    }
    setIsSaving(true);
    Promise.resolve(onSave({ name, selectedIcon, selectedColor, description, isVisible }))
      .then(() => onClose())
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Không thể lưu danh mục.';
        setErrorMessage(message);
      })
      .finally(() => setIsSaving(false));
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
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="p-12 space-y-10">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif text-primary">Thêm Danh Mục Dịch Vụ Mới</h2>
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-primary transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            {/* Category Name */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                TÊN DANH MỤC
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cắt tóc chuyên sâu, Nhuộm Balayage..."
                className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                CHỌN ICON
              </label>
              <div className="grid grid-cols-6 gap-3">
                {icons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={cn(
                      "h-16 rounded-2xl flex items-center justify-center transition-all",
                      selectedIcon === icon.id 
                        ? "bg-primary text-white shadow-xl scale-105" 
                        : "bg-stone-50 text-stone-400 hover:bg-stone-100"
                    )}
                  >
                    {icon.component}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                MÀU NHẬN DIỆN
              </label>
              <div className="flex flex-wrap gap-4">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all relative flex items-center justify-center",
                      selectedColor === color ? "ring-2 ring-primary ring-offset-4" : ""
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                MÔ TẢ NGẮN
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập một vài chi tiết về nhóm dịch vụ này để nhân viên dễ dàng tư vấn..."
                rows={4}
                className="w-full bg-stone-50 border-none rounded-3xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-6 bg-stone-50 rounded-2xl">
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">Trạng thái hiển thị</p>
                <p className="text-[10px] text-stone-400">Cho phép khách hàng nhìn thấy danh mục này trên Menu</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsVisible(!isVisible)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1",
                    isVisible ? "bg-primary" : "bg-stone-300"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-all",
                    isVisible ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                  {isVisible ? 'Hiện' : 'Ẩn'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <button 
              onClick={onClose}
              className="w-full py-5 border border-stone-200 text-stone-400 rounded-2xl text-sm font-bold hover:bg-stone-50 transition-all uppercase tracking-widest"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-primary text-white rounded-2xl text-sm font-bold shadow-2xl hover:bg-primary-light transition-all uppercase tracking-widest active:scale-95 disabled:opacity-60"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
          </div>
          {errorMessage && <p className="text-xs font-bold text-red-500">{errorMessage}</p>}
        </div>
      </motion.div>
    </div>
  );
}
