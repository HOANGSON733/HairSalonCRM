import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'confirmed':
      return (
        <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-100">
          Đã xác nhận
        </span>
      );
    case 'in-progress':
      return (
        <span className="px-3 py-1 bg-secondary-light/20 text-secondary text-[10px] font-bold uppercase rounded-full border border-secondary/20">
          Đang thực hiện
        </span>
      );
    case 'completed':
      return (
        <span className="px-3 py-1 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase rounded-full border border-stone-200">
          Hoàn thành
        </span>
      );
    default:
      return null;
  }
}
