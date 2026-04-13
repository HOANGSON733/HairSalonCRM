import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteCustomerModalProps {
  customer: any;
  onClose: () => void;
}

export function DeleteCustomerModal({ customer, onClose }: DeleteCustomerModalProps) {
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
        className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle size={40} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-serif text-primary">Xóa khách hàng?</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Hành động này <span className="text-red-600 font-bold">KHÔNG THỂ HOÀN TÁC</span>. Toàn bộ lịch sử đặt lịch và điểm tích lũy của khách hàng sẽ bị xóa vĩnh viễn.
            </p>
          </div>

          <div className="bg-stone-50 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400 font-medium">Tổng số giao dịch:</span>
              <span className="text-primary font-bold">42 giao dịch</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400 font-medium">Số điểm tích lũy:</span>
              <span className="text-primary font-bold">1.240 điểm</span>
            </div>
          </div>

          <p className="text-xs text-stone-400">
            Khách hàng: <span className="font-bold text-primary">{customer?.name || 'N/A'}</span>
          </p>
        </div>

        <div className="flex border-t border-stone-100">
          <button 
            onClick={onClose}
            className="flex-1 py-6 text-sm font-bold text-stone-400 hover:bg-stone-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-6 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-700"
          >
            <Trash2 size={18} />
            Xác nhận xóa
          </button>
        </div>
      </motion.div>
    </div>
  );
}
