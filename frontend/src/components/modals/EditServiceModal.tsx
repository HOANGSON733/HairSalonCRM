import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Upload, Clock, ChevronDown, Check, Edit3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Service } from '../../types';
import { prepareImageFromFile } from '../../lib/imageUpload';

interface EditServiceModalProps {
  service: Service;
  onClose: () => void;
  onConfirm: (updatedService: Service) => void;
  categories?: string[];
}

export function EditServiceModal({ service, onClose, onConfirm, categories = [] }: EditServiceModalProps) {
  const [isActive, setIsActive] = useState(true);
  const [addons, setAddons] = useState<string[]>(() => {
    const tags = Array.isArray(service.tags) ? service.tags : [];
    const restored = tags
      .map((t) => String(t || '').replace(/^#/, ''))
      .filter(Boolean);
    return restored.length ? restored : ['Sấy kiểu'];
  });
  const availableAddons = ['Massage cổ vai gáy', 'Hấp tinh dầu'];
  const [isAddingAddon, setIsAddingAddon] = useState(false);
  const [newAddonName, setNewAddonName] = useState('');

  // Form states
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category);
  const [description, setDescription] = useState(service.description);
  const [duration, setDuration] = useState(service.duration.replace(' phút', ''));
  const [price, setPrice] = useState(service.price);
  const [maxPrice, setMaxPrice] = useState(service.maxPrice || '');
  const [image, setImage] = useState(service.image || '');
  const [errorMessage, setErrorMessage] = useState('');
  const categoryOptions = categories.includes(category) ? categories : [category, ...categories];

  const toggleAddon = (addon: string) => {
    if (addons.includes(addon)) {
      setAddons(addons.filter(a => a !== addon));
    } else {
      setAddons([...addons, addon]);
    }
  };

  const addNewAddon = () => {
    const cleaned = newAddonName.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;
    if (addons.some((a) => a.toLowerCase() === cleaned.toLowerCase())) {
      setIsAddingAddon(false);
      setNewAddonName('');
      return;
    }
    setAddons((prev) => [...prev, cleaned]);
    setIsAddingAddon(false);
    setNewAddonName('');
  };

  const handleSave = () => {
    onConfirm({
      ...service,
      name,
      category,
      description,
      duration: `${duration} phút`,
      price,
      maxPrice,
      image,
      popularity: isActive ? 80 : 0,
      tags: addons.map((a) => `#${a.replace(/\s+/g, '').toLowerCase()}`),
    });
  };

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
        className="relative w-full max-w-5xl bg-[#f8f5f0] rounded-[2.5rem] shadow-2xl overflow-hidden flex min-h-[650px]"
      >
        {/* Left Side - Info & Image */}
        <div className="w-[40%] p-12 flex flex-col space-y-8">
          <div className="space-y-6">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
              <Edit3 size={24} />
            </div>
            <h2 className="text-4xl font-serif text-primary leading-tight">Chỉnh sửa dịch vụ</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Cập nhật thông tin chi tiết cho dịch vụ <span className="font-bold text-primary">"{service.name}"</span> để duy trì tiêu chuẩn chất lượng.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TRẠNG THÁI HIỆN TẠI</span>
              <button 
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative p-1",
                  isActive ? "bg-secondary" : "bg-stone-200"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-all",
                  isActive ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
            <p className="text-sm font-bold text-primary">{isActive ? 'Đang hoạt động' : 'Tạm ngưng'}</p>
          </div>

          <div className="flex-1 relative group">
            <label className="absolute inset-0 bg-black/20 rounded-[2rem] flex flex-col items-center justify-center space-y-4 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] cursor-pointer">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">THAY ĐỔI ẢNH</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const nextImage = await prepareImageFromFile(file);
                    setImage(nextImage);
                    setErrorMessage('');
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Khong the tai anh.';
                    setErrorMessage(message);
                  } finally {
                    e.currentTarget.value = '';
                  }
                }}
              />
            </label>
            {image ? (
              <img 
                src={image} 
                alt={service.name} 
                className="w-full h-full object-cover rounded-[2rem]"
              />
            ) : (
              <div className="w-full h-full rounded-[2rem] bg-stone-100 flex items-center justify-center">
                <p className="text-5xl font-serif text-primary">{name.trim() ? name.trim().slice(0, 1).toUpperCase() : 'S'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 bg-white p-12 space-y-8 overflow-y-auto">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN DỊCH VỤ</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Gội đầu thảo mộc chuyên sâu"
                className="w-full border-b border-stone-100 py-3 text-sm font-bold text-primary focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DANH MỤC</label>
              <div className="relative">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-b border-stone-100 py-3 text-sm font-bold text-primary focus:border-primary transition-all outline-none appearance-none cursor-pointer pr-8"
                >
                  {categoryOptions.length ? (
                    categoryOptions.map((item) => <option key={item}>{item}</option>)
                  ) : (
                    <option value={category || ''}>{category || 'Chưa có danh mục'}</option>
                  )}
                </select>
                <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÔ TẢ NGẮN</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nêu bật sự khác biệt và giá trị của dịch vụ..."
              rows={2}
              className="w-full border-b border-stone-100 py-3 text-sm font-medium text-stone-600 focus:border-primary transition-all outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">THỜI LƯỢNG (PHÚT)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border-b border-stone-100 py-3 text-sm font-bold text-primary focus:border-primary transition-all outline-none"
                />
                <Clock size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIÁ CƠ BẢN (đ)</label>
              <input 
                type="text" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border-b border-stone-100 py-3 text-sm font-bold text-primary focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIÁ TỐI ĐA</label>
              <input 
                type="text" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border-b border-stone-100 py-3 text-sm font-bold text-primary focus:border-primary transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DỊCH VỤ ĐI KÈM TÙY CHỌN</label>
            <div className="flex flex-wrap gap-3">
              {availableAddons.map((addon) => (
                <button 
                  key={addon}
                  onClick={() => toggleAddon(addon)}
                  className={cn(
                    "px-5 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 border transition-all",
                    addons.includes(addon) 
                      ? "bg-secondary/10 border-secondary text-secondary" 
                      : "bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100"
                  )}
                >
                  {addon} <Plus size={14} />
                </button>
              ))}
              {addons.map((addon) => !availableAddons.includes(addon) && (
                <button 
                  key={addon}
                  onClick={() => toggleAddon(addon)}
                  className="px-5 py-2 bg-secondary text-white rounded-full text-[11px] font-bold flex items-center gap-2 shadow-md"
                >
                  {addon} <Check size={14} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsAddingAddon((v) => !v)}
                className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
              >
                + THÊM MỚI
              </button>
            </div>

            {isAddingAddon && (
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addNewAddon();
                    } else if (e.key === 'Escape') {
                      setIsAddingAddon(false);
                      setNewAddonName('');
                    }
                  }}
                  placeholder="VD: Sấy kiểu"
                  className="flex-1 bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addNewAddon}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-xl hover:bg-primary-light transition-all active:scale-95"
                >
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddon(false);
                    setNewAddonName('');
                  }}
                  className="px-6 py-3 bg-stone-50 text-stone-400 rounded-xl text-xs font-bold hover:bg-stone-100 transition-all"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-8">
            <button 
              onClick={handleSave}
              className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-bold shadow-2xl hover:bg-primary-light transition-all active:scale-95"
            >
              LƯU THAY ĐỔI
            </button>
            <button 
              onClick={onClose}
              className="px-10 py-5 bg-stone-50 text-stone-400 rounded-2xl text-sm font-bold hover:bg-stone-100 transition-all"
            >
              HỦY BỎ
            </button>
          </div>
          {errorMessage && <p className="text-xs font-bold text-red-500">{errorMessage}</p>}
        </div>
      </motion.div>
    </div>
  );
}
