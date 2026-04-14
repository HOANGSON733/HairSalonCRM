import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

async function requireAuth(req: Request, res: Response) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: 'Thiếu token xác thực.' });
    return false;
  }
  verifyAuthToken(token);
  return true;
}

function normalizeLevelName(name: string) {
  return name.trim().toLowerCase();
}

async function nextSortOrder() {
  const col = currentDb().collection('staff_levels');
  const top = await col.find({}).sort({ sortOrder: -1 }).limit(1).toArray();
  const n = top[0]?.sortOrder;
  return typeof n === 'number' && Number.isFinite(n) ? n + 1 : Date.now();
}

export async function listStaffLevels(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const items = await currentDb()
      .collection('staff_levels')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    return res.json({
      ok: true,
      staffLevels: items.map((doc) => ({
        id: String(doc._id),
        name: String(doc.name || ''),
        serviceCommission: String(doc.serviceCommission || '0'),
        productCommission: String(doc.productCommission || '0'),
        salaryFormula: doc.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
        fixedSalary: Number(doc.fixedSalary || 0),
        isVisible: doc.isVisible !== false,
        sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : 0,
      })),
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải danh sách cấp bậc nhân viên.' });
  }
}

export async function createStaffLevel(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên cấp bậc.' });
    }

    const normalizedName = normalizeLevelName(name);
    const col = currentDb().collection('staff_levels');
    const dup = await col.findOne({ normalizedName });
    if (dup) {
      return res.status(409).json({ message: 'Cấp bậc này đã tồn tại.' });
    }

    const now = new Date();
    const doc = {
      name,
      normalizedName,
      serviceCommission: String(Number(req.body?.serviceCommission || 0)),
      productCommission: String(Number(req.body?.productCommission || 0)),
      salaryFormula: req.body?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
      fixedSalary: Number(req.body?.fixedSalary || 0),
      isVisible: req.body?.isVisible !== false,
      sortOrder: await nextSortOrder(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return res.status(201).json({
      ok: true,
      staffLevel: {
        id: String(result.insertedId),
        ...doc,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể thêm cấp bậc.' });
  }
}

export async function updateStaffLevel(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id cấp bậc không hợp lệ.' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên cấp bậc.' });
    }

    const normalizedName = normalizeLevelName(name);
    const col = currentDb().collection('staff_levels');
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy cấp bậc.' });
    }

    const conflict = await col.findOne({ normalizedName, _id: { $ne: new ObjectId(id) } });
    if (conflict) {
      return res.status(409).json({ message: 'Tên cấp bậc đã được dùng.' });
    }

    const payload = {
      name,
      normalizedName,
      serviceCommission: String(Number(req.body?.serviceCommission || 0)),
      productCommission: String(Number(req.body?.productCommission || 0)),
      salaryFormula: req.body?.salaryFormula === 'commission_only' ? 'commission_only' : 'fixed_plus_commission',
      fixedSalary: Number(req.body?.fixedSalary || 0),
      isVisible: req.body?.isVisible !== false,
      updatedAt: new Date(),
    };

    await col.updateOne({ _id: new ObjectId(id) }, { $set: payload });
    return res.json({ ok: true });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật cấp bậc.' });
  }
}

export async function deleteStaffLevel(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id cấp bậc không hợp lệ.' });
    }

    const result = await currentDb().collection('staff_levels').deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy cấp bậc để xóa.' });
    }

    return res.json({ ok: true, deletedId: id });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa cấp bậc.' });
  }
}