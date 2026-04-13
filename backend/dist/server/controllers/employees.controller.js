"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEmployees = listEmployees;
exports.createEmployee = createEmployee;
exports.updateEmployee = updateEmployee;
exports.terminateEmployee = terminateEmployee;
exports.deleteEmployee = deleteEmployee;
const mongodb_1 = require("mongodb");
const auth_1 = require("../lib/auth");
const db_1 = require("../lib/db");
function normalizePhone(phone) {
    return phone.replace(/\s+/g, '');
}
async function requireAuth(req, res) {
    const token = (0, auth_1.getTokenFromHeader)(req.headers.authorization);
    if (!token) {
        res.status(401).json({ message: 'Thiếu token xác thực.' });
        return false;
    }
    (0, auth_1.verifyAuthToken)(token);
    return true;
}
async function listEmployees(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const employees = await (0, db_1.currentDb)()
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
                rating: Number(employee.rating || 0),
                avatar: employee.avatar || '',
                status: employee.status === 'terminated'
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
    }
    catch (_error) {
        return res.status(401).json({ message: 'Không thể tải danh sách nhân viên.' });
    }
}
async function createEmployee(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const name = String(req.body?.name || '').trim();
        const phone = normalizePhone(String(req.body?.phone || '').trim());
        const email = String(req.body?.email || '').trim();
        const role = String(req.body?.role || '').trim();
        const commissionRate = Number(req.body?.commissionRate || 0);
        const specialties = Array.isArray(req.body?.specialties)
            ? req.body.specialties.map((item) => String(item))
            : [];
        const birthday = String(req.body?.birthday || '').trim();
        const startDate = String(req.body?.startDate || '').trim();
        const defaultShift = String(req.body?.defaultShift || '').trim();
        const avatar = String(req.body?.avatar || '').trim();
        if (!name || !phone || !role) {
            return res.status(400).json({ message: 'Vui lòng nhập tên, số điện thoại và chức vụ.' });
        }
        const existingByPhone = await (0, db_1.currentDb)().collection('employees').findOne({ phone });
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
            rating: 5,
            status: 'available',
            avatar: avatar || '',
            createdAt: now,
            updatedAt: now,
        };
        const result = await (0, db_1.currentDb)().collection('employees').insertOne(employee);
        return res.status(201).json({
            ok: true,
            employee: {
                id: String(result.insertedId),
                ...employee,
            },
        });
    }
    catch (_error) {
        return res.status(401).json({ message: 'Không thể tạo nhân viên mới.' });
    }
}
async function updateEmployee(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
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
            ? req.body.specialties.map((item) => String(item))
            : [];
        const birthday = String(req.body?.birthday || '').trim();
        const startDate = String(req.body?.startDate || '').trim();
        const defaultShift = String(req.body?.defaultShift || '').trim();
        const avatar = String(req.body?.avatar || '').trim();
        if (!name || !phone || !role) {
            return res.status(400).json({ message: 'Vui lòng nhập tên, số điện thoại và chức vụ.' });
        }
        const current = await (0, db_1.currentDb)().collection('employees').findOne({ _id: new mongodb_1.ObjectId(employeeId) });
        if (!current) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
        }
        const duplicated = await (0, db_1.currentDb)().collection('employees').findOne({
            phone,
            _id: { $ne: new mongodb_1.ObjectId(employeeId) },
        });
        if (duplicated) {
            return res.status(409).json({ message: 'Số điện thoại nhân viên đã tồn tại.' });
        }
        const updated = {
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
        await (0, db_1.currentDb)().collection('employees').updateOne({ _id: new mongodb_1.ObjectId(employeeId) }, { $set: updated });
        return res.json({
            ok: true,
            employee: {
                id: employeeId,
                ...current,
                ...updated,
            },
        });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể cập nhật nhân viên.' });
    }
}
async function terminateEmployee(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const employeeId = String(req.params.id || '').trim();
        if (!employeeId || !mongodb_1.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Id nhân viên không hợp lệ.' });
        }
        const leaveType = req.body?.type === 'permanent' ? 'permanent' : 'temporary';
        const effectiveDate = String(req.body?.effectiveDate || '').trim();
        const reason = String(req.body?.reason || '').trim();
        const status = leaveType === 'permanent' ? 'terminated' : 'on-leave';
        const now = new Date();
        const setData = {
            status,
            leaveType,
            leaveReason: reason || 'Lý do cá nhân',
            leaveEffectiveDate: effectiveDate || now.toISOString().slice(0, 10),
            updatedAt: now,
        };
        if (leaveType === 'permanent') {
            setData.terminatedAt = now;
        }
        const result = await (0, db_1.currentDb)().collection('employees').findOneAndUpdate({ _id: new mongodb_1.ObjectId(employeeId) }, { $set: setData }, { returnDocument: 'after' });
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
                rating: Number(result.rating || 0),
                avatar: result.avatar || '',
                status: result.status === 'terminated'
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
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể cập nhật trạng thái nghỉ việc.' });
    }
}
async function deleteEmployee(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const employeeId = String(req.params.id || '').trim();
        if (!employeeId || !mongodb_1.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Id nhân viên không hợp lệ.' });
        }
        const result = await (0, db_1.currentDb)().collection('employees').deleteOne({ _id: new mongodb_1.ObjectId(employeeId) });
        if (!result.deletedCount) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên để xóa.' });
        }
        return res.json({ ok: true, deletedId: employeeId });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể xóa nhân viên.' });
    }
}
//# sourceMappingURL=employees.controller.js.map