import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  RefreshCw, 
  Save, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Product } from '../../types';
import { prepareImageFromFile } from '../../lib/imageUpload';

interface NewProductModalProps {
  onClose: () => void;
  onSave: (payload: Omit<Product, 'id'>) => void | Promise<void>;
  categories?: string[];
  initialData?: Partial<Product>;
  title?: string;
  saveLabel?: string;
}

function formatNumberInput(value: string) {
  const raw = value.replace(/[^\d]/g, '');
  if (!raw) return '';
  return Number(raw).toLocaleString('vi-VN');
}

function parseNumber(value: string) {
  return Number(value.replace(/[^\d]/g, '') || 0);
}

export function NewProductModal({ onClose, onSave, categories = [], initialData, title, saveLabel }: NewProductModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [category, setCategory] = useState(initialData?.category || categories[0] || '');
  const [sku, setSku] = useState(initialData?.sku || 'PROD-000001');
  const [volume, setVolume] = useState(initialData?.volume || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [stock, setStock] = useState(formatNumberInput(String(initialData?.stock ?? 0)));
  const [maxStock, setMaxStock] = useState(formatNumberInput(String(initialData?.maxStock ?? 20)));
  const [image, setImage] = useState(initialData?.image || '');
  const [costPrice, setCostPrice] = useState(initialData?.costPrice || '450.000');
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice || '620.000');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categories.length) {
      setCategory('');
      return;
    }
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const generateSku = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSku(`PROD-${result}`);
  };

  const calculateProfit = () => {
    const cost = parseNumber(costPrice);
    const sell = parseNumber(sellingPrice);
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    return { profit, margin };
  };

  const { profit, margin } = calculateProfit();

  const handleSave = async () => {
    if (!name.trim() || !brand.trim() || !category.trim()) {
      setError('Vui lòng nhập tên sản phẩm, thương hiệu và chọn danh mục.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const stockValue = parseNumber(stock);
      const maxStockValue = parseNumber(maxStock) || 1;
      const status: Product['status'] =
        stockValue <= 0 ? 'out-of-stock' : stockValue <= 5 ? 'low-stock' : 'in-stock';

      await onSave({
        name: name.trim(),
        brand: brand.trim(),
        category: category.trim(),
        sku: sku.trim(),
        volume: volume.trim(),
        description: description.trim() || '—',
        sellingPrice: formatNumberInput(sellingPrice) || '0',
        costPrice: formatNumberInput(costPrice) || '0',
        stock: stockValue,
        maxStock: maxStockValue,
        image: image.trim(),
        status,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể lưu sản phẩm.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-10 border-b border-stone-100 flex justify-between items-start bg-stone-50/30">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif text-primary">{title || 'Thêm Sản Phẩm Mới'}</h2>
            <p className="text-stone-500 text-sm">Cập nhật danh mục hàng hóa vào hệ thống Bella Hair Salon</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Left Column: Form */}
          <div className="flex-[1.2] p-10 space-y-8 border-r border-stone-100">
            <div className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN SẢN PHẨM</label>
                <input 
                  type="text" 
                  placeholder="Vd: Tinh dầu dưỡng tóc Oribe Gold Lust"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Brand */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">THƯƠNG HIỆU</label>
                  <input 
                    type="text" 
                    placeholder="Oribe, Kerastase..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                  />
                </div>
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DANH MỤC</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {categories.length ? (
                        categories.map((item) => <option key={item}>{item}</option>)
                      ) : (
                        <option value="">Chưa có danh mục</option>
                      )}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* SKU */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÃ SKU</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="flex-1 bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                    />
                    <button 
                      onClick={generateSku}
                      className="p-4 bg-stone-100 text-stone-500 rounded-2xl hover:bg-stone-200 transition-all"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
                {/* Volume */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DUNG TÍCH</label>
                  <input 
                    type="text" 
                    placeholder="Vd: 100ml, 500g"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MÔ TẢ NGẮN</label>
                <textarea 
                  rows={4}
                  placeholder="Nhập tóm tắt công dụng và thành phần chính..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỒN KHO</label>
                  <input
                    type="text"
                    value={stock}
                    onChange={(e) => setStock(formatNumberInput(e.target.value))}
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MỨC TỒN TỐI ĐA</label>
                  <input
                    type="text"
                    value={maxStock}
                    onChange={(e) => setMaxStock(formatNumberInput(e.target.value))}
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-stone-50/80 p-8 rounded-[2rem] space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIÁ NHẬP (đ)</label>
                    <input 
                      type="text" 
                      value={costPrice}
                      onChange={(e) => setCostPrice(formatNumberInput(e.target.value))}
                      className="w-full bg-white border-none rounded-2xl px-6 py-4 text-lg font-bold text-primary focus:ring-2 ring-primary/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">GIÁ BÁN (đ)</label>
                    <input 
                      type="text" 
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(formatNumberInput(e.target.value))}
                      className="w-full bg-white border-none rounded-2xl px-6 py-4 text-lg font-bold text-primary focus:ring-2 ring-primary/10 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                  <RefreshCw size={14} className="animate-spin-slow" />
                  Lợi nhuận: +{profit.toLocaleString()}đ ({margin.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Images */}
          <div className="flex-1 p-10 space-y-10 bg-stone-50/10">
            {/* Main Image */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">HÌNH ẢNH CHÍNH</label>
              <label className="h-72 border-2 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center justify-center gap-5 bg-white group hover:border-primary/30 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                  <Upload size={28} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-primary">Kéo thả ảnh tại đây</p>
                  <p className="text-xs text-stone-400">Hoặc nhấp để chọn từ máy tính</p>
                </div>
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
                      setError(null);
                    } catch (err) {
                      const message = err instanceof Error ? err.message : 'Khong the tai anh.';
                      setError(message);
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </label>
              {image && (
                <img
                  src={image}
                  alt="preview"
                  className="w-full h-72 object-cover rounded-[2rem] border border-stone-100"
                />
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-stone-100 flex justify-end gap-4 bg-stone-50/30">
          {error && (
            <div className="mr-auto self-center text-xs font-bold text-red-600">
              {error}
            </div>
          )}
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-10 py-4 bg-white border border-stone-200 text-stone-500 rounded-2xl text-sm font-bold hover:bg-stone-50 transition-all"
          >
            HỦY BỎ
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-10 py-4 rounded-2xl text-sm font-bold shadow-xl transition-all flex items-center gap-3',
              isSaving ? 'bg-stone-200 text-stone-500 shadow-none cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light'
            )}
          >
            <Save size={18} />
            {isSaving ? 'ĐANG LƯU...' : saveLabel || 'LƯU SẢN PHẨM'}
          </button>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 50, y: -50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-8 right-8 bg-white shadow-2xl rounded-2xl p-6 flex items-center gap-4 border border-green-100 z-[110]"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Thành công</p>
                <p className="text-xs text-stone-500">
                  {saveLabel ? 'Đã cập nhật sản phẩm thành công' : 'Đã thêm sản phẩm thành công'}
                </p>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="ml-4 text-stone-300 hover:text-stone-500"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
