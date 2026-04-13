import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  X,
  Star,
  Clock,
  CheckCircle2,
  PlayCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { KPICard } from '../KPICard';
import { cn } from '../../lib/utils';
import { CustomerSourceIcon, normalizeCustomerSourceIcon } from '../../lib/customerSourceIcons';
import { Customer } from '../../types';

interface CustomersViewProps {
  authToken: string | null;
  onNewCustomer: () => void;
  onDeleteCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onNewAppointmentForCustomer: (customer: Customer) => void;
  onViewTechnicalNotes: (customer: Customer) => void;
  key?: string;
}

const PAGE_SIZE = 15;

export function CustomersView({ authToken, onNewCustomer, onDeleteCustomer, onEditCustomer, onNewAppointmentForCustomer, onViewTechnicalNotes }: CustomersViewProps) {
  const [list, setList] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sourceIconByName, setSourceIconByName] = useState<Record<string, string>>({});
  const searchCommittedRef = useRef(false);

  /**
   * Debounce từ khóa; chỉ reset về trang 1 khi từ khóa thực sự đổi (không reset lúc mount
   * để tránh ghi đè trang người dùng đã chọn).
   */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchInput.trim();
      if (!searchCommittedRef.current) {
        searchCommittedRef.current = true;
        setDebouncedSearch(next);
        return;
      }
      setDebouncedSearch((prev) => {
        if (prev === next) return prev;
        setPage(1);
        return next;
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!authToken) {
      setList([]);
      setTotal(0);
      setTotalPages(1);
      setLoadError('Cần đăng nhập để xem danh sách khách hàng.');
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setLoadError(null);
    const q = debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : '';
    const url = `/api/customers?page=${page}&pageSize=${PAGE_SIZE}${q}`;
    fetch(url, {
      signal: ac.signal,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || 'Không thể tải danh sách khách hàng.');
        }
        return data;
      })
      .then((data) => {
        if (ac.signal.aborted) return;
        const rows = Array.isArray(data?.customers) ? data.customers : [];
        setList(rows);
        setTotal(Number(data?.pagination?.total ?? rows.length));
        setTotalPages(Math.max(1, Number(data?.pagination?.totalPages ?? 1)));
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        const err = e instanceof Error ? e : new Error(String(e));
        if (err.name === 'AbortError') return;
        setLoadError(err.message || 'Không thể tải danh sách khách hàng.');
        setList([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [authToken, page, debouncedSearch, listRefreshKey]);

  useEffect(() => {
    const handler = () => setListRefreshKey((k) => k + 1);
    window.addEventListener('customers:changed', handler);
    return () => window.removeEventListener('customers:changed', handler);
  }, []);

  useEffect(() => {
    if (!authToken) {
      setSourceIconByName({});
      return;
    }
    const loadSources = () => {
      fetch('/api/customer-sources', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      })
        .then(async (r) => {
          const data = await r.json().catch(() => null);
          if (!r.ok) return;
          const map: Record<string, string> = {};
          for (const s of Array.isArray(data?.sources) ? data.sources : []) {
            const name = String((s as { name?: string }).name || '').trim();
            if (!name) continue;
            map[name] = normalizeCustomerSourceIcon((s as { icon?: string }).icon);
          }
          setSourceIconByName(map);
        })
        .catch(() => {});
    };
    loadSources();
    window.addEventListener('customer-sources:changed', loadSources);
    return () => window.removeEventListener('customer-sources:changed', loadSources);
  }, [authToken]);

  useEffect(() => {
    setSelectedCustomer((prev) => {
      if (!prev) return null;
      const matched = list.find((item) => String(item.id) === String(prev.id));
      return matched || null;
    });
  }, [list]);

  const pageStart = Math.max(1, page - 1);
  const pageEnd = Math.min(totalPages, pageStart + 2);
  const visiblePages = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  const spendingChartData = useMemo(() => {
    if (!selectedCustomer) return [];
    const existing = Array.isArray(selectedCustomer.spendingData) ? selectedCustomer.spendingData : [];
    if (existing.length) return existing;

    const now = new Date();
    const buckets: { key: string; month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: `T${d.getMonth() + 1}`,
        value: 0,
      });
    }
    const bucketIndex = new Map(buckets.map((b, idx) => [b.key, idx]));

    const history = Array.isArray(selectedCustomer.history) ? selectedCustomer.history : [];
    history.forEach((visit: { date?: string; price?: string }) => {
      const dateRaw = String(visit?.date || '').trim();
      const [, mm, yyyy] = dateRaw.split('/');
      const month = Number(mm);
      const year = Number(yyyy);
      if (!Number.isFinite(month) || !Number.isFinite(year)) return;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const idx = bucketIndex.get(key);
      if (idx === undefined) return;
      const priceRaw = String(visit?.price || '').replace(/[^\d]/g, '');
      const price = Number(priceRaw);
      if (!Number.isFinite(price)) return;
      buckets[idx].value += price;
    });

    return buckets.map(({ month, value }) => ({ month, value }));
  }, [selectedCustomer]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-10"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-serif text-primary mb-2">Danh sách khách hàng</h2>
          <p className="text-stone-500">Quản lý hồ sơ và lịch sử làm đẹp của khách hàng</p>
        </div>
        <button
          onClick={onNewCustomer}
          className="bg-primary text-white px-8 py-4 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl hover:bg-primary-light transition-all active:scale-95"
        >
          <Plus size={18} />
          Thêm khách hàng mới
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <KPICard title="Tổng khách hàng" value={String(total)} trend="+5.2%" color="primary" />
        <KPICard title="Khách hàng mới" value="156" subtitle="Tháng này" color="secondary" />
        <KPICard title="Tỷ lệ quay lại" value="78%" trend="+2.1%" color="stone" />
        <KPICard title="Giá trị TB/Khách" value="1.450.000₫" color="secondary-light" />
      </div>

      <div className="relative">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-stone-100 flex justify-between items-center flex-wrap gap-4 bg-stone-50/30">
            <div className="relative w-full max-w-md min-w-[200px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc số điện thoại..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="p-3 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 transition-colors"
                aria-label="Bộ lọc"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[min(560px,55vh)] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm">
                <tr className="border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Khách hàng
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Liên hệ
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Nguồn
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Lần cuối ghé
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-sm text-stone-400 text-center">
                      Đang tải danh sách...
                    </td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-sm text-red-500 text-center">
                      {loadError}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !loadError &&
                  list.map((customer) => (
                    <tr
                      key={String(customer.id)}
                      className={cn(
                        'group transition-colors',
                        selectedCustomer?.id === customer.id ? 'bg-secondary/5' : 'hover:bg-stone-50'
                      )}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                          />
                          <div>
                            <p className="text-sm font-bold text-primary group-hover:text-secondary transition-colors">
                              {customer.name}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {customer.tags.map((tag) => (
                                <span key={tag} className="text-[9px] font-bold text-stone-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-medium text-stone-600">{customer.phone}</p>
                        <p className="text-[10px] text-stone-400">{customer.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        {(() => {
                          const label = customer.source?.trim() || '';
                          if (!label) {
                            return <span className="text-xs font-medium text-stone-600">—</span>;
                          }
                          const iconId = sourceIconByName[label];
                          return (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-600">
                              {iconId !== undefined && (
                                <span className="text-primary shrink-0 inline-flex" aria-hidden>
                                  <CustomerSourceIcon iconId={iconId} size={14} />
                                </span>
                              )}
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-medium text-stone-600">{customer.lastVisit}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-stone-300 hover:text-secondary transition-colors"
                          aria-label="Xem chi tiết"
                        >
                          <ChevronDown size={20} className="-rotate-90" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!loading && !loadError && !list.length && (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-sm text-stone-400 text-center">
                      {debouncedSearch
                        ? 'Không tìm thấy khách phù hợp.'
                        : 'Chưa có khách hàng nào trong hệ thống.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-8 py-6 border-t border-stone-100 bg-white flex-wrap gap-4">
            <p className="text-xs font-medium text-stone-400">
              Hiển thị {list.length} / trang {page} — {totalPages} trang — tổng {total} khách
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Trang trước"
              >
                <ChevronLeft size={18} />
              </button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all disabled:opacity-40',
                    p === page
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Trang sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedCustomer ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
                className="absolute inset-0 z-10 bg-black/10"
              />
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="absolute top-0 right-0 z-20 w-[450px] h-full bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col"
              >
                <div className="p-8 flex-1 overflow-y-auto space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={cn(
                          'px-3 py-1 text-[10px] font-bold uppercase rounded-full',
                          selectedCustomer?.isWalkIn ? 'bg-stone-100 text-stone-500' : 'bg-secondary/10 text-secondary'
                        )}
                      >
                        {selectedCustomer?.isWalkIn ? 'KHÁCH VÃNG LAI' : 'KHÁCH HÀNG VIP'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditCustomer(selectedCustomer)}
                        className="px-3 py-1 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase rounded-full hover:bg-stone-200 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomer(selectedCustomer)}
                        className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-bold uppercase rounded-full hover:bg-red-100 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-stone-300 hover:text-stone-500 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.name}
                        className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl ring-4 ring-white"
                      />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Star size={20} fill="currentColor" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif text-primary">{selectedCustomer.name}</h3>
                      <p className="text-stone-400 text-sm font-medium">
                        Thành viên từ {selectedCustomer.memberSince || 'N/A'}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <a
                        href={selectedCustomer.phone ? `tel:${selectedCustomer.phone.replace(/\s+/g, '')}` : undefined}
                        className={cn(
                          "w-12 h-12 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center transition-all",
                          selectedCustomer.phone ? "hover:bg-secondary hover:text-white" : "opacity-40 pointer-events-none"
                        )}
                        aria-label="Gọi khách hàng"
                      >
                        <Phone size={20} />
                      </a>
                      <button
                        type="button"
                        onClick={() => onNewAppointmentForCustomer(selectedCustomer)}
                        className="px-6 h-12 bg-primary text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-primary-light transition-all"
                      >
                        <CalendarIcon size={16} /> Đặt lịch mới
                      </button>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-5 rounded-3xl space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Nguồn biết đến
                    </p>
                    {(() => {
                      const label = selectedCustomer.source?.trim() || '';
                      if (!label) {
                        return <p className="text-sm font-bold text-primary">—</p>;
                      }
                      const iconId = sourceIconByName[label];
                      return (
                        <p className="text-sm font-bold text-primary inline-flex items-center gap-2">
                          {iconId !== undefined && (
                            <span className="text-secondary shrink-0 inline-flex" aria-hidden>
                              <CustomerSourceIcon iconId={iconId} size={16} />
                            </span>
                          )}
                          {label}
                        </p>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-50 p-5 rounded-3xl space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">ĐIỂM TÍCH LŨY</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-serif text-primary">
                          {selectedCustomer.points?.toLocaleString() || 0}
                        </span>
                        <span className="text-[10px] text-stone-400 font-bold mb-1">
                          / {selectedCustomer.maxPoints?.toLocaleString() || 0} pts
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary"
                          style={{
                            width: `${((selectedCustomer.points || 0) / (selectedCustomer.maxPoints || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-stone-50 p-5 rounded-3xl space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG CHI TIÊU</p>
                      <p className="text-2xl font-serif text-primary">48.5M ₫</p>
                      <p className="text-[10px] text-green-600 font-bold">+15% so với tháng trước</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-primary">Biểu đồ chi tiêu</h4>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        6 THÁNG GẦN NHẤT
                      </span>
                    </div>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 8, fontWeight: 700 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }}
                          />
                          <Bar dataKey="value" fill="#4d0216" radius={[2, 2, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4 pb-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-primary">Lịch sử làm đẹp</h4>
                      <button
                        type="button"
                        className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(selectedCustomer.history || []).map(
                        (visit: { service?: string; price?: string; date?: string; stylist?: string }, idx: number) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 group hover:border-secondary/20 transition-all"
                          >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm group-hover:scale-110 transition-transform">
                              <Clock size={20} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between">
                                <p className="text-xs font-bold text-primary">{visit.service}</p>
                                <p className="text-xs font-bold text-primary">{visit.price}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] text-stone-400 font-medium">
                                  {visit.date} • Thợ: {visit.stylist}
                                </p>
                                <CheckCircle2 size={14} className="text-green-500" />
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-stone-50 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onViewTechnicalNotes(selectedCustomer)}
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={18} /> Xem ghi chú kỹ thuật (Color Formula)
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
