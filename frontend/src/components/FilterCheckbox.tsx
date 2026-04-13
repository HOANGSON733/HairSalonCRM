import React from 'react';
import { cn } from '../lib/utils';

interface FilterCheckboxProps {
  label: string;
  checked?: boolean;
  color?: string;
}

export function FilterCheckbox({ label, checked, color }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
        checked ? (color ? `${color} border-transparent` : "bg-primary border-transparent") : "border-stone-200 group-hover:border-stone-400"
      )}>
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <span className={cn("text-xs font-medium", checked ? "text-stone-800" : "text-stone-400")}>{label}</span>
    </label>
  );
}
