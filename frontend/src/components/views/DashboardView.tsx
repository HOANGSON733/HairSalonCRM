import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { KPICard } from '../KPICard';
import { cn } from '../../lib/utils';

interface DashboardViewProps {
  authToken: string | null;
  onNewCustomer: () => void;
  key?: string;
}
const today = new Date().toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

type DashboardAnalytics = {
  kpis: {
    revenueToday: number;
    ordersToday: number;
    newCustomersThisMonth: number;
  };
  weeklyRevenueData: Array<{ name: string; value: number }>;
  serviceAllocationData: Array<{ name: string; value: number; color: string }>;
  todayOrders: Array<{
    id: string;
    time: string;
    stylist: string;
    customer: string;
    service: string;
    status: string;
    avatar?: string;
  }>;
};

export function DashboardView({ authToken, onNewCustomer }: DashboardViewProps) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [chartRange, setChartRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics/dashboard?chartRange=${chartRange}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => null);
          throw new Error(data?.message || 'Không thể tải dữ liệu tổng quan.');
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
      })
      .catch(() => {
        if (cancelled) return;
        setAnalytics(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authToken, chartRange]);

  const kpis = analytics?.kpis || { revenueToday: 0, ordersToday: 0, newCustomersThisMonth: 0 };
  const weeklyRevenueData = analytics?.weeklyRevenueData || [];
  const serviceAllocationData = analytics?.serviceAllocationData || [];
  const todayOrders = analytics?.todayOrders || [];
  const topService = useMemo(() => serviceAllocationData?.[0]?.name || '—', [serviceAllocationData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-10"
    >
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-serif text-primary mb-2">Chào buổi sáng, Admin</h2>
          <p className="text-stone-500">
            Hôm nay là {formattedDate}
          </p>
        </div>
        <button
          onClick={onNewCustomer}
          className="bg-white border border-secondary text-secondary px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-secondary/5 transition-colors"
        >
          <Plus size={16} />
          Thêm khách hàng
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <KPICard
          title="Doanh thu hôm nay"
          value={`${Math.round(kpis.revenueToday).toLocaleString('vi-VN')} ₫`}
          color="primary"
        />
        <KPICard title="Giao dịch" value={String(kpis.ordersToday)} subtitle="Hôm nay" color="secondary" />
        <KPICard title="Khách mới" value={String(kpis.newCustomersThisMonth)} subtitle="Tháng này" color="stone" />
        <KPICard title="Trạng thái dữ liệu" value={loading ? 'Đang tải…' : 'Live'} color="secondary-light" />
      </div>

      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="col-span-2 bg-white p-8 rounded-xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-8 overflow-visible relative z-20">
            <h4 className="font-serif text-xl text-primary">
              {chartRange === 'week' ? 'Doanh thu theo tuần' : chartRange === 'month' ? 'Doanh thu 30 ngày qua' : 'Doanh thu năm nay'}
            </h4>
            <div className="relative group">
              <div className="flex items-center gap-1 text-xs font-bold text-stone-400 cursor-pointer hover:text-primary transition-colors py-2">
                {chartRange === 'week' ? '7 ngày qua' : chartRange === 'month' ? '30 ngày qua' : 'Năm nay'} <ChevronDown size={14} />
              </div>
              <div className="absolute right-0 top-full mt-0 w-48 bg-white border border-stone-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => setChartRange('week')}
                  className={cn("w-full text-left px-4 py-3 text-xs font-bold hover:bg-stone-50 hover:text-primary transition-colors rounded-t-lg", chartRange === 'week' ? "text-primary bg-stone-50/50" : "text-stone-500")}
                >
                  7 ngày qua
                </button>
                <div className="h-px bg-stone-50 w-full" />
                <button
                  onClick={() => setChartRange('month')}
                  className={cn("w-full text-left px-4 py-3 text-xs font-bold hover:bg-stone-50 hover:text-primary transition-colors", chartRange === 'month' ? "text-primary bg-stone-50/50" : "text-stone-500")}
                >
                  30 ngày qua (Tháng)
                </button>
                <div className="h-px bg-stone-50 w-full" />
                <button
                  onClick={() => setChartRange('year')}
                  className={cn("w-full text-left px-4 py-3 text-xs font-bold hover:bg-stone-50 hover:text-primary transition-colors rounded-b-lg", chartRange === 'year' ? "text-primary bg-stone-50/50" : "text-stone-500")}
                >
                  Năm nay
                </button>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#4d0216" radius={[4, 4, 0, 0]} maxBarSize={40} className="opacity-20 hover:opacity-100 transition-opacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100 flex flex-col">
          <h4 className="font-serif text-xl text-primary mb-8">Phân bổ dịch vụ</h4>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceAllocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {serviceAllocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-serif text-primary">{serviceAllocationData?.[0]?.value ?? 0}%</span>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{topService}</span>
            </div>
          </div>
          <div className="mt-auto space-y-3">
            {serviceAllocationData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-stone-600">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-8">
          <h4 className="font-serif text-xl text-primary">
            {chartRange === 'week' ? 'Giao dịch 7 ngày qua' : chartRange === 'month' ? 'Giao dịch 30 ngày qua' : 'Giao dịch năm nay'}
          </h4>
          <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">
            {todayOrders.length} giao dịch gần nhất
          </span>
        </div>
        <div className="max-h-[520px] overflow-y-auto rounded-xl border border-stone-100">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm">
              <tr className="border-b border-stone-100">
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Thời gian</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Khách</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Thợ thực hiện</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nội dung</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {todayOrders.map((apt) => (
                <tr key={apt.id} className="hover:bg-stone-50/40 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-stone-500">{apt.time}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary">{apt.customer}</td>
                  <td className="px-6 py-4 text-sm text-stone-600">{apt.stylist}</td>
                  <td className="px-6 py-4 text-sm text-stone-600">{apt.service}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
                      Đã hoàn thành
                    </span>
                  </td>
                </tr>
              ))}
              {!todayOrders.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-stone-400">
                    Chưa có giao dịch trong thời gian này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
