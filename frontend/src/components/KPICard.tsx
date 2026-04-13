import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  trend?: string;
  subtitle?: string;
  rating?: boolean;
  color: string;
}

export function KPICard({ title, value, trend, subtitle, rating, color }: KPICardProps) {
  const borderColors: Record<string, string> = {
    primary: "border-primary",
    secondary: "border-secondary",
    stone: "border-stone-300",
    "secondary-light": "border-secondary-light"
  };

  return (
    <div className={cn(
      "bg-white p-6 rounded-xl border-l-4 shadow-sm border-stone-100",
      borderColors[color]
    )}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-4">{title}</p>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-serif text-primary">{value}</h3>
          {rating && <Star size={16} className="text-secondary fill-secondary" />}
        </div>
        {trend && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{trend}</span>
        )}
        {subtitle && (
          <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-1 rounded font-bold">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
