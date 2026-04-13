import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle, PauseCircle, UserMinus, Calendar, ChevronDown, CalendarX, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Employee } from '../../types';

interface TerminateEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onConfirm: (payload: { type: 'temporary' | 'permanent'; effectiveDate: string; reason: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TerminateEmployeeModal({ employee, onClose, onConfirm, onDelete }: TerminateEmployeeModalProps) {
  const [leaveType, setLeaveType] = useState<'temporary' | 'permanent'>('temporary');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Lý do cá nhân');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (!effectiveDate) {
      setErrorMessage('Vui lòng chọn ngày hiệu lực.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await onConfirm({
        type: leaveType,
        effectiveDate,
        reason,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái nhân viên.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting || isDeleting) return;

    setErrorMessage('');
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa nhân viên.';
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">CẢNH BÁO NHÂN SỰ</span>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-primary">Xác nhận nghỉ việc</h2>
            <p className="text-stone-500 text-sm">
              Bạn đang thực hiện thao tác thay đổi trạng thái hoạt động cho <span className="font-bold text-primary">{employee.name}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setLeaveType('temporary')}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative",
                leaveType === 'temporary' ? "border-primary bg-primary/[0.02]" : "border-stone-100 hover:border-stone-200"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-primary">
                  <PauseCircle size={20} />
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  leaveType === 'temporary' ? "border-primary" : "border-stone-200"
                )}>
                  {leaveType === 'temporary' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                </div>
              </div>
              <p className="text-sm font-bold text-primary mb-1">Tạm nghỉ</p>
              <p className="text-[10px] text-stone-400 font-medium">Nghỉ phép, thai sản, ốm...</p>
            </button>

            <button 
              onClick={() => setLeaveType('permanent')}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative",
                leaveType === 'permanent' ? "border-red-600 bg-red-50/30" : "border-stone-100 hover:border-stone-200"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                  <UserMinus size={20} />
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  leaveType === 'permanent' ? "border-red-600" : "border-stone-200"
                )}>
                  {leaveType === 'permanent' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
                </div>
              </div>
              <p className="text-sm font-bold text-primary mb-1">Nghỉ việc hoàn toàn</p>
              <p className="text-[10px] text-stone-400 font-medium">Thôi việc, chấm dứt HĐ</p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NGÀY HIỆU LỰC</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input 
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LÝ DO CHÍNH</label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option>Lý do cá nhân</option>
                  <option>Chuyển công tác</option>
                  <option>Vi phạm kỷ luật</option>
                  <option>Hết hạn hợp đồng</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-5 rounded-2xl flex gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <CalendarX size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-600">Ảnh hưởng lịch hẹn</p>
              <p className="text-[11px] text-red-600/70 leading-relaxed">
                Phát hiện <span className="font-bold">12 lịch hẹn</span> đã đặt trước trong thời gian này. Hệ thống cần xử lý các lịch hẹn này để tránh gián đoạn dịch vụ khách hàng.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
              <CheckCircle2 size={14} className="text-white" />
            </div>
            <span className="text-xs font-medium text-stone-600">Tự động phân công lại cho nhân viên có lịch trống cùng cấp bậc</span>
          </label>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button 
              onClick={handleConfirm}
              disabled={isSubmitting || isDeleting}
              className="w-full bg-primary text-white py-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 shadow-2xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận cập nhật'} <ChevronDown size={18} className="-rotate-90" />
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSubmitting || isDeleting}
              className="w-full bg-red-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-60"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa nhân viên vĩnh viễn'}
            </button>
            <button 
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>

          <p className="text-center text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">HỆ THỐNG QUẢN LÝ ATELIER LUXURY SALON & SPA</p>
          {errorMessage && <p className="text-center text-xs font-bold text-red-500">{errorMessage}</p>}
        </div>
      </motion.div>

      {isDeleteConfirmOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Xác nhận xóa</p>
              <h3 className="text-2xl font-serif text-primary">Bạn chắc chắn muốn xóa nhân viên này?</h3>
              <p className="text-sm text-stone-500">
                Sau khi xóa, hồ sơ của <span className="font-bold text-primary">{employee.name}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 text-sm font-bold hover:bg-stone-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
