import React from 'react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group",
        active 
          ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md scale-[1.02]" 
          : "text-stone-500 hover:bg-stone-200/50"
      )}
    >
      <span className={cn("transition-colors", active ? "text-white" : "text-stone-400 group-hover:text-primary")}>
        {icon}
      </span>
      <span className="tracking-tight text-[13px] font-medium">{label}</span>
    </button>
  );
}
