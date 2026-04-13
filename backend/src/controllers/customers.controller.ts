import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

function formatDateVi(date: Date) {
  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getNameInitials(name: string) {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 'KH';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] || ''}${tokens[tokens.length - 1][0] || ''}`.toUpperCase();
}

function buildInitialAvatar(name: string) {
  const initials = getNameInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4d0216&color=ffffff&bold=true&rounded=true&size=256`;
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    verifyAuthToken(token);

    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(String(req.body?.phone || '').trim());
    const email = String(req.body?.email || '').trim();
    const birthday = String(req.body?.birthday || '').trim();
    const gender = String(req.body?.gender || '').trim();
    const assignedEmployee = String(req.body?.assignedEmployee || '').trim();
    const source = String(req.body?.source || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const avatar = String(req.body?.avatar || '').trim();

    if (!name || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại.' });
    }

    const existingCustomer = await currentDb().collection('customers').findOne({ phone });
    if (existingCustomer) {
      return res.status(409).json({ message: 'Số điện thoại này đã là khách thành viên.' });
    }

    const now = new Date();
    const customer = {
      name,
      phone,
      email,
      birthday,
      gender,
      assignedEmployee,
      source,
      notes,
      tags: ['#Khách mới'],
      avatar: avatar || buildInitialAvatar(name),
      lastVisit: formatDateVi(now),
      memberSince: `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
      points: 0,
      maxPoints: 5000,
      spendingData: [],
      history: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await currentDb().collection('customers').insertOne(customer);

    return res.status(201).json({
      ok: true,
      customer: {
        id: String(result.insertedId),
        ...customer,
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tạo khách hàng. Vui lòng đăng nhập lại.' });
  }
}

function mapCustomerDoc(customer: any) {
  return {
    id: String(customer._id),
    name: customer.name || '',
    tags: Array.isArray(customer.tags) ? customer.tags : [],
    phone: customer.phone || '',
    email: customer.email || '',
    birthday: customer.birthday || '',
    gender: customer.gender || '',
    assignedEmployee: customer.assignedEmployee || '',
    notes: customer.notes || '',
    source: String(customer.source || '').trim(),
    lastVisit: customer.lastVisit || '',
    avatar: customer.avatar || buildInitialAvatar(String(customer.name || '')),
    memberSince: customer.memberSince,
    points: customer.points,
    maxPoints: customer.maxPoints,
    spendingData: customer.spendingData || [],
    history: customer.history || [],
    isWalkIn: false,
    createdAt: customer.createdAt || new Date(0),
  };
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    verifyAuthToken(token);

    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ message: 'Thiếu mã khách hàng.' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(rawId);
    } catch (_e) {
      return res.status(400).json({ message: 'Mã khách hàng không hợp lệ.' });
    }

    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(String(req.body?.phone || '').trim());
    const email = String(req.body?.email || '').trim();
    const birthday = String(req.body?.birthday || '').trim();
    const gender = String(req.body?.gender || '').trim();
    const assignedEmployee = String(req.body?.assignedEmployee || '').trim();
    const source = String(req.body?.source || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const avatarRaw = req.body?.avatar;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại.' });
    }

    const duplicated = await currentDb().collection('customers').findOne({
      _id: { $ne: objectId },
      phone,
    });
    if (duplicated) {
      return res.status(409).json({ message: 'Số điện thoại này đã là khách thành viên.' });
    }

    const updateDoc: Record<string, unknown> = {
      name,
      phone,
      email,
      birthday,
      gender,
      assignedEmployee,
      source,
      notes,
      updatedAt: new Date(),
    };

    if (avatarRaw !== undefined) {
      updateDoc.avatar = String(avatarRaw || '').trim();
    }

    const result = await currentDb()
      .collection('customers')
      .findOneAndUpdate({ _id: objectId }, { $set: updateDoc }, { returnDocument: 'after' });

    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng để cập nhật.' });
    }

    return res.json({ ok: true, customer: mapCustomerDoc(result) });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể cập nhật khách hàng.' });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    verifyAuthToken(token);

    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ message: 'Thiếu mã khách hàng.' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(rawId);
    } catch (_e) {
      return res.status(400).json({ message: 'Mã khách hàng không hợp lệ.' });
    }

    const result = await currentDb().collection('customers').deleteOne({ _id: objectId });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng để xóa.' });
    }

    return res.json({ ok: true });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể xóa khách hàng.' });
  }
}

export async function listCustomers(req: Request, res: Response) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    verifyAuthToken(token);

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize || 15)));
    const skip = (page - 1) * pageSize;
    const qRaw = String(req.query.q || '').trim();
    const col = currentDb().collection('customers');

    const filter: Record<string, unknown> = {};
    if (qRaw) {
      const phoneQ = normalizePhone(qRaw);
      const escapedName = escapeRegex(qRaw);
      const orConditions: Record<string, unknown>[] = [
        { name: { $regex: escapedName, $options: 'i' } },
        { email: { $regex: escapedName, $options: 'i' } },
      ];
      if (phoneQ.length > 0) {
        const escapedPhone = escapeRegex(phoneQ);
        orConditions.push({ phone: { $regex: escapedPhone, $options: 'i' } });
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: { $ifNull: ['$phone', ''] } },
              regex: escapedPhone,
              options: 'i',
            },
          },
        });
      }
      filter.$or = orConditions;
    }

    const [customerDocs, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
      col.countDocuments(filter),
    ]);

    const merged = customerDocs.map((c) => mapCustomerDoc(c));

    return res.json({
      ok: true,
      customers: merged.map(({ createdAt, ...rest }) => rest),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tải danh sách khách hàng.' });
  }
}
