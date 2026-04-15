import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Scissors, 
  Palette, 
  Sparkles, 
  Coffee, 
  Smile, 
  ChevronDown, 
  Sun, 
  Moon, 
  ShoppingBag, 
  Users, 
  Clock, 
  XCircle, 
  Share2,
  Check,
  UserPlus,
  FileText,
  History,
  Shield,
  BarChart3,
  X
} from 'lucide-react';
import { NewCategoryModal } from '../modals/NewCategoryModal';
import { EditServiceCategoryModal } from '../modals/EditServiceCategoryModal';
import { DeleteServiceCategoryModal } from '../modals/DeleteServiceCategoryModal';
import { DeleteCustomerSourceModal } from '../modals/DeleteCustomerSourceModal';
import { cn } from '../../lib/utils';
import {
  CUSTOMER_SOURCE_ICON_OPTIONS,
  CustomerSourceIcon,
  DEFAULT_CUSTOMER_SOURCE_ICON,
  normalizeCustomerSourceIcon,
} from '../../lib/customerSourceIcons';
import { Product, ProductCategoryConfig, Service, ServiceCategoryConfig } from '../../types';

interface SettingsViewProps {
  authToken?: string | null;
  services?: Service[];
  serviceCategories?: ServiceCategoryConfig[];
  onCreateCategory?: (payload: {
    name: string;
    selectedIcon: string;
    selectedColor: string;
    description: string;
    isVisible: boolean;
  }) => void | Promise<void>;
  onUpdateCategory?: (
    id: string | number,
    payload: {
      name: string;
      selectedIcon: string;
      selectedColor: string;
      description: string;
      isVisible: boolean;
    }
  ) => void | Promise<void>;
  onDeleteCategory?: (id: string | number, replacementCategoryName?: string) => void | Promise<void>;
  products?: Product[];
  productCategories?: ProductCategoryConfig[];
  onCreateProductCategory?: (payload: {
    name: string;
    selectedIcon: string;
    selectedColor: string;
    description: string;
    isVisible: boolean;
  }) => void | Promise<void>;
  onUpdateProductCategory?: (
    id: string | number,
    payload: {
      name: string;
      selectedIcon: string;
      selectedColor: string;
      description: string;
      isVisible: boolean;
    }
  ) => void | Promise<void>;
  onDeleteProductCategory?: (id: string | number, replacementCategoryName?: string) => void | Promise<void>;
}

const roles = [
  { 
    id: 1, 
    name: 'Stylist Cao Cấp', 
    roleId: 'ROLE #01', 
    commission: '15%', 
    staffCount: 8, 
    color: '#4a0e0e', 
    permissions: [
      { module: 'Lịch hẹn', actions: ['Xem', 'Thêm'] },
      { module: 'Khách hàng', actions: ['Xem', 'Sửa'] },
    ]
  },
  { 
    id: 2, 
    name: 'Kỹ Thuật Viên', 
    roleId: 'ROLE #02', 
    commission: '10%', 
    staffCount: 12, 
    color: '#c5a059', 
    permissions: [
      { module: 'Doanh thu', actions: ['Xem'] },
      { module: 'Kho hàng', actions: ['Xem'] },
    ]
  },
];

