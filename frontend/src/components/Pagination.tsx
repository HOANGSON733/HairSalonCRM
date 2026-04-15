import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  itemLabel?: string;
  visibleCount?: number;
  onPageChange?: (nextPage: number) => void;
  compact?: boolean;
}

export function Pagination({
  page,
  totalPages,
  total,
  itemLabel = 'mục',
  visibleCount,
  onPageChange,
  compact = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const pageStart = Math.max(1, page - 1);
  const pageEnd = Math.min(safeTotalPages, pageStart + 2);
  const visiblePages = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
          Hiển thị {visibleCount ?? 0} / {typeof total === 'number' ? `${total} ${itemLabel}` : `${safeTotalPages} trang`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-10 w-10 rounded-xl border border-stone-200 bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center justify-center"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="px-4 h-10 rounded-xl bg-stone-100 text-xs font-bold text-stone-600 flex items-center">
            Trang {page} / {safeTotalPages}
          </div>

          <button
            onClick={() => onPageChange?.(Math.min(safeTotalPages, page + 1))}
            disabled={page >= safeTotalPages}
            className="h-10 w-10 rounded-xl border border-stone-200 bg-white text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors flex items-center justify-center"
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center pt-8 border-t border-stone-100">
      <p className="text-xs font-medium text-stone-400">
        Hiển thị {visibleCount ?? 0} trên trang {page} / {safeTotalPages}
        {typeof total === 'number' ? ` - tổng ${total} ${itemLabel}` : ''}
      </p>
      <div className="flex items-center gap-3">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        {visiblePages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange?.(p)}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold transition-all',
              p === page
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white border border-stone-100 text-stone-500 hover:bg-stone-50'
            )}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange?.(Math.min(safeTotalPages, page + 1))}
          className="w-11 h-11 rounded-2xl border border-stone-100 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
