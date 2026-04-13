import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Heart, 
  BarChart3, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoginViewProps {
  onLogin: (token: string) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const normalizedAccount = account.trim().toLowerCase();
    if (!normalizedAccount || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: normalizedAccount, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        return;
      }

      const data = await response.json();
      if (!data?.token) {
        setErrorMessage('Thiếu token đăng nhập từ máy chủ.');
        return;
      }

      setErrorMessage('');
      onLogin(data.token);
    } catch (_error) {
      setErrorMessage('Không kết nối được máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Calendar className="text-amber-500" size={24} />,
      title: "Quản lý lịch hẹn thông minh",
      desc: "Tối ưu hóa thời gian phục vụ và giảm thiểu thời gian chờ đợi của khách hàng."
    },
    {
      icon: <Heart className="text-amber-500" size={24} />,
      title: "Chăm sóc khách hàng toàn diện",
      desc: "Lưu trữ lịch sử dịch vụ, công thức nhuộm và sở thích cá nhân từng khách hàng."
    },
    {
      icon: <BarChart3 className="text-amber-500" size={24} />,
      title: "Báo cáo doanh thu tức thì",
      desc: "Hệ thống phân tích dữ liệu kinh doanh minh bạch, cập nhật theo thời gian thực."
    }
  ];

  return (
    <div className="fixed inset-0 flex bg-[#fdfcfb]">
      {/* Left Side: Branding & Features */}
      <div className="hidden lg:flex w-[45%] bg-[#4a0e0e] relative overflow-hidden flex-col p-20 justify-between">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000")' }}
        />
        
        <div className="relative z-10 space-y-12">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#4a0e0e] text-3xl font-serif font-bold shadow-2xl">
              C
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-serif text-white tracking-wide">Hair Salon Chính</h1>
              <p className="text-amber-500 italic text-lg font-serif">Vẻ đẹp hoàn hảo — Trải nghiệm đẳng cấp</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-10 pt-10">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">{f.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 HAIR SALON CHÍNH CRM — ALL RIGHTS RESERVED
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-serif text-primary">Chào mừng trở lại</h2>
              <span className="text-3xl">👋</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-serif text-primary font-bold">Đăng nhập</h3>
              <p className="text-stone-400 text-sm">Nhập thông tin để truy cập hệ thống quản lý</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-8" onSubmit={handleLogin}>
            <div className="space-y-6">
              {/* Account */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÀI KHOẢN</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Nhập SĐT hoặc email..."
                    value={account}
                    onChange={(e) => {
                      setAccount(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full bg-stone-100/50 border-none rounded-2xl py-5 pl-16 pr-6 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">MẬT KHẨU</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full bg-stone-100/50 border-none rounded-2xl py-5 pl-16 pr-16 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                    rememberMe ? "bg-primary border-primary" : "border-stone-200 group-hover:border-stone-300"
                  )}
                >
                  {rememberMe && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <span className="text-xs font-bold text-stone-500">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                Quên mật khẩu?
              </button>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4a0e0e] text-white py-6 rounded-2xl text-sm font-bold shadow-2xl hover:bg-[#5a1e1e] transition-all uppercase tracking-widest active:scale-[0.98]"
            >
              {isSubmitting ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}
            </button>
            {errorMessage && (
              <p className="text-xs font-bold text-red-500 text-center">{errorMessage}</p>
            )}
          </form>

        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center text-[10px] font-bold text-stone-300 uppercase tracking-widest">
          <p>PHIÊN BẢN 2.4.1</p>
          <div className="flex items-center gap-2">
            <HelpCircle size={12} />
            LIÊN HỆ IT: <span className="text-stone-400">0334 563 798</span>
          </div>
        </div>
      </div>
    </div>
  );
}
