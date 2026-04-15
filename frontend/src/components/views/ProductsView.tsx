import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Filter, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Search,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Product } from '../../types';

interface ProductsViewProps {
  key?: string;
  products: Product[];
  onNewProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onRestockProduct?: (product: Product) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (nextPage: number) => void;
}

export function ProductsView({
  products,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onRestockProduct,
  page = 1,
  totalPages = 1,
  total = products.length,
  onPageChange,
}: ProductsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả danh mục');

  const categories = ['Tất cả danh mục', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const pageStart = Math.max(1, page - 1);
  const pageEnd = Math.min(totalPages, pageStart + 2);
  const visiblePages = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);
  const visibleProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Tất cả danh mục' || product.category === selectedCategory;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return matchesCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.brand.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch) ||
      String(product.sku || '').toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  const getProductImageSrc = (image?: string | null) => image && image.trim() ? image : null;

  const getStatusBadge = (product: Product) => {
    switch (product.status) {
      case 'in-stock':
        return (
          <div className="bg-amber-100/80 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Còn {product.stock} sản phẩm
          </div>
        );
      case 'low-stock':
        return (
          <div className="bg-red-100/80 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Sắp hết ({product.stock} sp)
          </div>
        );
      case 'out-of-stock':
        return (
          <div className="bg-stone-200/80 text-stone-500 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
            Hết hàng (0 sp)
          </div>
        );
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-primary leading-tight">
            Sản phẩm bán lẻ
          </h1>
          <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
            Quản lý sản phẩm bán kèm tại salon cao cấp
          </p>
        </div>
        <button 
          onClick={onNewProduct}
          className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="bg-stone-50/50 p-6 rounded-[2.5rem] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, thương hiệu, SKU..."
              className="bg-white border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-primary outline-none focus:ring-2 ring-primary/5 shadow-sm min-w-[280px]"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border-none rounded-2xl px-8 py-3.5 pr-12 text-sm font-medium text-primary appearance-none cursor-pointer focus:ring-2 ring-primary/5 outline-none shadow-sm min-w-[220px]"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          <button className="bg-white px-6 py-3.5 rounded-2xl text-sm font-medium text-primary flex items-center gap-3 shadow-sm hover:bg-stone-50 transition-all">
            <Filter size={18} className="text-stone-400" />
            Trạng thái
            <div className="w-5 h-5 bg-stone-100 rounded-lg flex items-center justify-center text-[10px] font-bold">
              3
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              viewMode === 'grid' ? "bg-primary text-white shadow-md" : "text-stone-400 hover:text-primary"
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              viewMode === 'list' ? "bg-primary text-white shadow-md" : "text-stone-400 hover:text-primary"
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Product Content */}
      {viewMode === 'grid' ? (
        <div className="grid gap-8 grid-cols-4">
          {visibleProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 group hover:shadow-xl transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                {getProductImageSrc(product.image) ? (
                  <img
                    src={getProductImageSrc(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 text-sm font-medium">
                    Chưa có ảnh
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                  {product.category}
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-white transition-all">
                  <MoreVertical size={18} />
                </button>
                <div className="absolute bottom-4 left-4">{getStatusBadge(product)}</div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{product.brand}</p>
                  <h3 className="text-xl font-bold text-primary truncate leading-tight">{product.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">GIÁ BÁN</p>
                    <p className="text-lg font-bold text-primary">{product.sellingPrice}đ</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">GIÁ NHẬP</p>
                    <p className="text-sm font-bold text-stone-400">{product.costPrice}đ</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-stone-400">TỒN KHO</span>
                    <span className="text-primary">{Math.round((product.stock / product.maxStock) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.stock / product.maxStock) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        product.status === 'in-stock' ? 'bg-amber-800' : product.status === 'low-stock' ? 'bg-red-500' : 'bg-stone-300'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onEditProduct?.(product)}
                    className="py-3.5 bg-white border border-stone-100 text-primary rounded-2xl text-xs font-bold hover:bg-stone-50 transition-all"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onRestockProduct?.(product)}
                    className="py-3.5 bg-stone-100 text-primary rounded-2xl text-xs font-bold hover:bg-stone-200 transition-all"
                  >
                    Nhập kho
                  </button>
                </div>
                <button
                  onClick={() => onDeleteProduct?.(product)}
                  className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all"
                >
                  Xóa sản phẩm
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
          <div className="max-h-[680px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Danh mục</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Giá</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tồn kho</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="border-b border-stone-50 hover:bg-stone-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getProductImageSrc(product.image) ? (
                          <img
                            src={getProductImageSrc(product.image)}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-100"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border border-stone-100 bg-stone-100 flex items-center justify-center text-[10px] text-stone-300 font-medium">
                            No img
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-primary">{product.name}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-stone-100 text-stone-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">{product.sellingPrice}đ</p>
                      <p className="text-[10px] text-stone-400">Nhập: {product.costPrice}đ</p>
                    </td>
                    <td className="px-6 py-4 min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-stone-400">{product.stock} sp</span>
                          <span className="text-primary">{Math.round((product.stock / product.maxStock) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              product.status === 'in-stock' ? 'bg-amber-800' : product.status === 'low-stock' ? 'bg-red-500' : 'bg-stone-300'
                            )}
                            style={{ width: `${(product.stock / product.maxStock) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(product)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditProduct?.(product)}
                          className="p-2 rounded-lg border border-stone-100 text-stone-500 hover:text-primary hover:bg-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onRestockProduct?.(product)}
                          className="px-3 py-2 rounded-lg bg-stone-100 text-[11px] font-bold text-primary hover:bg-stone-200"
                        >
                          Nhập
                        </button>
                        <button
                          onClick={() => onDeleteProduct?.(product)}
                          className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!visibleProducts.length && (
        <div className="bg-white border border-stone-100 rounded-[2rem] p-10 text-center">
          <p className="text-primary font-bold">Không tìm thấy sản phẩm phù hợp.</p>
          <p className="text-stone-400 text-sm mt-2">Thử đổi từ khóa hoặc danh mục để xem thêm kết quả.</p>
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-between items-center pt-8 border-t border-stone-100">
        <p className="text-xs font-medium text-stone-400">
          Hiển thị {visibleProducts.length} trong trang {page} / {totalPages} - tổng {total} sản phẩm
        </p>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange?.(p)}
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all',
                p === page
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'
              )}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
