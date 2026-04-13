import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Filter, Clock, Tag, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Service } from '../../types';

interface ServicesViewProps {
  services: Service[];
  serviceCategories?: string[];
  onNewService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (service: Service) => void;
  onViewService: (service: Service) => void;
  key?: string;
}

function getInitials(name: string) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'S';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase();
}

export function ServicesView({
  services,
  serviceCategories = [],
  onNewService,
  onEditService,
  onDeleteService,
  onViewService,
}: ServicesViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả danh mục');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  const categories = [
    'Tất cả danh mục',
    ...Array.from(new Set([...serviceCategories, ...services.map((s) => s.category)])).sort((a, b) => a.localeCompare(b, 'vi')),
  ];
  
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory = activeCategory === 'Tất cả danh mục' || service.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCategory;
      const matchesSearch =
        service.name.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        service.duration.toLowerCase().includes(q) ||
        String(service.tags || [])
          .toLowerCase()
          .includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [services, activeCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedServices = filteredServices.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageStart = Math.max(1, safePage - 1);
  const pageEnd = Math.min(totalPages, pageStart + 2);
  const visiblePages = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  const handleCategoryChange = (next: string) => {
    setActiveCategory(next);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <h2 className="text-4xl font-serif text-primary leading-tight">Dịch vụ & Bảng giá</h2>
          <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
            Quản lý danh mục dịch vụ theo dạng danh sách giống trang sản phẩm
          </p>
        </div>
        <button
          onClick={onNewService}
          className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-stone-50/50 p-6 rounded-[2.5rem] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên, danh mục, thời lượng..."
              className="bg-white border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-primary outline-none focus:ring-2 ring-primary/5 shadow-sm min-w-[300px]"
            />
          </div>
          <div className="relative">
            <select
              value={activeCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-white border-none rounded-2xl px-8 py-3.5 pr-12 text-sm font-medium text-primary appearance-none cursor-pointer focus:ring-2 ring-primary/5 outline-none shadow-sm min-w-[240px]"
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
          <button className="bg-white px-6 py-3.5 rounded-2xl text-sm font-medium text-primary flex items-center gap-3 shadow-sm hover:bg-stone-50 transition-all">
            <Filter size={18} className="text-stone-400" />
            Bộ lọc
            <div className="w-5 h-5 bg-stone-100 rounded-lg flex items-center justify-center text-[10px] font-bold">1</div>
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-primary'
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-primary'
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
          <div className="max-h-[680px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dịch vụ</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Danh mục</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Thời lượng</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Giá</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.map((service) => (
                  <tr key={service.id} className="border-b border-stone-50 hover:bg-stone-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {service.image && !failedImages[String(service.id)] ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            onError={() => setFailedImages((prev) => ({ ...prev, [String(service.id)]: true }))}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-100 flex items-center justify-center">
                            <span className="text-sm font-serif text-primary">{getInitials(service.name)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{service.name}</p>
                          <p className="text-[10px] text-stone-400 truncate">{service.description || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-stone-100 text-stone-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">{service.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-500 text-xs font-bold">
                        <Clock size={14} />
                        {service.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-primary text-sm font-bold">
                        <Tag size={14} />
                        {service.price}đ
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditService(service)}
                          className="p-2 rounded-lg border border-stone-100 text-stone-500 hover:text-primary hover:bg-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onViewService(service)}
                          className="px-3 py-2 rounded-lg bg-stone-100 text-[11px] font-bold text-primary hover:bg-stone-200"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => onDeleteService(service)}
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
      ) : (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {paginatedServices.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {service.image && !failedImages[String(service.id)] ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    onError={() => setFailedImages((prev) => ({ ...prev, [String(service.id)]: true }))}
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-100 flex items-center justify-center">
                    <span className="text-lg font-serif text-primary">{getInitials(service.name)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{service.category}</p>
                  <h4 className="text-lg font-serif text-primary truncate">{service.name}</h4>
                  <p className="text-xs text-stone-400 line-clamp-2">{service.description || '—'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs text-stone-500 font-bold flex items-center gap-2">
                  <Clock size={14} />
                  {service.duration}
                </div>
                <div className="text-sm text-primary font-bold">{service.price}đ</div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button onClick={() => onEditService(service)} className="py-2 rounded-xl border border-stone-100 text-xs font-bold text-stone-600 hover:bg-stone-50">
                  Sửa
                </button>
                <button onClick={() => onViewService(service)} className="py-2 rounded-xl bg-stone-100 text-xs font-bold text-primary hover:bg-stone-200">
                  Chi tiết
                </button>
                <button onClick={() => onDeleteService(service)} className="py-2 rounded-xl border border-red-100 text-xs font-bold text-red-500 hover:bg-red-50">
                  Xóa
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!filteredServices.length && (
        <div className="bg-white border border-stone-100 rounded-[2rem] p-10 text-center">
          <p className="text-primary font-bold">Không tìm thấy dịch vụ phù hợp.</p>
          <p className="text-stone-400 text-sm mt-2">Thử đổi từ khóa hoặc danh mục để xem thêm kết quả.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center pt-8 border-t border-stone-100">
        <p className="text-xs font-medium text-stone-400">
          Hiển thị {paginatedServices.length} trong trang {safePage} / {totalPages} - tổng {filteredServices.length} dịch vụ
        </p>
        <div className="flex items-center gap-3">
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all',
                p === safePage
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'
              )}
            >
              {p}
            </button>
          ))}
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
