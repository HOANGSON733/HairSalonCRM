import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

function toDateKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

export async function listAppointments(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const dateRaw = String(req.query.date || '').trim();
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : toDateKey(new Date());

    const appointments = await currentDb()
      .collection('appointments')
      .find({ date: dateKey })
      .sort({ time: 1, createdAt: -1 })
      .toArray();

    return res.json({
      ok: true,
      appointments: appointments.map((item) => ({
        id: String(item._id),
        customerName: String(item.customerName || ''),
        customerPhone: String(item.customerPhone || ''),
        serviceName: String(item.serviceName || ''),
        serviceId: String(item.serviceId || ''),
        stylistName: String(item.stylistName || ''),
        stylistId: String(item.stylistId || ''),
        date: String(item.date || ''),
        time: String(item.time || ''),
        durationMinutes: Number(item.durationMinutes || 60),
        notes: String(item.notes || ''),
        smsReminder: Boolean(item.smsReminder),
        status: String(item.status || 'confirmed'),
      })),
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tải lịch hẹn.' });
  }
}

export async function createAppointment(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const customerName = String(req.body?.customerName || '').trim() || 'Khách đặt lịch';
    const customerPhone = String(req.body?.customerPhone || '').trim();
    const serviceName = String(req.body?.serviceName || '').trim();
    const serviceId = String(req.body?.serviceId || '').trim();
    const stylistName = String(req.body?.stylistName || '').trim();
    const stylistId = String(req.body?.stylistId || '').trim();
    const date = String(req.body?.date || '').trim();
    const time = String(req.body?.time || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const smsReminder = Boolean(req.body?.smsReminder);
    const status = 'confirmed';
    const durationMinutesRaw = Number(req.body?.durationMinutes || 60);
    const durationMinutes = Number.isFinite(durationMinutesRaw) && durationMinutesRaw > 0 ? durationMinutesRaw : 60;

    if (!serviceName || !date || !time) {
      return res.status(400).json({ message: 'Thiếu thông tin dịch vụ, ngày hoặc giờ hẹn.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Ngày hẹn không hợp lệ.' });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'Giờ hẹn không hợp lệ.' });
    }

    const existingConflict = await currentDb().collection('appointments').findOne({
      date,
      time,
      status: { $ne: 'cancelled' },
      ...(stylistId ? { stylistId } : {}),
    });
    if (existingConflict) {
      return res.status(409).json({ message: 'Khung giờ đã được đặt. Vui lòng chọn giờ khác.' });
    }

    const now = new Date();
    const appointment = {
      customerName,
      customerPhone,
      serviceName,
      serviceId,
      stylistName: stylistName || 'Bất kỳ',
      stylistId,
      date,
      time,
      durationMinutes,
      notes,
      smsReminder,
      status,
      createdAt: now,
      updatedAt: now,
    };

    const result = await currentDb().collection('appointments').insertOne(appointment);
    return res.status(201).json({
      ok: true,
      appointment: {
        id: String(result.insertedId),
        ...appointment,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tạo lịch hẹn.' });
  }
}

export async function updateAppointment(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id lịch hẹn không hợp lệ.' });
    }

    const date = String(req.body?.date || '').trim();
    const time = String(req.body?.time || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const status = String(req.body?.status || '').trim();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Ngày hẹn không hợp lệ.' });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'Giờ hẹn không hợp lệ.' });
    }

    const current = await currentDb().collection('appointments').findOne({ _id: new ObjectId(id) });
    if (!current) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
    }

    const stylistId = String(req.body?.stylistId || current.stylistId || '').trim();
    const conflict = await currentDb().collection('appointments').findOne({
      _id: { $ne: new ObjectId(id) },
      date,
      time,
      status: { $ne: 'cancelled' },
      ...(stylistId ? { stylistId } : {}),
    });
    if (conflict) {
      return res.status(409).json({ message: 'Khung giờ đã có lịch. Vui lòng chọn giờ khác.' });
    }

    const updateDoc: any = {
      date,
      time,
      notes,
      updatedAt: new Date(),
    };
    if (status) updateDoc.status = status;
    if (req.body?.customerName !== undefined) updateDoc.customerName = String(req.body.customerName || '').trim();
    if (req.body?.customerPhone !== undefined) updateDoc.customerPhone = String(req.body.customerPhone || '').trim();
    if (req.body?.serviceName !== undefined) updateDoc.serviceName = String(req.body.serviceName || '').trim();
    if (req.body?.serviceId !== undefined) updateDoc.serviceId = String(req.body.serviceId || '').trim();
    if (req.body?.stylistName !== undefined) updateDoc.stylistName = String(req.body.stylistName || '').trim();
    if (req.body?.stylistId !== undefined) updateDoc.stylistId = String(req.body.stylistId || '').trim();
    if (req.body?.durationMinutes !== undefined) {
      const duration = Number(req.body.durationMinutes);
      if (Number.isFinite(duration) && duration > 0) updateDoc.durationMinutes = duration;
    }

    await currentDb().collection('appointments').updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
    return res.json({ ok: true });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật lịch hẹn.' });
  }
}

export async function deleteAppointment(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const id = String(req.params.id || '').trim();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Id lịch hẹn không hợp lệ.' });
    }

    const result = await currentDb().collection('appointments').deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn để xóa.' });
    }
    return res.json({ ok: true, deletedId: id });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa lịch hẹn.' });
  }
}

