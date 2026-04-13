import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { normalizeCustomerSourceIcon } from '../shared/customerSourceIconIds';
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

async function nextSortOrder() {
  const col = currentDb().collection('customer_sources');
  const top = await col.find({}).sort({ sortOrder: -1 }).limit(1).toArray();
  const n = top[0]?.sortOrder;
  return typeof n === 'number' && Number.isFinite(n) ? n + 1 : Date.now();
}

export async function listCustomerSources(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;
    const items = await currentDb()
      .collection('customer_sources')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    return res.json({
      ok: true,
      sources: items.map((doc) => ({
        id: String(doc._id),
        name: String(doc.name || ''),
        sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : 0,
        icon: normalizeCustomerSourceIcon(doc.icon),
      })),
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải danh sách nguồn khách.' });
  }
}

export async function createCustomerSource(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên nguồn khách.' });
    }

    const normalizedName = name.toLowerCase();
    const col = currentDb().collection('customer_sources');
    const dup = await col.findOne({ normalizedName });
    if (dup) {
      return res.status(409).json({ message: 'Nguồn khách này đã tồn tại.' });
    }

    const icon = normalizeCustomerSourceIcon(req.body?.icon);
    const now = new Date();
    const sortOrder = await nextSortOrder();
    const doc = {
      name,
      normalizedName,
      sortOrder,
      icon,
      createdAt: now,
      updatedAt: now,
    };
    const result = await col.insertOne(doc);
    return res.status(201).json({
      ok: true,
      source: { id: String(result.insertedId), name, sortOrder, icon },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể thêm nguồn khách.' });
  }
}

export async function updateCustomerSource(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id nguồn khách không hợp lệ.' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên nguồn khách.' });
    }

    const normalizedName = name.toLowerCase();
    const col = currentDb().collection('customer_sources');
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy nguồn khách.' });
    }

    const conflict = await col.findOne({
      normalizedName,
      _id: { $ne: new ObjectId(id) },
    });
    if (conflict) {
      return res.status(409).json({ message: 'Tên nguồn khách đã được dùng.' });
    }

    const icon =
      req.body?.icon !== undefined
        ? normalizeCustomerSourceIcon(req.body.icon)
        : normalizeCustomerSourceIcon(existing.icon);

    await col.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          normalizedName,
          icon,
          updatedAt: new Date(),
        },
      }
    );
    return res.json({ ok: true });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật nguồn khách.' });
  }
}

export async function deleteCustomerSource(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id nguồn khách không hợp lệ.' });
    }

    const result = await currentDb().collection('customer_sources').deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy nguồn khách để xóa.' });
    }
    return res.json({ ok: true, deletedId: id });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa nguồn khách.' });
  }
}
