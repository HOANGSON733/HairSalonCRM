export type View = 'dashboard' | 'appointments' | 'customers' | 'employees' | 'employee-profile' | 'salary' | 'services' | 'reports' | 'pos' | 'settings' | 'login' | 'marketing' | 'products';

export interface Customer {
  id: string | number;
  name: string;
  tags: string[];
  phone: string;
  email: string;
  birthday?: string;
  gender?: string;
  assignedEmployee?: string;
  notes?: string;
  source?: string;
  lastVisit: string;
  avatar: string;
  memberSince?: string;
  points?: number;
  maxPoints?: number;
  isWalkIn?: boolean;
  spendingData?: { month: string; value: number }[];
  history?: { date: string; service: string; stylist: string; price: string }[];
}

export interface Appointment {
  id: number;
  time: string;
  stylist: string;
  customer: string;
  service: string;
  status: 'confirmed' | 'in-progress' | 'completed';
  avatar: string;
}

export interface ScheduleItem {
  id: number;
  start: string;
  end: string;
  customer: string;
  service: string;
  stylist: string;
  top: number;
  height: number;
  color: string;
}

export interface Employee {
  id: string | number;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  commissionRate?: number;
  avatar: string;
  status: 'available' | 'busy' | 'on-leave' | 'terminated';
  specialties: string[];
  birthday?: string;
  startDate?: string;
  defaultShift?: string;
  bio?: string;
  monthlyRevenue?: string;
  rebookingRate?: string;
  certificates?: { title: string; location: string; icon: string }[];
  weeklySchedule?: { day: string; shift: string; time: string; type?: string }[];
  commissions?: { service: string; count: number; amount: string }[];
  revenueSources?: { name: string; amount: number }[];
  salaryBreakdown?: { label: string; amount: number }[];
  workHistory?: { date: string; title: string; detail: string }[];
  additions?: { label: string; amount: number; note?: string }[];
  deductions?: { label: string; amount: number; note?: string }[];
}

export interface ServiceCategory {
  id: number;
  name: string;
  icon: string;
  services: Service[];
}

export interface Service {
  id: string | number;
  name: string;
  duration: string;
  price: string;
  maxPrice?: string;
  cost?: string;
  commissionRate?: number;
  description: string;
  image: string;
  category: string;
  popularity?: number;
  tags?: string[];
  gender?: string;
}

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  sku?: string;
  volume?: string;
  description?: string;
  sellingPrice: string;
  costPrice: string;
  stock: number;
  maxStock: number;
  image: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface ServiceCategoryConfig {
  id: string | number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  isVisible?: boolean;
}

export interface ProductCategoryConfig {
  id: string | number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  isVisible?: boolean;
}
