import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { prepareImageFromFile } from '../../lib/imageUpload';
import { CUSTOMER_SOURCES, DEFAULT_CUSTOMER_SOURCE } from '../../lib/customerSources';
import {
  CustomerSourceIcon,
  DEFAULT_CUSTOMER_SOURCE_ICON,
  normalizeCustomerSourceIcon,
} from '../../lib/customerSourceIcons';
import { Employee } from '../../types';

interface NewCustomerModalProps {
  authToken?: string | null;
  onClose: () => void;
  employees: Employee[];
  onSave: (payload: {
    name: string;
    phone: string;
    email: string;
    birthday: string;
    gender: string;
    assignedEmployee: string;
    source: string;
    notes: string;
    avatar?: string;
  }) => Promise<void>;
  title?: string;
  saveLabel?: string;
  initialData?: {
    name?: string;
    phone?: string;
    email?: string;
    birthday?: string;
    gender?: string;
    assignedEmployee?: string;
    source?: string;
    notes?: string;
    avatar?: string;
  };
}

export function NewCustomerModal({
  authToken = null,
  onClose,
  onSave,
  employees,
  title = 'Thông tin khách hàng mới',
  saveLabel = 'Lưu hồ sơ khách hàng',
  initialData,
}: NewCustomerModalProps) {
  const [sourceOptions, setSourceOptions] = useState<Array<{ name: string; icon: string }>>(() =>
    [...CUSTOMER_SOURCES].map((name) => ({ name, icon: DEFAULT_CUSTOMER_SOURCE_ICON }))
  );
  const [selectedSource, setSelectedSource] = useState(initialData?.source || DEFAULT_CUSTOMER_SOURCE);
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [birthday, setBirthday] = useState(initialData?.birthday || '');
  const [gender, setGender] = useState(initialData?.gender || 'Nữ');
  const [assignedEmployee, setAssignedEmployee] = useState(initialData?.assignedEmployee || employees[0]?.name || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [avatar, setAvatar] = useState<string | undefined>(initialData?.avatar || undefined);
  const [avatarName, setAvatarName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSourceOptions = useCallback(() => {
    if (!authToken) {
      setSourceOptions([...CUSTOMER_SOURCES].map((name) => ({ name, icon: DEFAULT_CUSTOMER_SOURCE_ICON })));
      return;
    }
    fetch('/api/customer-sources', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.message || 'Không thể tải nguồn khách.');
        const rows = Array.isArray(data?.sources)
          ? data.sources
              .map((s: { name: string; icon?: string }) => ({
                name: String(s.name || '').trim(),
                icon: normalizeCustomerSourceIcon(s.icon),
              }))
              .filter((s) => s.name)
          : [];
        setSourceOptions(
          rows.length
            ? rows
            : [...CUSTOMER_SOURCES].map((name) => ({ name, icon: DEFAULT_CUSTOMER_SOURCE_ICON }))
        );
      })
      .catch(() =>
        setSourceOptions([...CUSTOMER_SOURCES].map((name) => ({ name, icon: DEFAULT_CUSTOMER_SOURCE_ICON })))
      );
  }, [authToken]);

  useEffect(() => {
    loadSourceOptions();
  }, [loadSourceOptions]);

  useEffect(() => {
    const onChanged = () => loadSourceOptions();
    window.addEventListener('customer-sources:changed', onChanged);
    return () => window.removeEventListener('customer-sources:changed', onChanged);
  }, [loadSourceOptions]);

  useEffect(() => {
    setSelectedSource((prev) =>
      sourceOptions.some((s) => s.name === prev) ? prev : sourceOptions[0]?.name || DEFAULT_CUSTOMER_SOURCE
    );
  }, [sourceOptions]);

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
        birthday,
        gender,
        assignedEmployee,
        source: selectedSource,
        notes: notes.trim(),
        avatar,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu khách hàng.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
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
        className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex h-[85vh]"
      >
        {/* Left Side: Branding & Image */}
        <div className="w-1/3 bg-primary relative overflow-hidden flex flex-col justify-between p-12 text-white">
          <div className="relative z-10">
            <h2 className="text-4xl font-serif mb-4 leading-tight">Gia nhập cộng đồng thượng lưu</h2>
            <p className="text-stone-300 text-sm leading-relaxed">Đăng ký thành viên để nhận ưu đãi đặc quyền và quản lý lịch sử làm đẹp chuyên nghiệp.</p>
          </div>
          
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://cdn0397.cdn4s.com/media/guong-salon-_-tiem-toc/e30cbd5e0f8a5a711a4480a0d9dbcea2.webp" 
              alt="Salon Interior" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="text-xl font-serif">A</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">CRM SYSTEM</p>
                <p className="text-xs font-bold">Bảo mật dữ liệu chuẩn quốc tế</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="p-10 pb-4 flex justify-between items-center">
            <h3 className="text-2xl font-serif text-primary">{title}</h3>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">HỌ VÀ TÊN *</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn Thảo My"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">SỐ ĐIỆN THOẠI *</label>
                <input 
                  type="tel" 
                  placeholder="09xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">EMAIL</label>
                <input 
                  type="email" 
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">NHÂN VIÊN PHỤ TRÁCH</label>
                <select
                  value={assignedEmployee}
                  onChange={(e) => setAssignedEmployee(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.name}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">NGÀY SINH</label>
                  <input 
                    type="date" 
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">GIỚI TÍNH</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                  >
                    <option>Nữ</option>
                    <option>Nam</option>
                    <option>Khác</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">NGUỒN BIẾT ĐẾN</label>
                  <div className="flex flex-wrap gap-2">
                    {sourceOptions.map((source) => (
                      <button 
                        key={source.name}
                        onClick={() => setSelectedSource(source.name)}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          selectedSource === source.name ? "bg-secondary text-white border-secondary shadow-md" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                        )}
                      >
                        <CustomerSourceIcon iconId={source.icon} size={14} className={selectedSource === source.name ? 'text-white' : 'text-stone-400'} />
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">GHI CHÚ ĐẶC BIỆT</label>
                  <textarea 
                    placeholder="Dị ứng hóa chất, thói quen làm tóc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm h-32 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">ẢNH ĐẠI DIỆN / MẪU TÓC</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={handleChooseAvatar}
                  className="border-2 border-dashed border-stone-200 rounded-[2rem] h-full min-h-[200px] flex flex-col items-center justify-center p-8 text-center group hover:border-primary/40 transition-all cursor-pointer bg-stone-50/50"
                >
                  {avatar ? (
                    <>
                      <img src={avatar} alt="Preview avatar" className="w-28 h-28 object-cover rounded-2xl shadow-md mb-3" />
                      <p className="text-xs font-bold text-primary mb-1">{avatarName || 'Ảnh đã chọn'}</p>
                      <p className="text-[10px] text-stone-400 font-medium">Nhấn để thay đổi ảnh</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-300 shadow-sm group-hover:scale-110 group-hover:text-primary transition-all mb-4">
                        <Upload size={28} />
                      </div>
                      <p className="text-sm font-bold text-stone-600 mb-1">Kéo thả ảnh vào đây</p>
                      <p className="text-[10px] text-stone-400 font-medium">Hoặc nhấn để chọn từ máy tính (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 bg-stone-50 border-t border-stone-100 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-12 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all active:scale-95 disabled:opacity-60"
            >
              {isSaving ? 'ĐANG LƯU...' : saveLabel}
            </button>
          </div>
          {errorMessage && (
            <div className="px-10 pb-8">
              <p className="text-xs font-bold text-red-500">{errorMessage}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
