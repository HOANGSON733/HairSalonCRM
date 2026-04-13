import React from 'react';
import { motion } from 'motion/react';
import { X, Clock, Tag, Image as ImageIcon } from 'lucide-react';
import { Service } from '../../types';

interface ServiceDetailsModalProps {
  service: Service;
  onClose: () => void;
}

function getInitials(name: string) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'S';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase();
}

export function ServiceDetailsModal({ service, onClose }: ServiceDetailsModalProps) {
  const hasImage = Boolean(service.image && String(service.image).trim());
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{service.category}</p>
              <h2 className="text-3xl font-serif text-primary leading-tight">{service.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 rounded-[2rem] overflow-hidden bg-stone-100 relative">
              {hasImage ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!hasImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                  <ImageIcon size={22} />
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest">Không có ảnh</p>
                  <div className="mt-4 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-primary font-serif text-3xl shadow-sm">
                    {getInitials(service.name)}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Clock size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Thời lượng</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">{service.duration || '—'}</p>
                </div>
                <div className="bg-stone-50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Tag size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Giá</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {service.price ? `${service.price}₫` : '—'}
                  </p>
                  {service.maxPrice ? (
                    <p className="mt-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Tối đa: {service.maxPrice}₫
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="bg-white border border-stone-100 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Mô tả</p>
                <p className="mt-3 text-sm text-stone-600 leading-relaxed">{service.description || '—'}</p>
              </div>

              {Array.isArray(service.tags) && service.tags.length ? (
                <div className="bg-white border border-stone-100 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.tags.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

