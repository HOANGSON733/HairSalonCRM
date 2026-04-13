import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Printer, 
  Plus, 
  Users, 
  X, 
  Phone, 
  Trash2 
} from 'lucide-react';
import { FilterCheckbox } from '../FilterCheckbox';
import { cn } from '../../lib/utils';
import { NewAppointmentModal } from '../modals/NewAppointmentModal';
import type { Employee, Service } from '../../types';

interface AppointmentsViewProps {
  authToken: string | null;
  onNewAppointment: () => void;
  services?: Service[];
  employees?: Employee[];
  key?: string;
}

export function AppointmentsView({ authToken, onNewAppointment, services = [], employees = [] }: AppointmentsViewProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [viewMonthDate, setViewMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<any>(null);
  const [stylistFilter, setStylistFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    confirmed: true,
    pending: true,
    completed: true,
  });

  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(viewMonthDate);
  const dayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(selectedDate);
  const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const weekDateKeys = useMemo(() => {
    const day = selectedDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + mondayOffset);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
  }, [selectedDate]);
  const timelineHours = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 8), []);

  const calendarDays = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const cells: Date[] = [];
    for (let i = leadingDays; i > 0; i -= 1) cells.push(new Date(year, month, 1 - i));
    for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (leadingDays + totalDays) + 1;
      cells.push(new Date(year, month + 1, nextDay));
    }
    return cells;
  }, [viewMonthDate]);

  const loadSchedule = useCallback(async () => {
    if (!authToken) {
      setScheduleData([]);
      setError('Phiên đăng nhập không hợp lệ.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const targets = viewMode === 'week' ? weekDateKeys : [dateKey];
      const responses = await Promise.all(
        targets.map((key) =>
          fetch(`/api/appointments?date=${key}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          })
        )
      );
      for (const response of responses) {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || 'Không thể tải lịch hẹn.');
        }
      }
      const payloads = await Promise.all(responses.map((r) => r.json()));
      const appointments = payloads.flatMap((p) => (Array.isArray(p?.appointments) ? p.appointments : []));
      const mapped = appointments.map((item: any, idx: number) => {
        const time = String(item?.time || '').trim();
        const [hourRaw, minuteRaw] = time.split(':');
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        const topHour = Number.isFinite(hour) ? hour : 8;
        const topMinute = Number.isFinite(minute) ? minute : 0;
        const top = Math.max(0, (topHour - 8) * 100 + Math.round((topMinute / 60) * 100));
        const durationMinutes = Number(item?.durationMinutes || 60);
        const endTotalMinutes = topHour * 60 + topMinute + durationMinutes;
        const endHour = Math.floor(endTotalMinutes / 60);
        const endMinute = endTotalMinutes % 60;
        return {
          id: String(item?.id || `apt-${idx}`),
          customer: item?.customerName || 'Khách',
          customerName: item?.customerName || 'Khách',
          service: item?.serviceName || 'Dịch vụ',
          serviceId: item?.serviceId || '',
          stylist: item?.stylistName || '—',
          stylistId: item?.stylistId || '',
          status: item?.status || 'confirmed',
          date: item?.date || dateKey,
          phone: item?.customerPhone || '—',
          customerPhone: item?.customerPhone || '',
          time,
          notes: item?.notes || '',
          smsReminder: Boolean(item?.smsReminder),
          durationMinutes,
          start: `${String(topHour).padStart(2, '0')}:${String(topMinute).padStart(2, '0')}`,
          end: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          top,
          height: Math.max(72, Math.round((durationMinutes / 60) * 100) - 8),
          color:
            idx % 3 === 0
              ? 'bg-secondary/10 border-secondary/40 text-secondary'
              : idx % 3 === 1
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-stone-100 border-stone-300 text-stone-700',
        };
      });
      setScheduleData(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải lịch hẹn.';
      setScheduleData([]);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, dateKey, weekDateKeys, viewMode]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    const handleChanged = () => {
      loadSchedule();
    };
    window.addEventListener('appointments:changed', handleChanged);
    return () => {
      window.removeEventListener('appointments:changed', handleChanged);
    };
  }, [loadSchedule]);

  const selectedLabel = useMemo(() => {
    if (!selectedAppointment) return 'ĐÃ XÁC NHẬN';
    if (selectedAppointment.status === 'completed') return 'HOÀN THÀNH';
    if (selectedAppointment.status === 'confirmed') return 'ĐÃ XÁC NHẬN';
    return 'ĐANG CHỜ';
  }, [selectedAppointment]);

  const stylistOptions = useMemo(
    () => ['all', ...Array.from(new Set(scheduleData.map((a) => a.stylist).filter(Boolean)))],
    [scheduleData]
  );
  const serviceOptions = useMemo(
    () => ['all', ...Array.from(new Set(scheduleData.map((a) => a.service).filter(Boolean)))],
    [scheduleData]
  );
  const filteredData = useMemo(
    () =>
      scheduleData.filter((apt) => {
        if (stylistFilter !== 'all' && apt.stylist !== stylistFilter) return false;
        if (serviceFilter !== 'all' && apt.service !== serviceFilter) return false;
        if (!statusFilters[apt.status] && apt.status in statusFilters) return false;
        return true;
      }),
    [scheduleData, stylistFilter, serviceFilter, statusFilters]
  );

  const weeklyGrouped = useMemo(() => {
    const byDate = new Map<string, any[]>();
    filteredData.forEach((apt) => {
      const key = String(apt.date || '');
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)?.push(apt);
    });
    return weekDateKeys.map((key) => ({ key, items: byDate.get(key) || [] }));
  }, [filteredData, weekDateKeys]);

  const handleEditAppointment = () => {
    if (!selectedAppointment) return;
    setAppointmentToEdit({
      id: String(selectedAppointment.id || ''),
      customerName: selectedAppointment.customerName || selectedAppointment.customer || '',
      customerPhone: selectedAppointment.customerPhone || '',
      serviceId: selectedAppointment.serviceId || '',
      stylistId: selectedAppointment.stylistId || '',
      date: selectedAppointment.date,
      time: selectedAppointment.time || selectedAppointment.start || '09:00',
      notes: selectedAppointment.notes || '',
      smsReminder: selectedAppointment.smsReminder ?? true,
      status: selectedAppointment.status || 'confirmed',
    });
    setSelectedAppointment(null);
  };

  const handleDeleteAppointment = async () => {
    if (!authToken || !selectedAppointment) return;
    const ok = window.confirm('Bạn có chắc muốn xóa lịch hẹn này?');
    if (!ok) return;
    setActionLoading(true);
    try {
      const appointmentId = String(selectedAppointment.id || '').trim();
      if (!appointmentId) {
        throw new Error('Không tìm thấy id lịch hẹn để xóa.');
      }
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Không thể xóa lịch hẹn.');
      }
      setSelectedAppointment(null);
      loadSchedule();
      window.dispatchEvent(new Event('appointments:changed'));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể xóa lịch hẹn.';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-10 flex gap-8"
    >
      {/* Left Panel: Calendar & Filters */}
      {showFilters && <div className="w-80 space-y-8">
        {/* Mini Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <h5 className="font-serif text-primary">{monthLabel}</h5>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-1 hover:bg-stone-100 rounded"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 mb-4">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = day.getMonth() === viewMonthDate.getMonth();
              const isSelected =
                day.getDate() === selectedDate.getDate() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getFullYear() === selectedDate.getFullYear();
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isCurrentMonth) setViewMonthDate(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg transition-all relative mx-auto",
                    isSelected ? "bg-primary text-white shadow-md" : "hover:bg-stone-100",
                    isCurrentMonth ? "text-stone-700" : "text-stone-300"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-stone-100/50 p-8 rounded-2xl space-y-6">
          <h5 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">BỘ LỌC LỊCH HẸN</h5>
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-500">NHÂN VIÊN THỰC HIỆN</label>
            <select
              value={stylistFilter}
              onChange={(e) => setStylistFilter(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm"
            >
              <option value="all">Tất cả thợ</option>
              {stylistOptions.filter((v) => v !== 'all').map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-500">LOẠI DỊCH VỤ</label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm"
            >
              <option value="all">Tất cả dịch vụ</option>
              {serviceOptions.filter((v) => v !== 'all').map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-stone-500">TRẠNG THÁI</label>
            <div className="space-y-3">
              <button onClick={() => setStatusFilters((p) => ({ ...p, confirmed: !p.confirmed }))} className="w-full text-left">
                <FilterCheckbox label="Đã xác nhận" checked={statusFilters.confirmed} color="bg-secondary" />
              </button>
              <button onClick={() => setStatusFilters((p) => ({ ...p, pending: !p.pending }))} className="w-full text-left">
                <FilterCheckbox label="Đang chờ" checked={statusFilters.pending} color="bg-primary" />
              </button>
              <button onClick={() => setStatusFilters((p) => ({ ...p, completed: !p.completed }))} className="w-full text-left">
                <FilterCheckbox label="Hoàn thành" checked={statusFilters.completed} />
              </button>
            </div>
          </div>
        </div>
      </div>}

      {/* Right Panel: Schedule */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-2xl font-serif text-primary">{dayLabel}</h3>
          <div className="flex items-center gap-4">
            <div className="bg-stone-100 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setViewMode('day')}
                className={cn("px-4 py-1.5 rounded-md text-xs font-bold", viewMode === 'day' ? "bg-white shadow-sm" : "text-stone-400")}
              >
                Ngày
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn("px-4 py-1.5 rounded-md text-xs font-bold", viewMode === 'week' ? "bg-white shadow-sm" : "text-stone-400")}
              >
                Tuần
              </button>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="p-2 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-50"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md"
            >
              <Printer size={16} /> In lịch biểu
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative p-8">
          {/* Timeline Grid */}
          {viewMode === 'day' ? <div className="relative h-[1500px]">
            {timelineHours.map((hour) => (
              <div key={hour} className="h-[100px] border-t border-stone-100 flex gap-4">
                <span className="text-[11px] font-bold text-stone-300 -mt-2.5 w-10">{hour.toString().padStart(2, '0')}:00</span>
                <div className="flex-1" />
              </div>
            ))}

            {/* Appointment Blocks */}
            {filteredData.map((apt) => (
              <motion.div 
                key={apt.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedAppointment(apt)}
                className={cn(
                  "absolute left-16 right-8 rounded-xl border-l-4 p-4 cursor-pointer shadow-sm transition-all",
                  apt.color
                )}
                style={{ top: apt.top, height: apt.height }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={14} />
                      <p className="text-sm font-bold">{apt.customer}</p>
                    </div>
                    <p className="text-xs opacity-80">{apt.service} • {apt.stylist}</p>
                  </div>
                  <span className="text-[10px] font-bold opacity-60">{apt.start} - {apt.end}</span>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="text-sm text-stone-400 pt-6 pl-16">Đang tải lịch hẹn...</div>
            )}
            {!isLoading && !!error && (
              <div className="text-sm text-red-400 pt-6 pl-16">{error}</div>
            )}
            {!isLoading && !error && !filteredData.length && (
              <div className="text-sm text-stone-400 pt-6 pl-16">
                Chưa có lịch hẹn nào trong hôm nay.
              </div>
            )}
          </div> : (
            <div className="space-y-4">
              {weeklyGrouped.map((day) => (
                <div key={day.key} className="border border-stone-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-stone-500 mb-2">{day.key}</p>
                  {day.items.length ? day.items.map((apt) => (
                    <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-stone-100 mb-2">
                      <p className="text-sm font-bold text-primary">{apt.start} - {apt.end} • {apt.customer}</p>
                      <p className="text-xs text-stone-500">{apt.service} • {apt.stylist}</p>
                    </button>
                  )) : <p className="text-xs text-stone-400">Không có lịch hẹn.</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onNewAppointment}
          className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Appointment Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-600"
              >
                <X size={20} />
              </button>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded-full">{selectedLabel}</span>
                  <h3 className="text-3xl font-serif text-primary">{selectedAppointment.customer}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SỐ ĐIỆN THOẠI</p>
                      <p className="text-sm font-bold text-stone-700">{selectedAppointment.phone || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-stone-50 p-6 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">DỊCH VỤ</p>
                    <p className="text-sm font-bold text-stone-700">{selectedAppointment.service}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">THỢ CHÍNH</p>
                    <p className="text-sm font-bold text-stone-700">{selectedAppointment.stylist}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">THỜI LƯỢNG</p>
                    <p className="text-sm font-bold text-stone-700">{selectedAppointment.start} - {selectedAppointment.end}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">GIÁ DỰ KIẾN</p>
                    <p className="text-sm font-bold text-stone-700">—</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleEditAppointment}
                    disabled={actionLoading}
                    className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-light transition-colors disabled:bg-stone-300 disabled:text-stone-600"
                  >
                    {actionLoading ? 'Đang xử lý...' : 'Sửa lịch hẹn'}
                  </button>
                  <button
                    onClick={handleDeleteAppointment}
                    disabled={actionLoading}
                    className="w-14 h-14 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors disabled:bg-stone-100 disabled:text-stone-300"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appointmentToEdit && (
          <NewAppointmentModal
            onClose={() => setAppointmentToEdit(null)}
            authToken={authToken}
            services={services}
            employees={employees}
            initialData={appointmentToEdit}
            onSaved={() => {
              setAppointmentToEdit(null);
              loadSchedule();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