export function SettingsView({
  authToken = null,
  services = [],
  products = [],
  serviceCategories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  productCategories = [],
  onCreateProductCategory,
  onUpdateProductCategory,
  onDeleteProductCategory,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('Danh mục dịch vụ');
  const [activeSubTab, setActiveSubTab] = useState('Cấp bậc nhân viên');
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ServiceCategoryConfig | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategoryConfig | null>(null);
  const [isNewProductCategoryModalOpen, setIsNewProductCategoryModalOpen] = useState(false);
  const [productCategoryToEdit, setProductCategoryToEdit] = useState<ProductCategoryConfig | null>(null);
  const [productCategoryToDelete, setProductCategoryToDelete] = useState<ProductCategoryConfig | null>(null);

  const [customerSources, setCustomerSources] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesLoadError, setSourcesLoadError] = useState<string | null>(null);
  const [sourceEditorOpen, setSourceEditorOpen] = useState(false);
  const [sourceEditorId, setSourceEditorId] = useState<string | null>(null);
  const [sourceEditorName, setSourceEditorName] = useState('');
  const [sourceEditorIcon, setSourceEditorIcon] = useState(DEFAULT_CUSTOMER_SOURCE_ICON);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<{ id: string; name: string } | null>(null);

  const loadCustomerSources = useCallback(async () => {
    if (!authToken) {
      setCustomerSources([]);
      setSourcesLoadError('Cần đăng nhập để quản lý nguồn khách.');
      return;
    }
    setSourcesLoading(true);
    setSourcesLoadError(null);
    try {
      const response = await fetch('/api/customer-sources', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Không thể tải danh sách nguồn khách.');
      }
      const list = Array.isArray(data?.sources)
        ? data.sources.map((s: { id: string; name: string; icon?: string }) => ({
            id: String(s.id),
            name: String(s.name || ''),
            icon: normalizeCustomerSourceIcon(s.icon),
          }))
        : [];
      setCustomerSources(list);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải nguồn khách.';
      setSourcesLoadError(message);
      setCustomerSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadCustomerSources();
  }, [loadCustomerSources]);

  const openCreateSource = () => {
    setSourceEditorId(null);
    setSourceEditorName('');
    setSourceEditorIcon(DEFAULT_CUSTOMER_SOURCE_ICON);
    setSourceEditorOpen(true);
  };

  const openEditSource = (id: string, name: string, icon?: string) => {
    setSourceEditorId(id);
    setSourceEditorName(name);
    setSourceEditorIcon(normalizeCustomerSourceIcon(icon));
    setSourceEditorOpen(true);
  };

  const saveSourceEditor = async () => {
    if (!authToken) {
      alert('Phiên đăng nhập không hợp lệ.');
      return;
    }
    const name = sourceEditorName.trim();
    if (!name) {
      alert('Vui lòng nhập tên nguồn khách.');
      return;
    }
    setSourceSaving(true);
    try {
      const url = sourceEditorId ? `/api/customer-sources/${sourceEditorId}` : '/api/customer-sources';
      const method = sourceEditorId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, icon: sourceEditorIcon }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Không thể lưu nguồn khách.');
      }
      await loadCustomerSources();
      window.dispatchEvent(new Event('customer-sources:changed'));
      setSourceEditorOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể lưu nguồn khách.');
    } finally {
      setSourceSaving(false);
    }
  };

  const serviceCountByCategory = services.reduce<Record<string, number>>((acc, service) => {
    const key = String(service.category || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categories = serviceCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: serviceCountByCategory[category.name] || 0,
      status: category.isVisible === false ? 'Đang ẩn' : 'Đang hiện',
      color: category.color,
      icon: category.icon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const productCountByCategory = products.reduce<Record<string, number>>((acc, p) => {
    const key = String(p.category || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const productCategoriesView = productCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: productCountByCategory[category.name] || 0,
      status: category.isVisible === false ? 'Đang ẩn' : 'Đang hiện',
      color: category.color,
      icon: category.icon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const getCategoryMeta = (categoryName: string, color?: string, iconName?: string) => {
    if (color && iconName) {
      const iconNode =
        iconName === 'palette' ? <Palette size={20} /> :
        iconName === 'sparkles' ? <Sparkles size={20} /> :
        iconName === 'coffee' ? <Coffee size={20} /> :
        iconName === 'smile' ? <Smile size={20} /> :
        iconName === 'droplets' ? <Palette size={20} /> :
        <Scissors size={20} />;
      return { icon: iconNode, colorClass: '', inlineStyle: { backgroundColor: `${color}20`, color } as React.CSSProperties };
    }
    const name = categoryName.toLowerCase();
    if (name.includes('cắt') || name.includes('tạo kiểu')) {
      return { icon: <Scissors size={20} />, colorClass: 'bg-red-50 text-red-500', inlineStyle: undefined };
    }
    if (name.includes('nhuộm') || name.includes('màu') || name.includes('hóa')) {
      return { icon: <Palette size={20} />, colorClass: 'bg-amber-50 text-amber-500', inlineStyle: undefined };
    }
    if (name.includes('phục hồi') || name.includes('chăm sóc')) {
      return { icon: <Sparkles size={20} />, colorClass: 'bg-stone-100 text-stone-500', inlineStyle: undefined };
    }
    if (name.includes('gội')) {
      return { icon: <Coffee size={20} />, colorClass: 'bg-stone-100 text-stone-500', inlineStyle: undefined };
    }
    return { icon: <Smile size={20} />, colorClass: 'bg-stone-100 text-stone-500', inlineStyle: undefined };
  };

  const tabs = [
    'Danh mục dịch vụ', 'Danh mục sản phẩm', 'Cấp bậc nhân viên', 'Thợ mặc định', 
    'Nguồn khách', 'Lý do hủy', 'Thời lượng'
  ];

  type SalaryFormula = 'fixed_plus_commission' | 'commission_only';

  type StaffLevel = {
    id: number;
    name: string;
    serviceCommission: string;
    salaryFormula: SalaryFormula;
    fixedSalary: number;
    additions: string;
    deductions: string;
  };

  const STAFF_LEVELS_CHANGED_EVENT = 'staff-levels:changed';

  const defaultStaffLevels: StaffLevel[] = [
    {
      id: 1,
      name: 'Stylist Cao Cấp',
      serviceCommission: '15',
      salaryFormula: 'fixed_plus_commission',
      fixedSalary: 8000000,
      additions: '0',
      deductions: '0',
    },
    {
      id: 2,
      name: 'Kỹ Thuật Viên',
      serviceCommission: '10',
      salaryFormula: 'commission_only',
      fixedSalary: 0,
      additions: '0',
      deductions: '0',
    }
  ];

  const [staffLevels, setStaffLevels] = useState<StaffLevel[]>(defaultStaffLevels);
  const [isStaffLevelEditorOpen, setIsStaffLevelEditorOpen] = useState(false);
  const [staffLevelEditorId, setStaffLevelEditorId] = useState<number | null>(null);
  const [staffLevelName, setStaffLevelName] = useState('');
  const [staffLevelServiceCommission, setStaffLevelServiceCommission] = useState('');
  const [staffLevelSalaryFormula, setStaffLevelSalaryFormula] = useState<SalaryFormula>('fixed_plus_commission');
  const [staffLevelFixedSalary, setStaffLevelFixedSalary] = useState('0');
  const [staffLevelAdditions, setStaffLevelAdditions] = useState('0');
  const [staffLevelDeductions, setStaffLevelDeductions] = useState('0');
  const [staffLevelToDelete, setStaffLevelToDelete] = useState<StaffLevel | null>(null);

  useEffect(() => {
    const loadStaffLevels = async () => {
      if (!authToken) {
        setStaffLevels(defaultStaffLevels);
        return;
      }
      try {
        const response = await fetch('/api/staff-levels', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || 'Không thể tải cấp bậc nhân viên.');
        const parsed = Array.isArray(data?.staffLevels) ? data.staffLevels : [];
        if (!parsed.length) {
          setStaffLevels(defaultStaffLevels);
          return;
        }
        setStaffLevels(parsed.map((item, index) => ({
          id: Number(item?.id) || Number(`${Date.now()}${index}`),
          name: typeof item?.name === 'string' ? item.name : '',
          serviceCommission: typeof item?.serviceCommission === 'string' ? item.serviceCommission : '0',
          salaryFormula: item?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
          fixedSalary: Number(item?.fixedSalary || 0),
          additions: typeof item?.additions === 'string' ? item.additions : '0',
          deductions: typeof item?.deductions === 'string' ? item.deductions : '0',
        })));
      } catch {
        setStaffLevels(defaultStaffLevels);
      }
    };

    void loadStaffLevels();
  }, [authToken]);

  const openCreateStaffLevel = () => {
    setStaffLevelEditorId(null);
    setStaffLevelName('');
    setStaffLevelServiceCommission('0');
    setStaffLevelSalaryFormula('fixed_plus_commission');
    setStaffLevelFixedSalary('0');
    setStaffLevelAdditions('0');
    setStaffLevelDeductions('0');
    setIsStaffLevelEditorOpen(true);
  };

  const openEditStaffLevel = (level: StaffLevel) => {
    setStaffLevelEditorId(level.id);
    setStaffLevelName(level.name);
    setStaffLevelServiceCommission(level.serviceCommission);
    setStaffLevelSalaryFormula(level.salaryFormula || 'fixed_plus_commission');
    setStaffLevelFixedSalary(String(level.fixedSalary || 0));
    setStaffLevelAdditions(level.additions || '0');
    setStaffLevelDeductions(level.deductions || '0');
    setIsStaffLevelEditorOpen(true);
  };

  const saveStaffLevel = async () => {
    const name = staffLevelName.trim();
    if (!name) {
      alert('Vui lòng nhập tên cấp bậc.');
      return;
    }
    if (!authToken) {
      alert('Phiên đăng nhập không hợp lệ.');
      return;
    }

    const payload = {
      name,
      serviceCommission: String(Number(staffLevelServiceCommission || 0)),
      salaryFormula: staffLevelSalaryFormula,
      fixedSalary: staffLevelSalaryFormula === 'fixed_plus_commission' ? Number(staffLevelFixedSalary || 0) : 0,
      additions: String(Number(staffLevelAdditions || 0)),
      deductions: String(Number(staffLevelDeductions || 0)),
      isVisible: true,
    };

    const url = staffLevelEditorId ? `/api/staff-levels/${staffLevelEditorId}` : '/api/staff-levels';
    const method = staffLevelEditorId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      alert(data?.message || 'Không thể lưu cấp bậc.');
      return;
    }

    setIsStaffLevelEditorOpen(false);
    const refreshed = await fetch('/api/staff-levels', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const refreshedData = await refreshed.json().catch(() => null);
    if (refreshed.ok && Array.isArray(refreshedData?.staffLevels)) {
      setStaffLevels(refreshedData.staffLevels.map((item, index) => ({
        id: Number(item?.id) || Number(`${Date.now()}${index}`),
        name: typeof item?.name === 'string' ? item.name : '',
        serviceCommission: typeof item?.serviceCommission === 'string' ? item.serviceCommission : '0',
        salaryFormula: item?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
        fixedSalary: Number(item?.fixedSalary || 0),
        additions: typeof item?.additions === 'string' ? item.additions : '0',
        deductions: typeof item?.deductions === 'string' ? item.deductions : '0',
      })));
    }
  };

  const deleteStaffLevel = async () => {
    if (!staffLevelToDelete || !authToken) return;
    const response = await fetch(`/api/staff-levels/${staffLevelToDelete.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.message || 'Không thể xóa cấp bậc.');
      return;
    }
    setStaffLevelToDelete(null);
    const refreshed = await fetch('/api/staff-levels', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const refreshedData = await refreshed.json().catch(() => null);
    if (refreshed.ok && Array.isArray(refreshedData?.staffLevels)) {
      setStaffLevels(refreshedData.staffLevels.map((item, index) => ({
        id: Number(item?.id) || Number(`${Date.now()}${index}`),
        name: typeof item?.name === 'string' ? item.name : '',
        serviceCommission: typeof item?.serviceCommission === 'string' ? item.serviceCommission : '0',
        salaryFormula: item?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
        fixedSalary: Number(item?.fixedSalary || 0),
        additions: typeof item?.additions === 'string' ? item.additions : '0',
        deductions: typeof item?.deductions === 'string' ? item.deductions : '0',
      })));
    }
  };

  const renderStaffLevels = () => (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h3 className="text-4xl font-serif text-primary">Cấp bậc & Phân quyền</h3>
          <p className="text-stone-400 text-sm">Quản lý các cấp bậc nhân sự và thiết lập quyền truy cập cho từng vai trò trong hệ thống Atelier.</p>
        </div>
        <button
          onClick={openCreateStaffLevel}
          className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-xl hover:bg-primary-light transition-all"
        >
          <UserPlus size={20} /> + Thêm cấp bậc
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-8 border-b border-stone-100 pb-1">
        {['Cấp bậc nhân viên', 'Quyền hạn chung', 'Lịch sử thay đổi'].map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubTab(sub)}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative",
              activeSubTab === sub ? "text-primary" : "text-stone-300 hover:text-stone-400"
            )}
          >
            {sub}
            {activeSubTab === sub && (
              <motion.div 
                layoutId="activeSubTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
      </div>

      {activeSubTab === 'Cấp bậc nhân viên' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staff Level Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {staffLevels.map((level) => (
              <div key={level.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8 relative group">
                <div className="space-y-1">
                  <h4 className="text-2xl font-serif text-primary">{level.name}</h4>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Cấu hình hoa hồng & lương
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-stone-50/50 p-6 rounded-3xl space-y-2 border border-stone-50">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">HOA HỒNG DỊCH VỤ</p>
                    <p className="text-xl font-serif text-primary">{level.serviceCommission}%</p>
                  </div>
                </div>

                <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 space-y-2">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">CÔNG THỨC LƯƠNG</p>
                  <p className="text-sm font-semibold text-primary">
                    {level.salaryFormula === 'fixed_plus_commission'
                      ? 'Lương = Lương cứng + (Doanh thu dịch vụ × % hoa hồng)'
                      : 'Lương = Doanh thu dịch vụ × % hoa hồng'}
                  </p>
                  {level.salaryFormula === 'fixed_plus_commission' && (
                    <p className="text-xs text-stone-500">Lương cứng: {Number(level.fixedSalary || 0).toLocaleString('vi-VN')}đ</p>
                  )}
                  <p className="text-xs text-stone-500">Khoản cộng: nhập tay khi tính lương</p>
                  <p className="text-xs text-stone-500">Khoản trừ: nhập tay khi tính lương</p>
                </div>

                <div className="flex justify-end gap-6 pt-4">
                  <button className="text-[11px] font-bold text-stone-400 hover:text-primary transition-colors">Chi tiết</button>
                  <button
                    onClick={() => openEditStaffLevel(level)}
                    className="text-[11px] font-bold text-primary hover:text-primary-light transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setStaffLevelToDelete(level)}
                    className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Level Card */}
            <button
              onClick={openCreateStaffLevel}
              className="bg-stone-50/30 border-2 border-dashed border-stone-200 rounded-[3rem] flex flex-col items-center justify-center p-12 space-y-4 group hover:border-primary/30 transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-stone-300 group-hover:text-primary shadow-sm transition-colors">
                <Plus size={32} />
              </div>
              <div className="text-center">
                <h4 className="text-xl font-serif text-stone-400 group-hover:text-primary transition-colors">Thêm cấp bậc mới</h4>
                <p className="text-xs text-stone-300 mt-1">Thiết lập lộ trình thăng tiến cho salon của bạn</p>
              </div>
            </button>
          </div>

          {/* Summary Card */}
          <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <BarChart3 size={240} />
            </div>
            <div className="space-y-8 relative z-10">
              <h4 className="text-2xl font-serif">Tổng quan Nhân sự</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-sm text-white/60">Tổng số cấp bậc</span>
                  <span className="text-2xl font-serif">{staffLevels.length.toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-sm text-white/60">Nhân viên hoạt động</span>
                  <span className="text-2xl font-serif">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Yêu cầu quyền hạn chờ duyệt</span>
                  <div className="flex items-center gap-3">
                    <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-md">03</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full bg-white text-primary py-5 rounded-2xl text-sm font-bold shadow-xl hover:bg-stone-50 transition-all relative z-10 mt-12">
              Báo cáo phân quyền chi tiết
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'Quyền hạn chung' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-8 border-b border-stone-50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2"><Shield size={16} /> Ma trận quyền hạn</h4>
            <span className="text-[10px] text-stone-400 uppercase tracking-widest">Theo module hệ thống</span>
          </div>
          <div className="divide-y divide-stone-50">
            {roles.map((role) => (
              <div key={role.id} className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-lg font-bold text-primary">{role.name}</h5>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{role.roleId}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {role.permissions.map((permission) => (
                    <div key={`${role.id}-${permission.module}`} className="bg-stone-50/50 border border-stone-100 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{permission.module}</span>
                      <span className="text-xs text-stone-500">{permission.actions.join(' • ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'Lịch sử thay đổi' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-8 space-y-4">
          <h4 className="text-sm font-bold text-primary flex items-center gap-2"><History size={16} /> Lịch sử thay đổi quyền hạn</h4>
          <div className="space-y-3">
            {[ 
              'Admin cập nhật quyền cho Stylist Cao Cấp lúc 09:25',
              'Quản lý thêm cấp bậc mới: Chuyên viên màu lúc 08:10',
              'Kỹ Thuật Viên được cấp quyền xem kho lúc 18:42 hôm qua',
            ].map((item) => (
              <div key={item} className="bg-stone-50/60 border border-stone-100 rounded-2xl px-5 py-4 text-sm text-stone-600 flex items-center gap-3">
                <FileText size={14} className="text-stone-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-10 space-y-12 bg-[#fdfcfb] min-h-full"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif text-primary">Hệ thống & Cấu hình</h2>
          <p className="text-stone-400 text-sm">Thiết lập tham số vận hành cho salon</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm cài đặt..."
              className="bg-stone-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-stone-100/50 p-1.5 rounded-[2rem] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 rounded-2xl text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider",
              activeTab === tab 
                ? "bg-primary text-white shadow-lg" 
                : "text-stone-400 hover:text-stone-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Service Categories Section */}
      {activeTab === 'Danh mục dịch vụ' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif text-primary">Danh mục dịch vụ</h3>
              <p className="text-stone-400 text-sm">Phân nhóm các dịch vụ làm đẹp tại Salon</p>
            </div>
            <button 
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-primary-light transition-all"
            >
              <Plus size={16} /> Thêm danh mục
            </button>
          </div>

          {!categories.length && (
            <div className="bg-white border border-stone-100 rounded-[2rem] p-10 text-center">
              <p className="text-primary font-bold">Chưa có danh mục dịch vụ.</p>
              <p className="text-stone-400 text-sm mt-2">
                Thêm dịch vụ trong mục Dịch vụ &amp; Bảng giá để danh mục được đồng bộ tại đây.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6 relative group">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setCategoryToEdit(cat as unknown as ServiceCategoryConfig)} className="p-2 text-stone-400 hover:text-primary transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => setCategoryToDelete(cat as unknown as ServiceCategoryConfig)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <button className="p-2 text-stone-300 cursor-grab"><GripVertical size={14} /></button>
                </div>
                <div
                  className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getCategoryMeta(cat.name, cat.color, cat.icon).colorClass)}
                  style={getCategoryMeta(cat.name, cat.color, cat.icon).inlineStyle}
                >
                  {getCategoryMeta(cat.name, cat.color, cat.icon).icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-primary">{cat.name}</h4>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-stone-400">{cat.count} dịch vụ</span>
                    <span className={cn(cat.status === 'Đang hiện' ? "text-green-500" : "text-stone-300")}>
                      {cat.status === 'Đang hiện' ? '● Đang hiện' : '○ Đang ẩn'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed List */}
          {/* <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-primary">Danh sách chi tiết</h4>
              <span className="text-[10px] text-stone-400 italic">Kéo thả các dòng để thay đổi thứ tự hiển thị trên Menu</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-10 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">BIỂU TƯỢNG</th>
                  <th className="px-10 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">TÊN DANH MỤC</th>
                  <th className="px-10 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">SỐ DỊCH VỤ</th>
                  <th className="px-10 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">TRẠNG THÁI</th>
                  <th className="px-10 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {categories.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="px-10 py-6">
                      <div
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getCategoryMeta(item.name, item.color, item.icon).colorClass)}
                        style={getCategoryMeta(item.name, item.color, item.icon).inlineStyle}
                      >
                        {getCategoryMeta(item.name, item.color, item.icon).icon}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-primary">{item.name}</td>
                    <td className="px-10 py-6 text-sm font-bold text-stone-600 text-center">{item.count}</td>
                    <td className="px-10 py-6 text-center">
                      <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {item.status === 'Đang hiện' ? 'Hiện' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button className="text-stone-300 hover:text-primary transition-colors"><GripVertical size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div> */}
        </div>
      )}

      {/* Staff Levels Tab */}
      {activeTab === 'Cấp bậc nhân viên' && renderStaffLevels()}

      {/* Default Staff Tab */}
      {activeTab === 'Thợ mặc định' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif text-primary">Thợ mặc định theo ca</h3>
              <p className="text-stone-400 text-sm">Thiết lập nhân sự phụ trách mặc định cho từng loại dịch vụ và khung giờ</p>
            </div>
            <button className="bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-primary-light transition-all">
              <Plus size={16} /> Thêm cấu hình ca
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-primary">
                      <Scissors size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-primary">{i === 1 ? 'Cắt tóc Nam' : 'Nhuộm màu kỹ thuật'}</h4>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">DỊCH VỤ PHỔ BIẾN</p>
                    </div>
                  </div>
                  <button className="text-stone-300 hover:text-primary transition-colors"><Edit2 size={18} /></button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                        <Sun size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Ca Sáng</p>
                        <p className="text-[10px] text-stone-400">08:00 - 14:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">THỢ CHÍNH:</span>
                      <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-primary border border-stone-100 shadow-sm">Trần Văn A</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center">
                        <Moon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Ca Tối</p>
                        <p className="text-[10px] text-stone-400">14:00 - 21:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">THỢ CHÍNH:</span>
                      <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-bold text-primary border border-stone-100 shadow-sm">Lê Thị B</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retail Products Tab */}
      {activeTab === 'Danh mục sản phẩm' && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif text-primary">Danh mục sản phẩm</h3>
              <p className="text-stone-400 text-sm">Quản lý danh mục cha cho sản phẩm</p>
            </div>
            <button
              onClick={() => setIsNewProductCategoryModalOpen(true)}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-primary-light transition-all"
            >
              <Plus size={16} /> Thêm danh mục sản phẩm
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {productCategoriesView.map((cat) => (
              <div key={String(cat.id)} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6 relative group">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setProductCategoryToEdit(cat as ProductCategoryConfig)} className="p-2 text-stone-400 hover:text-primary transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => setProductCategoryToDelete(cat as ProductCategoryConfig)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <button className="p-2 text-stone-300 cursor-grab"><GripVertical size={14} /></button>
                </div>
                <div
                  className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getCategoryMeta(cat.name, cat.color, cat.icon).colorClass)}
                  style={getCategoryMeta(cat.name, cat.color, cat.icon).inlineStyle}
                >
                  {getCategoryMeta(cat.name, cat.color, cat.icon).icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-primary">{cat.name}</h4>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-stone-400">{cat.count} sản phẩm</span>
                    <span className={cn(cat.status === 'Đang hiện' ? "text-green-500" : "text-stone-300")}>
                      {cat.status === 'Đang hiện' ? '● Đang hiện' : '○ Đang ẩn'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Sources & Cancellation Reasons Tab */}
      {(activeTab === 'Nguồn khách' || activeTab === 'Lý do hủy') && (
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif text-primary">{activeTab}</h3>
              <p className="text-stone-400 text-sm">Quản lý các tham số phân tích dữ liệu khách hàng</p>
            </div>
            <button
              type="button"
              disabled={activeTab !== 'Nguồn khách'}
              onClick={() => {
                if (activeTab === 'Nguồn khách') openCreateSource();
              }}
              className={cn(
                'bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl hover:bg-primary-light transition-all',
                activeTab !== 'Nguồn khách' && 'opacity-40 cursor-not-allowed hover:bg-primary'
              )}
            >
              <Plus size={16} /> Thêm mới
            </button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'Nguồn khách' ? (
                  <>
                    {sourcesLoading && (
                      <p className="col-span-full text-sm text-stone-400">Đang tải nguồn khách...</p>
                    )}
                    {!sourcesLoading && sourcesLoadError && (
                      <p className="col-span-full text-sm text-red-500">{sourcesLoadError}</p>
                    )}
                    {!sourcesLoading && !sourcesLoadError && !customerSources.length && (
                      <p className="col-span-full text-sm text-stone-400">
                        Chưa có nguồn khách. Nhấn Thêm mới để tạo.
                      </p>
                    )}
                    {customerSources.map((src) => (
                      <div
                        key={src.id}
                        className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-50 group hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm bg-primary shrink-0">
                            <CustomerSourceIcon iconId={src.icon} size={18} />
                          </div>
                          <span className="text-sm font-bold text-primary truncate">{src.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditSource(src.id, src.name, src.icon)}
                            className="text-stone-300 hover:text-primary transition-colors"
                            aria-label="Sửa nguồn khách"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSourceToDelete({ id: src.id, name: src.name })}
                            className="text-stone-300 hover:text-red-500 transition-colors"
                            aria-label="Xóa nguồn khách"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  ['Khách quên lịch', 'Trùng lịch thợ', 'Khách bận đột xuất', 'Thời tiết xấu', 'Lỗi hệ thống'].map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-50 group hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm bg-red-900">
                            <XCircle size={18} />
                          </div>
                          <span className="text-sm font-bold text-primary">{item}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" className="text-stone-300 hover:text-primary transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" className="text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Units Tab */}
      {activeTab === 'Thời lượng' && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif text-primary">Cấu hình thời gian</h3>
            <p className="text-stone-400 text-sm">Thiết lập các đơn vị thời gian vận hành hệ thống</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <h4 className="text-xl font-serif text-primary">Đơn vị thời gian tối thiểu</h4>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-bold text-primary">Thời lượng bước nhảy</span>
                  <div className="flex items-center gap-4">
                    <button className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-primary">-</button>
                    <span className="text-lg font-serif text-primary">15 phút</span>
                    <button className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-primary">+</button>
                  </div>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed italic">
                  * Đơn vị này sẽ ảnh hưởng đến việc hiển thị lưới thời gian trên trang Đặt lịch và tính toán thời gian phục vụ.
                </p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <h4 className="text-xl font-serif text-primary">Thời gian đệm (Buffer)</h4>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-bold text-primary">Thời gian nghỉ giữa ca</span>
                  <div className="flex items-center gap-4">
                    <button className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-primary">-</button>
                    <span className="text-lg font-serif text-primary">5 phút</span>
                    <button className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-primary">+</button>
                  </div>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed italic">
                  * Khoảng thời gian trống tự động được thêm vào sau mỗi dịch vụ để thợ dọn dẹp và chuẩn bị.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <p className="text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">
          © 2024 L'ATELIER SALON PREMIUM CRM — ALL RIGHTS RESERVED
        </p>
      </div>

      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <NewCategoryModal 
            onClose={() => setIsNewCategoryModalOpen(false)}
            onSave={(data) => onCreateCategory?.(data)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewProductCategoryModalOpen && (
          <NewCategoryModal
            onClose={() => setIsNewProductCategoryModalOpen(false)}
            onSave={(data) => onCreateProductCategory?.(data)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToEdit && (
          <EditServiceCategoryModal
            category={categoryToEdit}
            onClose={() => setCategoryToEdit(null)}
            onSave={(payload) => onUpdateCategory?.(categoryToEdit.id, payload)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToDelete && (
          <DeleteServiceCategoryModal
            category={categoryToDelete}
            serviceCount={serviceCountByCategory[categoryToDelete.name] || 0}
            allCategories={serviceCategories}
            onClose={() => setCategoryToDelete(null)}
            onConfirm={(replacementCategoryName) => onDeleteCategory?.(categoryToDelete.id, replacementCategoryName)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productCategoryToEdit && (
          <EditServiceCategoryModal
            category={productCategoryToEdit}
            onClose={() => setProductCategoryToEdit(null)}
            onSave={(payload) => onUpdateProductCategory?.(productCategoryToEdit.id, payload)}
            title="Sửa danh mục sản phẩm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productCategoryToDelete && (
          <DeleteServiceCategoryModal
            category={productCategoryToDelete}
            serviceCount={productCountByCategory[productCategoryToDelete.name] || 0}
            allCategories={productCategories}
            onClose={() => setProductCategoryToDelete(null)}
            onConfirm={(replacementCategoryName) => onDeleteProductCategory?.(productCategoryToDelete.id, replacementCategoryName)}
            title="Xác nhận xóa danh mục sản phẩm"
            unitLabel="sản phẩm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {staffLevelToDelete && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
              onClick={() => setStaffLevelToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-stone-100">
                <h4 className="text-xl font-serif text-primary">Xác nhận xóa cấp bậc</h4>
                <p className="text-sm text-stone-500 mt-2">
                  Bạn có chắc muốn xóa cấp bậc <strong>{staffLevelToDelete.name}</strong>?
                </p>
              </div>
              <div className="p-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStaffLevelToDelete(null)}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={deleteStaffLevel}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStaffLevelEditorOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
              onClick={() => setIsStaffLevelEditorOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 flex justify-between items-start border-b border-stone-100">
                <h4 className="text-xl font-serif text-primary pr-8">
                  {staffLevelEditorId ? 'Sửa cấp bậc nhân viên' : 'Thêm cấp bậc nhân viên'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsStaffLevelEditorOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tên cấp bậc</label>
                  <input value={staffLevelName} onChange={(e) => setStaffLevelName(e.target.value)} placeholder="Tên cấp bậc" className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">% Hoa hồng dịch vụ</label>
                  <input value={staffLevelServiceCommission} onChange={(e) => setStaffLevelServiceCommission(e.target.value)} placeholder="Ví dụ: 15" className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cách tính lương</label>
                  <select
                    value={staffLevelSalaryFormula}
                    onChange={(e) => setStaffLevelSalaryFormula(e.target.value as SalaryFormula)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="fixed_plus_commission">Lương = Lương cứng + (Doanh thu dịch vụ × % hoa hồng)</option>
                    <option value="commission_only">Lương = Doanh thu dịch vụ × %</option>
                  </select>
                </div>

                {staffLevelSalaryFormula === 'fixed_plus_commission' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Lương cứng</label>
                    <input
                      value={staffLevelFixedSalary}
                      onChange={(e) => setStaffLevelFixedSalary(e.target.value)}
                      placeholder="Ví dụ: 8000000"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Khoản cộng</label>
                  <input
                    value={staffLevelAdditions}
                    onChange={(e) => setStaffLevelAdditions(e.target.value)}
                    placeholder="Nhập tay khoản cộng"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Khoản trừ</label>
                  <input
                    value={staffLevelDeductions}
                    onChange={(e) => setStaffLevelDeductions(e.target.value)}
                    placeholder="Nhập tay khoản trừ"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="px-8 pb-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStaffLevelEditorOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveStaffLevel}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-light transition-colors"
                >
                  Lưu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sourceToDelete && (
          <DeleteCustomerSourceModal
            sourceName={sourceToDelete.name}
            onClose={() => setSourceToDelete(null)}
            onConfirm={async () => {
              if (!authToken) {
                alert('Phiên đăng nhập không hợp lệ.');
                return;
              }
              try {
                const id = sourceToDelete.id;
                const response = await fetch(`/api/customer-sources/${id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${authToken}` },
                });
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                  throw new Error(data?.message || 'Không thể xóa nguồn khách.');
                }
                await loadCustomerSources();
                window.dispatchEvent(new Event('customer-sources:changed'));
                setSourceToDelete(null);
              } catch (e) {
                alert(e instanceof Error ? e.message : 'Không thể xóa nguồn khách.');
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sourceEditorOpen && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
              onClick={() => !sourceSaving && setSourceEditorOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 flex justify-between items-start border-b border-stone-100">
                <h4 className="text-xl font-serif text-primary pr-8">
                  {sourceEditorId ? 'Sửa nguồn khách' : 'Thêm nguồn khách'}
                </h4>
                <button
                  type="button"
                  disabled={sourceSaving}
                  onClick={() => setSourceEditorOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                    Tên nguồn
                  </label>
                  <input
                    type="text"
                    value={sourceEditorName}
                    onChange={(e) => setSourceEditorName(e.target.value)}
                    placeholder="Ví dụ: Facebook, Zalo..."
                    disabled={sourceSaving}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none disabled:opacity-60"
                    autoFocus
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                    Icon hiển thị
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {CUSTOMER_SOURCE_ICON_OPTIONS.map(({ id, component: IconCmp }) => (
                      <button
                        key={id}
                        type="button"
                        disabled={sourceSaving}
                        onClick={() => setSourceEditorIcon(id)}
                        className={cn(
                          'h-12 rounded-xl flex items-center justify-center transition-all text-stone-500',
                          sourceEditorIcon === id
                            ? 'bg-primary text-white shadow-md scale-105'
                            : 'bg-stone-50 hover:bg-stone-100',
                          sourceSaving && 'opacity-50 pointer-events-none'
                        )}
                        aria-label={`Chọn icon ${id}`}
                      >
                        <IconCmp size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 pt-0 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={sourceSaving}
                  onClick={() => setSourceEditorOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={sourceSaving}
                  onClick={() => void saveSourceEditor()}
                  className="px-8 py-3 rounded-2xl text-sm font-bold bg-primary text-white shadow-lg hover:bg-primary-light transition-all disabled:bg-stone-300 disabled:text-stone-600"
                >
                  {sourceSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
