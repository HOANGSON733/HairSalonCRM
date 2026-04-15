import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

type SalaryFormula = 'fixed_plus_commission' | 'commission_only';

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '');
}

async function requireAuth(req: Request, res: Response) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: 'Thiếu token xác thực.' });
    return false;
  }
  verifyAuthToken(token);
  return true;
}

export async function listEmployees(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const employees = await currentDb()
      .collection('employees')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      ok: true,
      employees: employees.map((employee) => ({
        id: String(employee._id),
        name: employee.name || '',
        phone: employee.phone || '',
        email: employee.email || '',
        role: employee.role || '',
        commissionRate: Number(employee.commissionRate || 0),
        avatar: employee.avatar || '',
        status:
          employee.status === 'terminated'
            ? 'terminated'
            : employee.status === 'on-leave'
              ? 'on-leave'
              : employee.status === 'busy'
                ? 'busy'
                : 'available',
        specialties: Array.isArray(employee.specialties) ? employee.specialties : [],
        birthday: employee.birthday || '',
        startDate: employee.startDate || '',
        defaultShift: employee.defaultShift || '',
        bio: employee.bio,
        monthlyRevenue: employee.monthlyRevenue,
        rebookingRate: employee.rebookingRate,
      })),
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tải danh sách nhân viên.' });
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(String(req.body?.phone || '').trim());
    const email = String(req.body?.email || '').trim();
    const role = String(req.body?.role || '').trim();
    const commissionRate = Number(req.body?.commissionRate || 0);
    const specialties = Array.isArray(req.body?.specialties)
      ? req.body.specialties.map((item: string) => String(item))
      : [];
    const birthday = String(req.body?.birthday || '').trim();
    const startDate = String(req.body?.startDate || '').trim();
    const defaultShift = String(req.body?.defaultShift || '').trim();
    const avatar = String(req.body?.avatar || '').trim();

    if (!name || !phone || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập tên, số điện thoại và chức vụ.' });
    }

    const existingByPhone = await currentDb().collection('employees').findOne({ phone });
    if (existingByPhone) {
      return res.status(409).json({ message: 'Số điện thoại nhân viên đã tồn tại.' });
    }

    const now = new Date();
    const employee = {
      name,
      phone,
      email,
      role,
      commissionRate,
      specialties,
      birthday,
      startDate,
      defaultShift,
      status: 'available',
      avatar: avatar || '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await currentDb().collection('employees').insertOne(employee);

    return res.status(201).json({
      ok: true,
      employee: {
        id: String(result.insertedId),
        ...employee,
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tạo nhân viên mới.' });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const employeeId = String(req.params.id || '').trim();
    if (!employeeId) {
      return res.status(400).json({ message: 'Thiếu id nhân viên.' });
    }

    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(String(req.body?.phone || '').trim());
    const email = String(req.body?.email || '').trim();
    const role = String(req.body?.role || '').trim();
    const commissionRate = Number(req.body?.commissionRate || 0);
    const specialties = Array.isArray(req.body?.specialties)
      ? req.body.specialties.map((item: string) => String(item))
      : [];
    const birthday = String(req.body?.birthday || '').trim();
    const startDate = String(req.body?.startDate || '').trim();
    const defaultShift = String(req.body?.defaultShift || '').trim();
    const avatar = String(req.body?.avatar || '').trim();

    if (!name || !phone || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập tên, số điện thoại và chức vụ.' });
    }

    const current = await currentDb().collection('employees').findOne({ _id: new ObjectId(employeeId) });
    if (!current) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }

    const duplicated = await currentDb().collection('employees').findOne({
      phone,
      _id: { $ne: new ObjectId(employeeId) },
    });
    if (duplicated) {
      return res.status(409).json({ message: 'Số điện thoại nhân viên đã tồn tại.' });
    }

    const updated: any = {
      name,
      phone,
      email,
      role,
      commissionRate,
      specialties,
      birthday,
      startDate,
      defaultShift,
      avatar: avatar || '',
      updatedAt: new Date(),
    };
    
    if (req.body?.status) {
      updated.status = String(req.body.status);
    }

    await currentDb().collection('employees').updateOne(
      { _id: new ObjectId(employeeId) },
      { $set: updated }
    );

    return res.json({
      ok: true,
      employee: {
        id: employeeId,
        ...current,
        ...updated,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật nhân viên.' });
  }
}

export async function terminateEmployee(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const employeeId = String(req.params.id || '').trim();
    if (!employeeId || !ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Id nhân viên không hợp lệ.' });
    }

    const leaveType = req.body?.type === 'permanent' ? 'permanent' : 'temporary';
    const effectiveDate = String(req.body?.effectiveDate || '').trim();
    const reason = String(req.body?.reason || '').trim();

    const status = leaveType === 'permanent' ? 'terminated' : 'on-leave';
    const now = new Date();
    const setData: Record<string, unknown> = {
      status,
      leaveType,
      leaveReason: reason || 'Lý do cá nhân',
      leaveEffectiveDate: effectiveDate || now.toISOString().slice(0, 10),
      updatedAt: now,
    };

    if (leaveType === 'permanent') {
      setData.terminatedAt = now;
    }

    const result = await currentDb().collection('employees').findOneAndUpdate(
      { _id: new ObjectId(employeeId) },
      { $set: setData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }

    return res.json({
      ok: true,
      employee: {
        id: employeeId,
        name: result.name || '',
        phone: result.phone || '',
        email: result.email || '',
        role: result.role || '',
        commissionRate: Number(result.commissionRate || 0),
        avatar: result.avatar || '',
        status:
          result.status === 'terminated'
            ? 'terminated'
            : result.status === 'on-leave'
              ? 'on-leave'
              : result.status === 'busy'
                ? 'busy'
                : 'available',
        specialties: Array.isArray(result.specialties) ? result.specialties : [],
        birthday: result.birthday || '',
        startDate: result.startDate || '',
        defaultShift: result.defaultShift || '',
        bio: result.bio,
        monthlyRevenue: result.monthlyRevenue,
        rebookingRate: result.rebookingRate,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật trạng thái nghỉ việc.' });
  }
}

function formatDateVi(date: Date) {
  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function formatMoneyVnd(value: number) {
  return Math.round(value).toLocaleString('vi-VN');
}

export async function getEmployeeProfileStats(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const employeeId = String(req.params.id || '').trim();
    if (!employeeId || !ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Id nhân viên không hợp lệ.' });
    }

    const employee = await currentDb().collection('employees').findOne({ _id: new ObjectId(employeeId) });
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }

    const employeeName = String(employee.name || '').trim();
    if (!employeeName) {
      return res.json({
        ok: true,
        profile: {
          monthlyRevenue: '0',
          rebookingRate: '0%',
          commissions: [],
          revenueSources: [],
          salaryBreakdown: [],
          workHistory: [],
          additions: [],
          deductions: [],
        },
      });
    }

    const now = new Date();
    const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const orders = currentDb().collection('pos_orders');
    const appointments = currentDb().collection('appointments');

    const employeeOrders = await orders
      .aggregate([
        { $match: { createdAt: { $gte: monthFrom, $lte: monthTo } } },
        { $unwind: '$items' },
        {
          $match: {
            'items.type': 'service',
            'items.staff': employeeName,
          },
        },
        {
          $group: {
            _id: '$items.name',
            count: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineNetTotal' },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    const monthlyRevenueTotal = employeeOrders.reduce((sum, row: any) => sum + Number(row?.revenue || 0), 0);
    const commissions = employeeOrders.map((row: any) => ({
      service: String(row?._id || 'Dịch vụ'),
      count: Number(row?.count || 0),
      amount: formatMoneyVnd(Number(row?.revenue || 0)),
    }));

    const revenueSources = employeeOrders.slice(0, 6).map((row: any) => ({
      name: String(row?._id || 'Dịch vụ'),
      amount: Number(row?.revenue || 0),
    }));

    const customerRows = await orders
      .aggregate([
        { $match: { createdAt: { $gte: monthFrom, $lte: monthTo } } },
        { $unwind: '$items' },
        {
          $match: {
            'items.type': 'service',
            'items.staff': employeeName,
            customerId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$customerId',
            visits: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const uniqueCustomers = customerRows.length;
    const returningCustomers = customerRows.filter((row: any) => Number(row?.visits || 0) > 1).length;
    const rebookingRate = uniqueCustomers > 0 ? Math.round((returningCustomers / uniqueCustomers) * 100) : 0;

    const appointmentRows = await appointments
      .find({
        $or: [{ stylistName: employeeName }, { stylistId: String(employeeId) }],
        date: { $gte: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01` },
      })
      .sort({ date: -1, time: -1, createdAt: -1 })
      .limit(20)
      .toArray();

    const workHistory = appointmentRows.slice(0, 8).map((item: any) => ({
      date: String(item?.date || formatDateVi(now)),
      title: `${String(item?.serviceName || 'Dịch vụ')} · ${String(item?.status || 'confirmed')}`,
      detail: `${String(item?.customerName || 'Khách hàng')} • ${String(item?.time || '')}`,
    }));

    const staffLevel = await currentDb().collection('staff_levels').findOne({
      normalizedName: String(employee?.role || '').trim().toLowerCase(),
    });

    const baseSalary = Number(staffLevel?.fixedSalary || 0);
    const commissionRate = Number(staffLevel?.serviceCommission || employee?.commissionRate || 0);
    const commissionAmount = Math.round((monthlyRevenueTotal * commissionRate) / 100);
    const additions = Number(staffLevel?.additions || 0);
    const deductions = Number(staffLevel?.deductions || 0);
    const salaryFormula: SalaryFormula = staffLevel?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission';

    const orderCount = employeeOrders.reduce((sum, row: any) => sum + Number(row?.count || 0), 0);
    const autoAdditions = [
      ...(orderCount >= 20 ? [{ label: 'Thưởng hiệu suất', amount: 500000, note: 'Đạt từ 20 lượt dịch vụ trở lên' }] : []),
      ...(rebookingRate >= 30 ? [{ label: 'Thưởng giữ khách', amount: 300000, note: 'Tỷ lệ quay lại tốt' }] : []),
    ];

    const autoDeductions = appointmentRows.filter((item: any) => item?.status === 'cancelled').length
      ? [{ label: 'Lịch hủy', amount: appointmentRows.filter((item: any) => item?.status === 'cancelled').length * 50000, note: 'Dựa trên lịch hủy trong tháng' }]
      : [];

    const salaryBreakdown = salaryFormula === 'fixed_plus_commission'
      ? [
          { label: 'Lương cứng', amount: baseSalary },
          { label: 'Hoa hồng dịch vụ', amount: commissionAmount },
          { label: 'Tổng doanh thu từ dịch vụ', amount: monthlyRevenueTotal },
        ]
      : [
          { label: 'Hoa hồng dịch vụ', amount: commissionAmount },
          { label: 'Tổng doanh thu từ dịch vụ', amount: monthlyRevenueTotal },
        ];

    return res.json({
      ok: true,
      profile: {
        monthlyRevenue: formatMoneyVnd(monthlyRevenueTotal),
        rebookingRate: `${rebookingRate}%`,
        commissions,
        revenueSources,
        salaryBreakdown,
        workHistory,
        additions: autoAdditions,
        deductions: autoDeductions,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải dữ liệu hồ sơ nhân viên.' });
  }
}

export async function deleteEmployee(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const employeeId = String(req.params.id || '').trim();
    if (!employeeId || !ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Id nhân viên không hợp lệ.' });
    }

    const result = await currentDb().collection('employees').deleteOne({ _id: new ObjectId(employeeId) });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên để xóa.' });
    }

    return res.json({ ok: true, deletedId: employeeId });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa nhân viên.' });
  }
}
