import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Gift, 
  Star, 
  Bell, 
  Send, 
  Calendar, 
  Tag, 
  Plus, 
  ChevronDown, 
  Search, 
  MessageSquare, 
  Cake, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface MarketingViewProps {
  key?: string;
  onNewPromoCode?: () => void;
  authToken: string | null;
  customersCount?: number;
}

export function MarketingView({ onNewPromoCode, customersCount = 0 }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState('sms');

  const tiers = [
    { name: 'ĐỒNG', range: '0 - 5.000đ', color: 'bg-stone-100 text-stone-500', icon: '🥉' },
    { name: 'BẠC', range: '5tr - 20tr', color: 'bg-blue-50 text-blue-500', icon: '🥈' },
    { name: 'VÀNG', range: '20tr - 50tr', color: 'bg-amber-50 text-amber-500', icon: '🥇' },
    { name: 'VIP', range: 'Trên 50tr', color: 'bg-[#5c1a21] text-white', icon: '⭐' },
  ];

  const reminders = [
    { id: 1, title: 'Chúc mừng sinh nhật', desc: 'Tặng voucher 20% tự động', icon: <Cake size={18} />, active: true },
    { id: 2, title: 'Yêu cầu đánh giá', desc: 'Gửi sau 2h kết thúc dịch vụ', icon: <Star size={18} />, active: true },
    { id: 3, title: 'Nhắc đặt lịch lại', desc: 'Nhắc sau 30 ngày im lặng', icon: <Calendar size={18} />, active: false },
  ];

  const promoCodes: Array<{ code: string; discount: string; status: string; expiry: string; usage: string; color: string }> = [];

  return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <h1 className="text-5xl font-serif text-primary leading-tight">
            Tiếp thị & <br /> Lòng trung thành
          </h1>
          <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
            Kiến tạo những trải nghiệm đặc quyền dành riêng cho khách hàng của bạn thông qua các chương trình hội viên và chiến dịch cá nhân hóa.
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-serif text-primary">{customersCount.toLocaleString('vi-VN')}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">THÀNH VIÊN TÍCH CỰC</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-8 space-y-8">
          {/* Member Tiers */}
          <div className="bg-stone-50/50 rounded-[2.5rem] p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif text-primary">Phân hạng hội viên</h3>
              <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">CHỈNH SỬA MỨC</button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <div 
                  key={tier.name}
                  className={cn(
                    "p-6 rounded-3xl flex flex-col items-center justify-center space-y-3 transition-all hover:scale-105 cursor-pointer shadow-sm",
                    tier.color
                  )}
                >
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{tier.name}</p>
                    <p className="text-[10px] opacity-60 mt-1">{tier.range}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TỶ LỆ TÍCH ĐIỂM</span>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-primary">1 điểm /</span>
                  <span className="text-sm font-bold text-primary">1.000đ</span>
                </div>
              </div>
              <button className="flex items-center gap-3 bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-amber-100 transition-all">
                <Gift size={16} />
                <span>8 Phần thưởng đang khả dụng</span>
              </button>
            </div>
          </div>

          {/* Marketing Campaign */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm space-y-8 border border-stone-100">
            <h3 className="text-xl font-serif text-primary">Chiến dịch Marketing mới</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">ĐỐI TƯỢNG KHÁCH HÀNG</label>
                <div className="relative">
                  <select className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary appearance-none cursor-pointer focus:ring-2 ring-primary/5 outline-none">
                    <option>Khách hàng chưa quay lại trong 30 ngày</option>
                    <option>Khách hàng VIP chi tiêu cao</option>
                    <option>Khách hàng mới trong tháng</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NỘI DUNG THÔNG ĐIỆP</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveTab('sms')}
                      className={cn("text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'sms' ? "text-primary" : "text-stone-300")}
                    >
                      SMS
                    </button>
                    <button 
                      onClick={() => setActiveTab('email')}
                      className={cn("text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'email' ? "text-primary" : "text-stone-300")}
                    >
                      EMAIL
                    </button>
                  </div>
                </div>
                <textarea 
                  className="w-full bg-stone-50 border-none rounded-[2rem] p-8 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none min-h-[150px] resize-none"
                  placeholder="Chào [Tên Khách], chúng tôi rất nhớ bạn tại Atelier..."
                />
              </div>

              <div className="flex items-end gap-6">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">LỊCH GỬI</label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-primary focus:ring-2 ring-primary/5 outline-none"
                    />
                  </div>
                </div>
                <button className="px-8 py-4 bg-stone-100 text-primary rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all">
                  Xem trước
                </button>
                <button className="px-10 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-primary-light transition-all flex items-center gap-2">
                  <Send size={16} />
                  Lên lịch gửi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-8">
          {/* Automatic Reminders */}
          <div className="bg-stone-50/50 rounded-[2.5rem] p-10 space-y-8">
            <h3 className="text-xl font-serif text-primary">Nhắc nhở tự động</h3>
            <div className="space-y-6">
              {reminders.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">{item.title}</p>
                    <p className="text-[10px] text-stone-400 font-medium">{item.desc}</p>
                  </div>
                  <button className={cn(
                    "w-12 h-6 rounded-full p-1 transition-all relative",
                    item.active ? "bg-primary" : "bg-stone-200"
                  )}>
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                      item.active ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Codes */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif text-primary">Mã khuyến mãi</h3>
              <button 
                onClick={onNewPromoCode}
                className="w-8 h-8 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              {promoCodes.map((promo) => (
                <div key={promo.code} className={cn("bg-white p-6 rounded-[2rem] shadow-sm border-l-4 space-y-4 relative overflow-hidden", promo.color)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{promo.status}</span>
                      <h4 className="text-lg font-bold text-primary mt-1">{promo.code}</h4>
                    </div>
                    <span className="text-2xl font-serif text-primary">{promo.discount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">HẾT HẠN</p>
                      <p className="text-[10px] font-bold text-primary">{promo.expiry}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">ĐÃ DÙNG</p>
                      <p className="text-[10px] font-bold text-primary">{promo.usage}</p>
                    </div>
                  </div>
                  {/* Ticket notch effect */}
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-stone-50 rounded-full -translate-y-1/2" />
                </div>
              ))}
              {!promoCodes.length && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 text-sm text-stone-400">
                  Chưa có mã khuyến mãi nào (đang chờ kết nối dữ liệu thật).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Reward Banner */}
      <div className="relative h-[300px] rounded-[3rem] overflow-hidden group cursor-pointer">
        <img 
          src="https://images.unsplash.com/photo-1522337660859-02fbefce4f40?auto=format&fit=crop&q=80&w=2000" 
          alt="Hair Treatment"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#5c1a21]/90 via-[#5c1a21]/40 to-transparent" />
        
        <div className="absolute inset-0 p-16 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.3em]">PHẦN THƯỞNG NỔI BẬT</p>
            <h2 className="text-4xl font-serif text-white leading-tight max-w-md">
              Trị liệu tóc chuyên sâu bằng tinh dầu Silk-Velvet
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-amber-400">
              <Star size={20} fill="currentColor" />
              <span className="text-xl font-bold">500 Điểm</span>
            </div>
            <button className="bg-white text-primary px-8 py-4 rounded-2xl text-sm font-bold shadow-xl hover:bg-stone-50 transition-all flex items-center gap-2">
              Cấu hình đổi thưởng
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-8 border-t border-stone-100">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">THE EDITORIAL ATELIER © 2024</p>
        <div className="flex gap-8">
          <button className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-primary transition-colors">ĐIỀU KHOẢN DỊCH VỤ</button>
          <button className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-primary transition-colors">BẢO MẬT DỮ LIỆU</button>
        </div>
      </div>
    </div>
  );
}
