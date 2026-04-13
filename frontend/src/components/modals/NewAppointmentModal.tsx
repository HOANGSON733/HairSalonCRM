import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Search, 
  Plus, 
  CheckCircle2, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Employee, Service } from '../../types';

interface NewAppointmentModalProps {
  onClose: () => void;
  authToken: string | null;
  services: Service[];
  employees: Employee[];
  initialData?: {
    id: string;
    customerName: string;
    customerPhone?: string;
    serviceId?: string;
    stylistId?: string;
    date: string;
    time: string;
    notes?: string;
    smsReminder?: boolean;
    status?: string;
  } | null;
  onSaved?: () => void;
  initialStylistId?: string | null;
  initialCustomerName?: string | null;
}

export function NewAppointmentModal({ onClose, authToken, services, employees, initialData = null, onSaved, initialStylistId = null, initialCustomerName = null }: NewAppointmentModalProps) {
  const now = new Date();
  const isEditMode = Boolean(initialData?.id);
  const initialDate = initialData?.date && /^\d{4}-\d{2}-\d{2}$/.test(initialData.date)
    ? new Date(`${initialData.date}T00:00:00`)
    : now;
  const [viewMonthDate, setViewMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedService, setSelectedService] = useState<string>(() => String(services[0]?.id || ''));
  const [selectedStylist, setSelectedStylist] = useState<string>(() => String(employees[0]?.id || 'any'));
  const [selectedTime, setSelectedTime] = useState('11:00');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [customerQuery, setCustomerQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [smsReminder, setSmsReminder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 22; hour += 1) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 22) slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const selectedServiceObj = services.find((s) => String(s.id) === String(selectedService));
  const selectedStylistObj = employees.find((e) => String(e.id) === String(selectedStylist));
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const currentMonthYear = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(viewMonthDate);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isPastDate = (d: Date) => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    return normalized.getTime() < todayStart.getTime();
  };

  const isPastTimeSlot = (time: string) => {
    const [h, m] = time.split(':').map((v) => Number(v));
    const slot = new Date(selectedDate);
    slot.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return isSameDay(selectedDate, new Date()) && slot.getTime() < Date.now();
  };

  const disabledSlots = useMemo(() => {
    const merged = new Set(bookedSlots);
    timeSlots.forEach((slot) => {
      if (isPastTimeSlot(slot)) merged.add(slot);
    });
    return merged;
  }, [bookedSlots, timeSlots, selectedDate]);

  useEffect(() => {
    const nextDate = initialData?.date && /^\d{4}-\d{2}-\d{2}$/.test(initialData.date)
      ? new Date(`${initialData.date}T00:00:00`)
      : now;
    setViewMonthDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setSelectedDate(nextDate);
    setSelectedTime(initialData?.time || '11:00');
    setCustomerQuery(initialData?.customerName || initialCustomerName || '');
    setNotes(initialData?.notes || '');
    setSmsReminder(initialData?.smsReminder ?? true);
    setSelectedService(
      initialData?.serviceId && services.some((s) => String(s.id) === String(initialData.serviceId))
        ? String(initialData.serviceId)
        : String(services[0]?.id || '')
    );
    const preferredStylistId = initialData?.stylistId || initialStylistId;
    setSelectedStylist(
      preferredStylistId && employees.some((e) => String(e.id) === String(preferredStylistId))
        ? String(preferredStylistId)
        : (preferredStylistId ? 'any' : String(employees[0]?.id || 'any'))
    );
  }, [initialData, initialStylistId, services, employees]);

  const calendarDays = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingDays = (firstDay.getDay() + 6) % 7; // Monday first
    const totalDays = lastDay.getDate();
    const cells: Date[] = [];

    for (let i = leadingDays; i > 0; i -= 1) {
      cells.push(new Date(year, month, 1 - i));
    }
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (leadingDays + totalDays) + 1;
      cells.push(new Date(year, month + 1, nextDay));
    }
    return cells;
  }, [viewMonthDate]);

  useEffect(() => {
    if (!authToken) {
      setBookedSlots([]);
      return;
    }

    let cancelled = false;
    const loadBookedSlots = async () => {
      try {
        const response = await fetch(`/api/appointments?date=${selectedDateKey}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || 'Không thể tải lịch hẹn theo ngày.');
        }

        const data = await response.json();
        const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
        const occupiedTimes = appointments
          .filter((item: any) => String(item?.id || '') !== String(initialData?.id || ''))
          .filter((item: any) => {
            if (!selectedStylist || selectedStylist === 'any') return true;
            return String(item?.stylistId || '') === String(selectedStylist);
          })
          .map((item: any) => String(item?.time || '').trim())
          .filter(Boolean);

        if (!cancelled) setBookedSlots(occupiedTimes);
      } catch (_error) {
        if (!cancelled) setBookedSlots([]);
      }
    };

    loadBookedSlots();
    return () => {
      cancelled = true;
    };
  }, [authToken, selectedDateKey, selectedStylist]);

  useEffect(() => {
    if (!timeSlots.length) return;
    if (!disabledSlots.has(selectedTime)) return;
    const firstAvailable = timeSlots.find((slot) => !disabledSlots.has(slot));
    if (firstAvailable) setSelectedTime(firstAvailable);
  }, [selectedDateKey, disabledSlots, selectedTime, timeSlots]);

  const handleConfirmAppointment = async () => {
    if (!authToken) {
      setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }
    if (!selectedServiceObj) {
      setError('Vui lòng chọn dịch vụ trước khi xác nhận lịch hẹn.');
      return;
    }
    if (disabledSlots.has(selectedTime)) {
      setError('Khung giờ này đang bận, vui lòng chọn giờ khác.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode ? `/api/appointments/${initialData?.id}` : '/api/appointments';
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          customerName: customerQuery.trim() || 'Khách đặt lịch',
          customerPhone: '',
          serviceName: selectedServiceObj.name,
          serviceId: String(selectedServiceObj.id),
          stylistName: selectedStylistObj?.name || 'Bất kỳ',
          stylistId: selectedStylist === 'any' ? '' : selectedStylist,
          date: selectedDateKey,
          time: selectedTime,
          durationMinutes: Number((selectedServiceObj.duration || '').match(/\d+/)?.[0] || 60),
          notes: notes.trim(),
          smsReminder,
          status: initialData?.status || 'confirmed',
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || (isEditMode ? 'Không thể cập nhật lịch hẹn.' : 'Không thể đặt lịch hẹn.'));
      }
      window.dispatchEvent(new Event('appointments:changed'));
      onSaved?.();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      const message = e instanceof Error ? e.message : (isEditMode ? 'Không thể cập nhật lịch hẹn.' : 'Không thể đặt lịch hẹn.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-10 pb-6 flex justify-between items-center">
          <h2 className="text-3xl font-serif text-primary">{isEditMode ? 'Chỉnh Sửa Lịch Hẹn' : 'Đặt Lịch Hẹn Mới'}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-10">
          {/* Customer Search */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">KHÁCH HÀNG</label>
              <button className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus size={12} /> Tạo khách mới nhanh
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Tìm theo tên hoặc số điện thoại..." 
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Service Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">DỊCH VỤ</label>
              <div className="space-y-3">
                {services.length > 0 ? (
                  <div className="max-h-[23rem] overflow-y-auto pr-1 -mr-1 space-y-3 scroll-smooth [scrollbar-width:thin]">
                    {services.map((s) => (
                      <div
                        key={String(s.id)}
                        onClick={() => setSelectedService(String(s.id))}
                        className={cn(
                          'p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center group shrink-0',
                          String(selectedService) === String(s.id)
                            ? 'border-primary bg-primary/[0.02]'
                            : 'border-stone-50 bg-stone-50 hover:border-stone-200'
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-primary mb-1">{s.name}</p>
                          <p className="text-[11px] text-stone-400">
                            {s.duration} • {s.price}₫
                          </p>
                        </div>
                        {String(selectedService) === String(s.id) ? (
                          <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white">
                            <CheckCircle2 size={14} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-stone-200 rounded-full flex items-center justify-center text-stone-300 group-hover:border-stone-400">
                            <Plus size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">Chưa có dịch vụ trong hệ thống.</p>
                )}
                <button className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-[11px] font-bold text-stone-400 uppercase tracking-widest hover:border-stone-400 hover:text-stone-600 transition-all">
                  + Thêm dịch vụ khác
                </button>
              </div>
            </div>

            {/* Stylist Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">CHUYÊN VIÊN</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ...employees.map((e) => ({
                    id: String(e.id),
                    name: e.name,
                    role: e.role || 'STAFF',
                    avatar: e.avatar || '',
                    icon: null as any,
                  })),
                  { id: 'any', name: 'Bất kỳ', role: 'TÙY CHỌN', avatar: '', icon: <Users size={18} /> },
                ].map((st) => (
                  <div 
                    key={st.id}
                    onClick={() => setSelectedStylist(st.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3",
                      selectedStylist === st.id ? "border-primary bg-primary/[0.02]" : "border-stone-50 bg-stone-50 hover:border-stone-200"
                    )}
                  >
                    {st.avatar ? (
                      <img src={st.avatar} alt={st.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-stone-200 rounded-xl flex items-center justify-center text-stone-500">
                        {st.icon}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-primary leading-tight">{st.name}</p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{st.role}</p>
                    </div>
                  </div>
                ))}
                {!employees.length && (
                  <p className="text-sm text-stone-400 col-span-2">Chưa có nhân viên trong hệ thống.</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">THỜI GIAN</label>
            <div className="flex gap-8">
              {/* Mini Calendar */}
              <div className="bg-stone-50 p-6 rounded-2xl w-64">
                <div className="flex justify-between items-center mb-4">
                  <h6 className="text-xs font-bold text-primary">{currentMonthYear}</h6>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-1 text-stone-400 hover:text-stone-600"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-1 text-stone-400 hover:text-stone-600"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-[9px] font-bold text-stone-400 mb-3">
                  <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center text-[11px]">
                  {calendarDays.map((day, i) => {
                    const isInCurrentMonth = day.getMonth() === viewMonthDate.getMonth();
                    const isSelected =
                      day.getDate() === selectedDate.getDate() &&
                      day.getMonth() === selectedDate.getMonth() &&
                      day.getFullYear() === selectedDate.getFullYear();
                    const isDateDisabled = isPastDate(day);
                    return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (isDateDisabled) return;
                        setSelectedDate(day);
                        if (!isInCurrentMonth) {
                          setViewMonthDate(new Date(day.getFullYear(), day.getMonth(), 1));
                        }
                      }}
                      disabled={isDateDisabled}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg mx-auto transition-all",
                        isSelected ? "bg-primary text-white shadow-md" : "hover:bg-stone-200",
                        isInCurrentMonth ? "text-stone-700" : "text-stone-300",
                        isDateDisabled && "opacity-35 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {day.getDate()}
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex-1 grid grid-cols-4 gap-3">
                {timeSlots.map((t) => (
                  (() => {
                    const isDisabled = disabledSlots.has(t);
                    return (
                  <button 
                    key={t}
                    onClick={() => !isDisabled && setSelectedTime(t)}
                    disabled={isDisabled}
                    className={cn(
                      "py-3.5 rounded-xl text-sm font-bold transition-all border-2",
                      selectedTime === t 
                        ? "bg-primary text-white border-primary shadow-md" 
                        : (isDisabled ? "bg-stone-100 text-stone-300 border-stone-100 cursor-not-allowed" : "bg-white text-stone-700 border-stone-50 hover:border-stone-200")
                    )}
                  >
                    {t}
                  </button>
                    );
                  })()
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Notes */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">GHI CHÚ ĐẶC BIỆT</label>
              <textarea 
                placeholder="Yêu cầu riêng của khách, công thức màu nhuộm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-sm h-24 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Reminders */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">THÔNG BÁO NHẮC NHỞ</label>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-all cursor-pointer",
                      smsReminder ? "bg-primary" : "bg-stone-300"
                    )} onClick={() => setSmsReminder(!smsReminder)}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        smsReminder ? "left-6" : "left-1"
                      )} />
                    </div>
                    <span className="text-xs font-bold text-stone-700">Gửi SMS nhắc trước 2 giờ</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-5 bg-stone-300 rounded-full relative cursor-not-allowed">
                      <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-stone-400">Gửi Zalo nhắc trước 1 ngày</span>
                  </div>
                  <span className="text-[9px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-10 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG THỜI GIAN</p>
              <p className="text-sm font-bold text-primary">{selectedServiceObj?.duration || '—'}</p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỔNG CHI PHÍ</p>
              <p className="text-sm font-bold text-secondary">{selectedServiceObj?.price ? `${selectedServiceObj.price}₫` : '—'}</p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LỊCH ĐẶT</p>
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Calendar size={14} />
                {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                <Clock size={14} className="ml-2" />
                {selectedTime}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-4 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmAppointment}
              disabled={isSubmitting}
              className={cn(
                "px-10 py-4 rounded-2xl text-sm font-bold shadow-xl transition-all active:scale-95",
                isSubmitting ? "bg-stone-300 text-stone-600 cursor-not-allowed shadow-none" : "bg-primary text-white hover:bg-primary-light"
              )}
            >
              {isSubmitting ? (isEditMode ? 'Đang cập nhật...' : 'Đang xác nhận...') : (isEditMode ? 'Lưu thay đổi' : 'Xác nhận đặt lịch')}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-10 pb-8 -mt-6">
            <p className="text-xs font-bold text-red-500">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 50, y: -40 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-8 right-8 bg-white shadow-2xl rounded-2xl p-6 flex items-center gap-4 border border-green-100 z-[210]"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Thành công</p>
                <p className="text-xs text-stone-500">{isEditMode ? 'Đã cập nhật lịch hẹn thành công.' : 'Đã xác nhận đặt lịch hẹn thành công.'}</p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="ml-4 text-stone-300 hover:text-stone-500">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
