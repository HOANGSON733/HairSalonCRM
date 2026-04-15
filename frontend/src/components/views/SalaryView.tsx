import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  DollarSign,
  CalendarDays,
  TrendingUp,
  Clock3,
  ReceiptText,
  ListChecks,
  BriefcaseBusiness,
  Plus,
  Minus,
} from 'lucide-react';
import { Employee } from '../../types';

interface SalaryViewProps {
  employee: Employee | null;
  authToken?: string | null;
  onBack: () => void;
}

function parseMoney(value?: string | number) {
  if (typeof value === 'number') return value;
  const raw = String(value || '').replace(/[^0-9.-]/g, '');
  return Number(raw || 0);
}

type SalaryFormula = 'fixed_plus_commission' | 'commission_only';

export function SalaryView({ employee, authToken, onBack }: SalaryViewProps) {
  const [remoteData, setRemoteData] = useState<Partial<Employee> | null>(null);
  const [staffLevels, setStaffLevels] = useState<Array<{ name: string; fixedSalary: number; serviceCommission: number; salaryFormula: SalaryFormula; additions: number; deductions: number }>>([]);
  const [manualAdditions, setManualAdditions] = useState([{ label: 'Thưởng chuyên cần', amount: '500000', note: 'Đi làm đủ công trong tháng' }]);
  const [manualDeductions, setManualDeductions] = useState([{ label: 'Đi trễ', amount: '100000', note: '1 lần trong tháng' }]);

  useEffect(() => {
    const load = async () => {
      if (!employee?.id || !authToken) return;
      try {
        const [salaryResponse, levelsResponse] = await Promise.all([
          fetch(`/api/employees/${employee.id}/salary`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch('/api/staff-levels', {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);
        const salaryData = await salaryResponse.json().catch(() => null);
        if (salaryResponse.ok) setRemoteData(salaryData?.profile || null);

        const levelsData = await levelsResponse.json().catch(() => null);
        if (levelsResponse.ok && Array.isArray(levelsData?.staffLevels)) {
          setStaffLevels(levelsData.staffLevels.map((item: any) => ({
            name: String(item?.name || ''),
            fixedSalary: Number(item?.fixedSalary || 0),
            serviceCommission: Number(item?.serviceCommission || 0),
            salaryFormula: item?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
            additions: Number(item?.additions || 0),
            deductions: Number(item?.deductions || 0),
          })));
        }
      } catch {
        setRemoteData(null);
      }
    };
    void load();
  }, [employee?.id, authToken]);

  const salaryData = useMemo(() => {
    const profile = remoteData || employee || {};
    const revenue = parseMoney(profile.monthlyRevenue);
    const roleKey = employee?.role || '';
    const matchedLevel = staffLevels.find((item) => item.name.trim().toLowerCase() === roleKey.trim().toLowerCase());
    const fixedSalary = Number(matchedLevel?.fixedSalary || 0);
    const salaryFormula = (matchedLevel?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission') as SalaryFormula;
    const commissionRate = Number((matchedLevel?.serviceCommission ?? profile.commissionRate) || 0);
    const commissionAmount = Math.round((revenue * commissionRate) / 100);
    const additions = Number(matchedLevel?.additions || 0);
    const deductions = Number(matchedLevel?.deductions || 0);
    const salaryBreakdown = salaryFormula === 'fixed_plus_commission'
      ? [
          { label: 'Lương cứng', amount: fixedSalary || 0 },
          { label: 'Hoa hồng dịch vụ', amount: commissionAmount },
          { label: 'Tổng doanh thu từ dịch vụ', amount: revenue },
        ]
      : [
          { label: 'Hoa hồng dịch vụ', amount: commissionAmount },
          { label: 'Tổng doanh thu từ dịch vụ', amount: revenue },
        ];
    const addItems = [{ label: 'Khoản cộng', amount: additions, note: 'Theo cấp bậc nhân viên' }];
    const minusItems = [{ label: 'Khoản trừ', amount: deductions, note: 'Theo cấp bậc nhân viên' }];
    const manualAddTotal = manualAdditions.reduce((sum, item) => sum + parseMoney(item.amount), 0);
    const manualDeductTotal = manualDeductions.reduce((sum, item) => sum + parseMoney(item.amount), 0);
    const gross = salaryBreakdown.reduce((sum, item) => sum + Number(item.amount || 0), 0) + additions + manualAddTotal - deductions - manualDeductTotal;

    return {
      revenue,
      commissionRate,
      commissionAmount,
      salaryBreakdown,
      addItems,
      minusItems,
      gross,
      baseSalary: Number(salaryBreakdown.find((item) => item.label === 'Lương cứng')?.amount || 0),
      salaryFormula,
      formulaText:
        salaryFormula === 'fixed_plus_commission'
          ? 'Lương = Lương cứng + Hoa hồng dịch vụ + Khoản cộng - Khoản trừ'
          : 'Lương = Hoa hồng dịch vụ + Khoản cộng - Khoản trừ',
      sourceRevenue: (Array.isArray(profile.revenueSources) && profile.revenueSources.length
        ? profile.revenueSources
        : [
            { name: 'Dịch vụ cắt tóc', amount: Math.round(revenue * 0.42) },
            { name: 'Uốn / Nhuộm', amount: Math.round(revenue * 0.33) },
            { name: 'Chăm sóc / Phục hồi', amount: Math.round(revenue * 0.18) },
            { name: 'Bán sản phẩm', amount: Math.round(revenue * 0.07) },
          ]) as { name: string; amount: number }[],
      workHistory: (Array.isArray(profile.workHistory) && profile.workHistory.length
        ? profile.workHistory
        : [
            { date: '01/04', title: 'Làm ca sáng', detail: 'Hoàn thành 7 lượt dịch vụ' },
          ]) as { date: string; title: string; detail: string }[],
    };
  }, [employee, remoteData, staffLevels]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-10 space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif text-primary">Chi tiết bảng lương</h2>
          <p className="text-stone-400 text-sm">Xem nguồn tiền, cách tính lương và lịch sử công việc</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors"
        >
          <ChevronLeft size={18} />
          Quay lại hồ sơ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-secondary">
            <DollarSign size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Doanh thu tháng</span>
          </div>
          <p className="text-4xl font-serif text-primary">{salaryData.revenue.toLocaleString('vi-VN')}</p>
          <p className="text-sm text-stone-400">VND</p>
        </div>

        <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-secondary">
            <CalendarDays size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tháng hiện tại</span>
          </div>
          <p className="text-4xl font-serif text-primary">{new Date().getMonth() + 1}</p>
          <p className="text-sm text-stone-400">{new Date().getFullYear()}</p>
        </div>

        <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-secondary">
            <TrendingUp size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tỷ lệ hoa hồng</span>
          </div>
          <p className="text-4xl font-serif text-primary">{salaryData.commissionRate}%</p>
          <p className="text-sm text-stone-400">Lấy từ cấp bậc nhân viên trong hệ thống</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <ReceiptText className="text-secondary" size={20} />
            <div>
              <h3 className="text-xl font-serif text-primary">Nguồn tiền</h3>
              <p className="text-sm text-stone-400">Doanh thu chi tiết trong tháng theo cấp bậc nhân viên</p>
            </div>
          </div>
          <div className="space-y-4">
            {salaryData.sourceRevenue.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-primary">{item.name}</span>
                  <span className="text-stone-500">{item.amount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${Math.max(18, Math.min(100, Math.round((item.amount / Math.max(salaryData.revenue, 1)) * 100)))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <ListChecks className="text-secondary" size={20} />
            <div>
              <h3 className="text-xl font-serif text-primary">Cách tính</h3>
              <p className="text-sm text-stone-400">Breakdown lương hiện tại</p>
            </div>
          </div>
          <div className="rounded-3xl bg-amber-50/60 border border-amber-100 p-5">
            <p className="text-sm font-semibold text-primary">{salaryData.formulaText}</p>
            <p className="mt-2 text-xs text-stone-500">
              Cách tính đang dùng theo cấp bậc: <strong>{employee?.role || 'Chưa xác định'}</strong>
            </p>
          </div>
          <div className="space-y-3 text-sm">
            {salaryData.salaryBreakdown.map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-stone-500">{row.label}</span>
                <span className="font-semibold text-primary">{Number(row.amount || 0).toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
            <div className="flex justify-between"><span className="text-stone-500">Khoản cộng</span><span className="font-semibold text-green-600">+{salaryData.addItems.reduce((s, i) => s + i.amount, 0).toLocaleString('vi-VN')}đ</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Khoản trừ</span><span className="font-semibold text-red-600">-{salaryData.minusItems.reduce((s, i) => s + i.amount, 0).toLocaleString('vi-VN')}đ</span></div>
            <div className="pt-3 border-t border-stone-100 flex justify-between text-base">
              <span className="font-bold text-primary">Tổng nhận tạm tính</span>
              <span className="font-bold text-primary">{Math.max(salaryData.gross, 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Clock3 className="text-secondary" size={20} />
            <div>
              <h3 className="text-xl font-serif text-primary">Lịch sử công việc</h3>
              <p className="text-sm text-stone-400">Các hoạt động gần đây của nhân viên</p>
            </div>
          </div>
          <div className="space-y-4">
            {salaryData.workHistory.map((item) => (
              <div key={`${item.date}-${item.title}`} className="flex gap-4 rounded-2xl bg-stone-50/70 p-4">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">{item.date}</p>
                </div>
                <div>
                  <p className="font-semibold text-primary">{item.title}</p>
                  <p className="text-sm text-stone-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="text-secondary" size={20} />
            <div>
              <h3 className="text-xl font-serif text-primary">Khoản cộng / trừ</h3>
              <p className="text-sm text-stone-400">Các khoản bổ sung và khấu trừ trong kỳ</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">Khoản cộng</p>
              <div className="space-y-3">
                {salaryData.addItems.map((item) => (
                  <div key={item.label} className="flex items-start justify-between rounded-2xl bg-green-50/60 p-4">
                    <div>
                      <p className="font-semibold text-primary">{item.label}</p>
                      <p className="text-sm text-stone-500">{item.note}</p>
                    </div>
                    <span className="font-bold text-green-700">+{item.amount.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-red-600">Khoản trừ</p>
              <div className="space-y-3">
                {salaryData.minusItems.map((item) => (
                  <div key={item.label} className="flex items-start justify-between rounded-2xl bg-red-50/60 p-4">
                    <div>
                      <p className="font-semibold text-primary">{item.label}</p>
                      <p className="text-sm text-stone-500">{item.note}</p>
                    </div>
                    <span className="font-bold text-red-700">-{item.amount.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-serif text-primary">Nhân viên đang xem</h3>
            <p className="text-sm text-stone-400">Chỉnh khoản cộng / trừ trực tiếp bên dưới</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Nhập tay</span>
        </div>
        {employee ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden flex items-center justify-center">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-2xl text-primary">{employee.name?.[0] || 'A'}</span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{employee.name}</p>
              <p className="text-sm text-stone-400">{employee.role}</p>
            </div>
          </div>
        ) : (
          <p className="text-stone-400 text-sm">Không có thông tin nhân viên.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-green-600" />
              <h4 className="font-bold text-primary">Khoản cộng nhập tay</h4>
            </div>
            <div className="space-y-3">
              {manualAdditions.map((item, index) => (
                <div key={`add-${index}`} className="grid grid-cols-12 gap-3">
                  <input
                    value={item.label}
                    onChange={(e) => setManualAdditions((prev) => prev.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)))}
                    className="col-span-5 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="Tên khoản cộng"
                  />
                  <input
                    value={item.amount}
                    onChange={(e) => setManualAdditions((prev) => prev.map((row, i) => (i === index ? { ...row, amount: e.target.value } : row)))}
                    className="col-span-4 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="Số tiền"
                  />
                  <button
                    type="button"
                    onClick={() => setManualAdditions((prev) => prev.filter((_, i) => i !== index))}
                    className="col-span-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setManualAdditions((prev) => [...prev, { label: '', amount: '', note: '' }])} className="text-sm font-bold text-secondary hover:underline">
                + Thêm khoản cộng
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Minus size={16} className="text-red-600" />
              <h4 className="font-bold text-primary">Khoản trừ nhập tay</h4>
            </div>
            <div className="space-y-3">
              {manualDeductions.map((item, index) => (
                <div key={`minus-${index}`} className="grid grid-cols-12 gap-3">
                  <input
                    value={item.label}
                    onChange={(e) => setManualDeductions((prev) => prev.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)))}
                    className="col-span-5 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="Tên khoản trừ"
                  />
                  <input
                    value={item.amount}
                    onChange={(e) => setManualDeductions((prev) => prev.map((row, i) => (i === index ? { ...row, amount: e.target.value } : row)))}
                    className="col-span-4 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="Số tiền"
                  />
                  <button
                    type="button"
                    onClick={() => setManualDeductions((prev) => prev.filter((_, i) => i !== index))}
                    className="col-span-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setManualDeductions((prev) => [...prev, { label: '', amount: '', note: '' }])} className="text-sm font-bold text-secondary hover:underline">
                + Thêm khoản trừ
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
