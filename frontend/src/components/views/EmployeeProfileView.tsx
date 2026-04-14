import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Award,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Edit3,
  UserMinus
} from 'lucide-react';
import { Employee } from '../../types';
import { cn } from '../../lib/utils';

interface EmployeeProfileViewProps {
  employee: Employee;
  onBack: () => void;
  onAddShift: () => void;
  onEdit: () => void;
  onTerminate: () => void;
  onViewSalary: () => void;
  key?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

const STAFF_LEVELS_STORAGE_KEY = 'crm_staff_levels';
const STAFF_LEVELS_CHANGED_EVENT = 'staff-levels:changed';

export function EmployeeProfileView({ employee, onBack, onAddShift, onEdit, onTerminate, onViewSalary }: EmployeeProfileViewProps) {
  const [commissionByRole, setCommissionByRole] = useState<Record<string, number>>({});
  const [salaryFormulaByRole, setSalaryFormulaByRole] = useState<Record<string, 'fixed_plus_commission' | 'commission_only'>>({});
  const [fixedSalaryByRole, setFixedSalaryByRole] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadCommissionByRole = () => {
      try {
        const raw = localStorage.getItem(STAFF_LEVELS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
          setCommissionByRole({});
          return;
        }

        const next: Record<string, number> = {};
        const nextFormula: Record<string, 'fixed_plus_commission' | 'commission_only'> = {};
        const nextFixedSalary: Record<string, number> = {};

        parsed.forEach((item) => {
          const roleName = typeof item?.name === 'string' ? item.name.trim() : '';
          const rawCommission = typeof item?.serviceCommission === 'string' ? item.serviceCommission : '';
          const firstNumber = Number(rawCommission.match(/\d+(?:\.\d+)?/)?.[0] || 0);
          if (roleName && Number.isFinite(firstNumber) && firstNumber > 0) {
            next[roleName] = firstNumber;
          }
          if (roleName) {
            nextFormula[roleName] = item?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission';
            nextFixedSalary[roleName] = Number(item?.fixedSalary || 0);
          }
        });

        setCommissionByRole(next);
        setSalaryFormulaByRole(nextFormula);
        setFixedSalaryByRole(nextFixedSalary);
      } catch {
        setCommissionByRole({});
        setSalaryFormulaByRole({});
        setFixedSalaryByRole({});
      }
    };

    loadCommissionByRole();
    window.addEventListener(STAFF_LEVELS_CHANGED_EVENT, loadCommissionByRole);
    return () => window.removeEventListener(STAFF_LEVELS_CHANGED_EVENT, loadCommissionByRole);
  }, []);

  const effectiveCommissionRate = useMemo(() => {
    const byRole = commissionByRole[employee.role || ''];
    if (Number.isFinite(byRole) && byRole > 0) return byRole;
    return Number(employee.commissionRate || 0);
  }, [commissionByRole, employee.role, employee.commissionRate]);

  const effectiveSalaryFormula = useMemo(() => {
    return salaryFormulaByRole[employee.role || ''] || 'fixed_plus_commission';
  }, [salaryFormulaByRole, employee.role]);

  const effectiveFixedSalary = useMemo(() => {
    return Number(fixedSalaryByRole[employee.role || ''] || 0);
  }, [fixedSalaryByRole, employee.role]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-10 space-y-12"
    >
      {/* Profile Header */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden flex min-h-[500px] h-auto">
        <div className="w-1/3 relative overflow-hidden">
          {employee.avatar ? (
            <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <span className="text-7xl font-serif text-primary">{getInitials(employee.name)}</span>
            </div>
          )}
          <button
            onClick={onBack}
            className="absolute top-8 left-8 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="flex-1 p-16 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-secondary/10 text-secondary text-[11px] font-bold uppercase tracking-widest rounded-full">{employee.role}</span>
            <h2 className="text-6xl font-serif text-primary leading-tight">{employee.name}</h2>
            <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
              {employee.bio}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Số điện thoại</p>
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Phone size={15} className="text-secondary" />
                {employee.phone || 'Chưa cập nhật'}
              </p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold text-primary flex items-center gap-2 truncate">
                <Mail size={15} className="text-secondary shrink-0" />
                <span className="truncate">{employee.email || 'Chưa cập nhật'}</span>
              </p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ngày sinh</p>
              <p className="text-sm font-bold text-primary">{employee.birthday || 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ngày bắt đầu</p>
              <p className="text-sm font-bold text-primary">{employee.startDate || 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ca mặc định</p>
              <p className="text-sm font-bold text-primary">{employee.defaultShift || 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tình trạng</p>
              <p className="text-sm font-bold text-primary truncate">
                {employee.status === 'terminated' 
                  ? 'Nghỉ việc' 
                  : employee.status === 'on-leave' 
                    ? 'Tạm nghỉ' 
                    : employee.status === 'busy' 
                      ? 'Đang phục vụ' 
                      : 'Đang rảnh'}
              </p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1 col-span-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Chuyên môn</p>
              <p className="text-sm font-bold text-primary truncate">{employee.specialties?.length ? employee.specialties.join(', ') : 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-stone-50 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tỷ lệ hoa hồng</p>
              <p className="text-sm font-bold text-primary">{effectiveCommissionRate}%</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onAddShift}
              className="bg-primary text-white px-10 py-5 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-2xl hover:bg-primary-light transition-all active:scale-95"
            >
              <CalendarIcon size={20} />
              Đặt Lịch Làm Việc
            </button>
            <button
              onClick={onEdit}
              className="bg-stone-50 text-stone-600 px-10 py-5 rounded-2xl text-sm font-bold flex items-center gap-3 hover:bg-stone-100 transition-all"
            >
              <Edit3 size={20} />
              Sửa Thông Tin
            </button>
            {employee.status !== 'terminated' && (
              <button
                onClick={onTerminate}
                className="bg-red-50 text-red-600 px-10 py-5 rounded-2xl text-sm font-bold flex items-center gap-3 hover:bg-red-100 transition-all"
              >
                <UserMinus size={20} />
                Xin nghỉ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 text-secondary">
            <Clock size={24} />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">DOANH THU THÁNG NÀY</h4>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-5xl font-serif text-primary">{employee.monthlyRevenue || '0'}</h3>
            <span className="text-stone-400 font-bold mb-1.5">VND</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6">
          <div className="flex items-center gap-3 text-secondary">
            <CheckCircle2 size={24} />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">TỶ LỆ REBOOKING</h4>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-5xl font-serif text-primary">{employee.rebookingRate || '0%'}</h3>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: '82%' }}></div>
          </div>
        </div>
      </div>

      {/* Schedule & Commission */}
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-3xl font-serif text-primary">Lịch Làm Việc Tuần</h3>
            <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Tháng {new Date().getMonth() + 1}, {new Date().getFullYear()}</p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden flex divide-x divide-stone-100">
            {(employee.weeklySchedule?.length ? employee.weeklySchedule : [
              { day: 'T2', shift: employee.defaultShift || 'Ca Sáng', time: '08:00 - 16:00' },
              { day: 'T3', shift: employee.defaultShift || 'Ca Sáng', time: '08:00 - 16:00' },
              { day: 'T4', shift: employee.defaultShift || 'Ca Sáng', time: '08:00 - 16:00' },
              { day: 'T5', shift: 'NGHỈ PHÉP', time: '-' },
              { day: 'T6', shift: employee.defaultShift || 'Ca Sáng', time: '08:00 - 16:00' },
              { day: 'T7', shift: 'Ca Tăng Cường', time: '08:00 - 20:00', type: 'danger' },
              { day: 'CN', shift: 'Ca Tăng Cường', time: '08:00 - 20:00', type: 'danger' },
            ]).map((day, i) => (
              <div key={i} className="flex-1 min-h-[180px] flex flex-col">
                <div className="p-4 text-center border-b border-stone-50 bg-stone-50/50">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{day.day}</span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-2">
                  {day.shift === 'NGHỈ PHÉP' ? (
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">NGHỈ PHÉP</span>
                  ) : (
                    <>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                        day.type === 'danger' ? "bg-primary text-white" : "bg-secondary/10 text-secondary"
                      )}>
                        {day.shift}
                      </span>
                      <p className="text-[10px] font-bold text-stone-600">{day.time}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-3xl font-serif text-primary">Hoa Hồng</h3>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-8">
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Công thức lương hiện tại</p>
              <p className="text-sm font-semibold text-primary">
                {effectiveSalaryFormula === 'fixed_plus_commission'
                  ? 'Lương = Lương cứng + (Doanh thu × % hoa hồng)'
                  : 'Lương = Doanh thu × % hoa hồng'}
              </p>
              {effectiveSalaryFormula === 'fixed_plus_commission' && (
                <p className="text-xs text-stone-500">Lương cứng: {effectiveFixedSalary.toLocaleString('vi-VN')}đ</p>
              )}
            </div>

            <div className="space-y-6">
              {employee.commissions?.length ? (
                employee.commissions.map((comm, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-primary">{comm.service}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">{comm.count} DỊCH VỤ x {effectiveCommissionRate}%</p>
                    </div>
                    <span className="text-sm font-serif text-primary">{comm.amount}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-stone-400 text-sm font-medium">Chưa có dữ liệu hoa hồng tháng này.</p>
                </div>
              )}
            </div>
            <div className="pt-8 border-t border-stone-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG TẠM TÍNH</p>
                <p className="text-3xl font-serif text-primary">
                  {employee.commissions?.length 
                    ? employee.commissions.reduce((acc, curr) => {
                        const amt = parseFloat(curr.amount.replace(/[^0-9]/g, ''));
                        return acc + (isNaN(amt) ? 0 : amt);
                      }, 0).toLocaleString() + 'k'
                    : '0k'}
                </p>
              </div>
              <button
                type="button"
                onClick={onViewSalary}
                className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline"
              >
                Chi Tiết Bảng Lương
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="space-y-8">
        <h3 className="text-3xl font-serif text-primary">Chứng Chỉ Chuyên Môn</h3>
        <div className="grid grid-cols-3 gap-8">
          {employee.certificates?.length ? (
            employee.certificates.map((cert, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-6 group hover:border-secondary/20 transition-all">
                <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <Award size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary">{cert.title}</p>
                  <p className="text-[10px] text-stone-400 font-medium italic">{cert.location}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-stone-400 text-sm font-medium py-4">Chưa có chứng chỉ chuyên môn nào được thêm.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
