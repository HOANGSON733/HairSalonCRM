import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, ChevronDown, CheckCircle2, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { prepareImageFromFile } from '../../lib/imageUpload';

interface NewEmployeeModalProps {
  onClose: () => void;
  initialData?: {
    name: string;
    phone: string;
    email: string;
    role: string;
    commissionRate: number;
    specialties: string[];
    birthday?: string;
    startDate: string;
    defaultShift: string;
    avatar?: string;
    status?: string;
  };
  saveLabel?: string;
  title?: string;
  description?: string;
  onSave: (payload: {
    name: string;
    phone: string;
    email: string;
    role: string;
    commissionRate: number;
    specialties: string[];
    birthday?: string;
    startDate: string;
    defaultShift: string;
    avatar?: string;
    status?: string;
  }) => Promise<void>;
}

export function NewEmployeeModal({
  onClose,
  onSave,
  initialData,
  saveLabel = 'Lưu nhân viên',
  title = 'Thêm Nhân Viên Mới',
  description = 'Chào mừng thành viên mới gia nhập không gian nghệ thuật Atelier Salon. Hãy hoàn tất hồ sơ để bắt đầu hành trình sáng tạo.',
}: NewEmployeeModalProps) {
  const [specialties, setSpecialties] = useState(initialData?.specialties?.length ? initialData.specialties : ['Cắt tóc', 'Nhuộm']);
  const availableSpecialties = ['Uốn', 'Duỗi', 'Phục hồi'];
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState(initialData?.role || 'Senior Stylist');
  const [commissionRate, setCommissionRate] = useState(String(initialData?.commissionRate ?? 15));
  const [birthday, setBirthday] = useState(initialData?.birthday || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [defaultShift, setDefaultShift] = useState(initialData?.defaultShift || 'Ca Sáng (08:00 - 16:00)');
  const [avatar, setAvatar] = useState<string | undefined>(initialData?.avatar || undefined);
  const [status, setStatus] = useState(initialData?.status || 'available');
  const [avatarName, setAvatarName] = useState(initialData?.avatar ? 'Ảnh hiện tại' : '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSpecialty = (spec: string) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    setErrorMessage('');
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        commissionRate: Number(commissionRate || 0),
        specialties,
        birthday,
        startDate,
        defaultShift,
        avatar,
        status,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu nhân viên.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    prepareImageFromFile(file)
      .then((nextImage) => {
      setAvatar(nextImage);
      setAvatarName(file.name);
      setErrorMessage('');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Khong the tai anh.';
        setErrorMessage(message);
      })
      .finally(() => {
        e.currentTarget.value = '';
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex max-h-[90vh]"
      >
        {/* Left Side - Info */}
        <div className="w-2/5 bg-primary p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl font-serif leading-tight">{title}</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={handleChooseAvatar}
              className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center group cursor-pointer hover:bg-white/20 transition-all overflow-hidden"
            >
              {avatar ? (
                <img src={avatar} alt="Employee avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Tải ảnh lên</p>
                </div>
              )}
            </div>
            {avatarName && (
              <p className="text-[10px] font-bold text-white/70 tracking-wide truncate max-w-[220px]">{avatarName}</p>
            )}
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Kích thước khuyên dùng: 500x500px</p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-10 space-y-6 overflow-y-auto">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">HỌ VÀ TÊN</label>
              <input 
                type="text" 
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">SỐ ĐIỆN THOẠI</label>
              <input 
                type="text" 
                placeholder="0901 234 567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">EMAIL LIÊN HỆ</label>
              <input 
                type="email" 
                placeholder="artist@atelier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NGÀY SINH</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input 
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">CẤP BẬC (ROLE)</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option>Senior Stylist</option>
                  <option>Master Stylist</option>
                  <option>Junior Artist</option>
                  <option>Barber</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỶ LỆ HOA HỒNG (%)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">CHUYÊN MÔN</label>
            <div className="flex flex-wrap gap-3">
              {specialties.map((spec) => (
                <button 
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className="px-5 py-2 bg-secondary/10 text-secondary rounded-full text-xs font-bold flex items-center gap-2 border border-secondary/20"
                >
                  {spec} <X size={14} />
                </button>
              ))}
              {availableSpecialties.map((spec) => (
                <button 
                  key={spec}
                  onClick={() => toggleSpecialty(spec)}
                  className="px-5 py-2 bg-stone-50 text-stone-400 rounded-full text-xs font-bold flex items-center gap-2 border border-stone-100 hover:bg-stone-100 transition-colors"
                >
                  <Plus size={14} /> {spec}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NGÀY BẮT ĐẦU</label>
              <div className="relative">
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">CA MẶC ĐỊNH</label>
              <div className="relative">
                <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <select
                  value={defaultShift}
                  onChange={(e) => setDefaultShift(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option>Ca Sáng (08:00 - 16:00)</option>
                  <option>Ca Chiều (14:00 - 22:00)</option>
                  <option>Ca Gãy (Linh hoạt)</option>
                </select>
              </div>
            </div>
          </div>

          {initialData && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÌNH TRẠNG LÀM VIỆC</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="available">Đang làm việc (Rảnh)</option>
                  <option value="busy">Đang phục vụ khách (Bận)</option>
                  <option value="on-leave">Tạm nghỉ (Phép)</option>
                  <option value="terminated">Đã nghỉ việc</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-6 pt-6">
            <button 
              onClick={onClose}
              className="text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-white px-10 py-5 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-2xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-60"
            >
              <CheckCircle2 size={20} />
              {isSaving ? 'Đang lưu...' : saveLabel}
            </button>
          </div>
          {errorMessage && <p className="text-xs font-bold text-red-500">{errorMessage}</p>}
        </div>
      </motion.div>
    </div>
  );
}
