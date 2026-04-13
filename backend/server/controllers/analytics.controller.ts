import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function requireAuth(req: Request, res: Response) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: 'Thiếu token xác thực.' });
    return null;
  }
  try {
    return verifyAuthToken(token);
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ.' });
    return null;
  }
}

function toNumber(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyVi(amount: number) {
  return Math.round(amount).toLocaleString('vi-VN');
}

function parseRange(req: Request) {
  const now = new Date();
  const range = String(req.query.range || '').trim().toLowerCase();
  const fromRaw = String(req.query.from || '').trim();
  const toRaw = String(req.query.to || '').trim();

  if (range === 'custom' && fromRaw && toRaw) {
    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      return { from: startOfDay(from), to: endOfDay(to), label: 'Tùy chỉnh' };
    }
  }

  if (range === 'today') return { from: startOfDay(now), to: endOfDay(now), label: 'Hôm nay' };
  if (range === 'week') {
    const from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    return { from, to: endOfDay(now), label: 'Tuần này' };
  }
  if (range === 'month') return { from: startOfMonth(now), to: endOfDay(now), label: 'Tháng này' };

  // default: month
  return { from: startOfMonth(now), to: endOfDay(now), label: 'Tháng này' };
}

export async function getDashboardAnalytics(req: Request, res: Response) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const now = new Date();
    const todayFrom = startOfDay(now);
    const todayTo = endOfDay(now);
    const monthFrom = startOfMonth(now);
    const monthTo = endOfDay(now);
    
    const chartRange = String(req.query.chartRange || 'week');
    let chartFrom: Date;
    let chartTo = endOfDay(now);

    if (chartRange === 'year') {
      chartFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (chartRange === 'month') {
      chartFrom = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    } else {
      chartFrom = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    }

    const orders = currentDb().collection('pos_orders');
    const customers = currentDb().collection('customers');

    const [todayAgg, chartAgg, monthNewCustomers] = await Promise.all([
      orders
        .aggregate([
          { $match: { createdAt: { $gte: todayFrom, $lte: todayTo } } },
          {
            $group: {
              _id: null,
              ordersCount: { $sum: 1 },
              revenue: { $sum: '$totals.total' },
            },
          },
        ])
        .toArray(),
      orders
        .aggregate([
          { $match: { createdAt: { $gte: chartFrom, $lte: chartTo } } },
          {
            $group: {
              _id: {
                y: { $year: '$createdAt' },
                m: { $month: '$createdAt' },
                d: { $dayOfMonth: '$createdAt' },
              },
              revenue: { $sum: '$totals.total' },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
        ])
        .toArray(),
      customers.countDocuments({ createdAt: { $gte: monthFrom, $lte: monthTo } }),
    ]);

    const todayRow = todayAgg?.[0] || { ordersCount: 0, revenue: 0 };

    const byDayKey = new Map<string, number>();
    const byMonthKey = new Map<string, number>();

    for (const row of chartAgg) {
      const y = row?._id?.y;
      const m = row?._id?.m;
      const d = row?._id?.d;
      const dayKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      byDayKey.set(dayKey, toNumber(row?.revenue));
      
      const existingM = byMonthKey.get(monthKey) || 0;
      byMonthKey.set(monthKey, existingM + toNumber(row?.revenue));
    }

    let weeklyRevenueData: Array<{name: string, value: number}> = [];
    
    if (chartRange === 'year') {
      for (let i = 0; i < 12; i++) {
        const monthKey = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        weeklyRevenueData.push({
          name: `T${i + 1}`,
          value: byMonthKey.get(monthKey) || 0
        });
      }
    } else if (chartRange === 'month') {
      for (let i = 0; i < 30; i++) {
        const dt = new Date(chartFrom.getTime() + i * 24 * 60 * 60 * 1000);
        const dayKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        weeklyRevenueData.push({
          name: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`,
          value: byDayKey.get(dayKey) || 0
        });
      }
    } else {
      for (let i = 0; i < 7; i++) {
        const dt = new Date(chartFrom.getTime() + i * 24 * 60 * 60 * 1000);
        const dayKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(dt);
        weeklyRevenueData.push({
          name: weekday.replace('Th', 'T').replace('CN', 'CN'),
          value: byDayKey.get(dayKey) || 0
        });
      }
    }

    // Service allocation (share by service items revenue) dynamically based on chartRange.
    const allocationAgg = await orders
      .aggregate([
        { $match: { createdAt: { $gte: chartFrom, $lte: chartTo } } },
        { $unwind: '$items' },
        { $match: { 'items.type': 'service' } },
        {
          $group: {
            _id: '$items.name',
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ])
      .toArray();
    const totalServiceRevenue = allocationAgg.reduce((sum, r) => sum + toNumber(r?.revenue), 0) || 1;
    const palette = ['#4d0216', '#755b00', '#ffb2b9', '#d1d5db', '#1a1a1a', '#6b7280'];
    const serviceAllocationData = allocationAgg.map((row, i) => ({
      name: String(row?._id || 'Dịch vụ'),
      value: Math.round((toNumber(row?.revenue) / totalServiceRevenue) * 100),
      color: palette[i % palette.length],
    }));

    // Recent POS orders dynamically based on chartRange (replace "appointments" demo list on dashboard)
    const recentOrders = await orders
      .find({ createdAt: { $gte: chartFrom, $lte: chartTo } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    const customerIds = Array.from(
      new Set(
        recentOrders
          .map((o: any) => o?.customerId)
          .filter((id: any) => id && ObjectId.isValid(String(id)))
          .map((id: any) => new ObjectId(String(id)).toHexString())
      )
    ).map((id) => new ObjectId(id));

    const customerDocs = customerIds.length
      ? await currentDb()
          .collection('customers')
          .find({ _id: { $in: customerIds } })
          .project({ name: 1 })
          .toArray()
      : [];

    const customerNameMap = new Map<string, string>();
    for (const c of customerDocs) {
      customerNameMap.set(String(c._id), String(c?.name || '').trim());
    }
    const todayOrders = recentOrders.map((o) => {
      const createdAt = o?.createdAt ? new Date(o.createdAt) : new Date();
      const time = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(createdAt);
      const customerName =
        o?.isWalkIn
          ? String(o?.customerName || '').trim() || 'Khách vãng lai'
          : o?.customerId
            ? customerNameMap.get(String(o.customerId)) || String(o?.customerName || '').trim() || 'Khách thành viên'
            : String(o?.customerName || '').trim() || 'Khách';
      const items = Array.isArray(o?.items) ? o.items : [];
      const serviceNames = items.filter((it: any) => it?.type === 'service').map((it: any) => String(it?.name || '')).filter(Boolean);
      const staffNames = Array.from(new Set(items.map((it: any) => String(it?.staff || '')).filter(Boolean)));
      return {
        id: String(o?._id || ''),
        time,
        stylist: staffNames.join(', ') || '—',
        customer: customerName,
        service: serviceNames.slice(0, 2).join(', ') || 'POS',
        status: 'completed',
        avatar: '',
      };
    });

    return res.json({
      ok: true,
      kpis: {
        revenueToday: toNumber(todayRow.revenue),
        ordersToday: toNumber(todayRow.ordersCount),
        newCustomersThisMonth: monthNewCustomers,
      },
      weeklyRevenueData,
      serviceAllocationData,
      todayOrders,
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải dữ liệu tổng quan.' });
  }
}

export async function getReportsAnalytics(req: Request, res: Response) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { from, to } = parseRange(req);
    const now = new Date();
    const todayFrom = startOfDay(now);
    const todayTo = endOfDay(now);
    const orders = currentDb().collection('pos_orders');

    const [kpiAgg, serviceAgg, customersAgg] = await Promise.all([
      orders
        .aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$totals.total' },
              ordersCount: { $sum: 1 },
              uniqueCustomers: { $addToSet: '$customerId' },
            },
          },
        ])
        .toArray(),
      orders
        .aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $unwind: '$items' },
          { $match: { 'items.type': 'service' } },
          {
            $group: {
              _id: '$items.name',
              quantity: { $sum: '$items.quantity' },
              revenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 50 },
        ])
        .toArray(),
      orders
        .aggregate([
          { $match: { createdAt: { $gte: from, $lte: to }, customerId: { $ne: null } } },
          { $group: { _id: '$customerId', lastOrderAt: { $max: '$createdAt' } } },
        ])
        .toArray(),
    ]);

    const row = kpiAgg?.[0];
    const revenue = toNumber(row?.revenue);
    const ordersCount = toNumber(row?.ordersCount);
    const uniqueCustomersCount = Array.isArray(row?.uniqueCustomers)
      ? row.uniqueCustomers.filter((c: any) => c !== null).length
      : 0;

    // Revenue timeline (day buckets)
    const timelineAgg = await orders
      .aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              y: { $year: '$createdAt' },
              m: { $month: '$createdAt' },
              d: { $dayOfMonth: '$createdAt' },
            },
            actual: { $sum: '$totals.total' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      ])
      .toArray();

    const points = timelineAgg.map((t) => {
      const y = Number(t?._id?.y || 0);
      const m = Number(t?._id?.m || 1);
      const d = Number(t?._id?.d || 1);
      const dt = new Date(y, m - 1, d);
      const label = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(dt);
      return { name: label, actual: toNumber(t?.actual), target: 0 };
    });

    // Customer classification: "new" if first ever order in DB is within range, else returning.
    const customerIds = customersAgg.map((c) => c?._id).filter((id) => id && ObjectId.isValid(String(id)));
    let newCustomers = 0;
    let returningCustomers = 0;
    if (customerIds.length) {
      const firstOrders = await orders
        .aggregate([
          { $match: { customerId: { $in: customerIds } } },
          { $group: { _id: '$customerId', firstOrderAt: { $min: '$createdAt' } } },
        ])
        .toArray();
      for (const fo of firstOrders) {
        const firstAt = fo?.firstOrderAt ? new Date(fo.firstOrderAt) : null;
        if (!firstAt) continue;
        if (firstAt >= from && firstAt <= to) newCustomers += 1;
        else returningCustomers += 1;
      }
    }
    const totalClassified = newCustomers + returningCustomers || 1;
    const customerData = [
      { name: 'Khách quay lại', value: Math.round((returningCustomers / totalClassified) * 100), color: '#4a0e0e' },
      { name: 'Khách mới', value: Math.round((newCustomers / totalClassified) * 100), color: '#c5a059' },
    ];

    const serviceReports = serviceAgg.map((s, idx) => ({
      id: idx + 1,
      name: String(s?._id || ''),
      quantity: toNumber(s?.quantity),
      revenue: formatMoneyVi(toNumber(s?.revenue)),
      growth: 0,
      image: '',
    }));

    const todayOrdersRaw = await orders
      .find({ createdAt: { $gte: todayFrom, $lte: todayTo } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const todayOrderDetails = todayOrdersRaw.map((o) => {
      const createdAt = o?.createdAt ? new Date(o.createdAt) : new Date();
      const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(createdAt);
      const items = Array.isArray(o?.items) ? o.items : [];
      const soldItems = items
        .map((it: any) => `${String(it?.name || '')}${toNumber(it?.quantity) > 1 ? ` x${toNumber(it?.quantity)}` : ''}`)
        .filter(Boolean)
        .join(', ');
      const staffNames = Array.from(new Set(items.map((it: any) => String(it?.staff || '')).filter(Boolean)));
      return {
        id: String(o?._id || ''),
        time,
        soldItems: soldItems || '—',
        doneBy: staffNames.join(', ') || '—',
        total: formatMoneyVi(toNumber(o?.totals?.total)),
      };
    });

    return res.json({
      ok: true,
      kpis: {
        totalRevenue: revenue,
        ordersCount,
        customersServed: uniqueCustomersCount,
      },
      revenueData: points,
      customerData,
      serviceReports,
      appointmentStatus: {
        completed: ordersCount,
        cancelled: 0,
        noShow: 0,
      },
      todayOrderDetails,
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải báo cáo.' });
  }
}

export async function getStaffRecentActivities(req: Request, res: Response) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const now = new Date();
    const from = startOfDay(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    const to = endOfDay(now);
    const orders = currentDb().collection('pos_orders');

    const recentOrders = await orders
      .find({ createdAt: { $gte: from, $lte: to } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const activities = recentOrders.flatMap((o) => {
      const createdAt = o?.createdAt ? new Date(o.createdAt) : new Date();
      const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(createdAt);
      const items = Array.isArray(o?.items) ? o.items : [];
      const serviceNames = items
        .filter((it: any) => it?.type === 'service')
        .map((it: any) => String(it?.name || ''))
        .filter(Boolean);
      const staffNames = Array.from(new Set(items.map((it: any) => String(it?.staff || '')).filter(Boolean)));

      return staffNames.map((staff, idx) => ({
        id: `${String(o?._id || '')}-${idx}`,
        staffName: staff,
        text: `vừa hoàn thành ${serviceNames.slice(0, 2).join(', ') || 'dịch vụ'} lúc ${time}.`,
        createdAt,
      }));
    }).slice(0, 10);

    return res.json({ ok: true, activities });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải hoạt động mới của nhân viên.' });
  }
}

export async function getStaffPerformance(req: Request, res: Response) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const now = new Date();
    const from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const to = endOfDay(now);
    const orders = currentDb().collection('pos_orders');

    const agg = await orders
      .aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        { $match: { 'items.staff': { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$items.staff',
            revenue: { $sum: '$items.lineTotal' },
            lines: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const maxRevenue = Math.max(1, ...agg.map((a) => toNumber(a?.revenue)));
    const staffPerformanceData = agg.map((a) => ({
      name: String(a?._id || ''),
      value: Math.round((toNumber(a?.revenue) / maxRevenue) * 100),
      customers: toNumber(a?.lines),
    }));

    return res.json({ ok: true, staffPerformanceData });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải hiệu suất nhân viên.' });
  }
}

