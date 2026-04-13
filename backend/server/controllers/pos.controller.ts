import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyAuthToken } from '../lib/auth';
import { currentDb } from '../lib/db';

function formatDateVi(date: Date) {
  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function getLast6MonthBuckets(now: Date) {
  const months: { key: string; month: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, month: `T${d.getMonth() + 1}` });
  }
  return months;
}

function buildUpdatedSpendingData(
  existing: Array<{ month?: string; value?: number }> | undefined,
  amountToAdd: number,
  now: Date
) {
  const buckets = getLast6MonthBuckets(now);
  const keyByLabel = new Map<string, string>();
  const valuesByKey = new Map<string, number>();

  buckets.forEach((bucket) => {
    keyByLabel.set(bucket.month, bucket.key);
    valuesByKey.set(bucket.key, 0);
  });

  (existing || []).forEach((item) => {
    const key = keyByLabel.get(String(item?.month || '').trim());
    if (!key) return;
    const value = Number(item?.value || 0);
    valuesByKey.set(key, Number.isFinite(value) ? value : 0);
  });

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  valuesByKey.set(currentKey, (valuesByKey.get(currentKey) || 0) + Math.round(amountToAdd));

  return buckets.map((bucket) => ({
    month: bucket.month,
    value: valuesByKey.get(bucket.key) || 0,
  }));
}

async function requireAuth(req: Request, res: Response) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: 'Thiếu token xác thực.' });
    return null;
  }
  const payload = verifyAuthToken(token);
  return payload;
}

type CheckoutItem = {
  type: 'service' | 'product';
  refId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  staff?: string;
};

export async function checkoutPosOrder(req: Request, res: Response) {
  try {
    const authPayload = await requireAuth(req, res);
    if (!authPayload) return;

    const customerIdRaw = String(req.body?.customerId || '').trim();
    const customerNameRaw = String(req.body?.customerName || '').trim();
    const isWalkIn = Boolean(req.body?.isWalkIn);
    const paymentMethod = String(req.body?.paymentMethod || 'cash').trim();
    const receivedAmount = Number(req.body?.receivedAmount || 0);
    const tipPercent = Number(req.body?.tipPercent || 0);
    const isVatEnabled = Boolean(req.body?.isVatEnabled);

    const items: CheckoutItem[] = Array.isArray(req.body?.items)
      ? req.body.items.map((i: any) => ({
          type: i?.type === 'product' ? 'product' : 'service',
          refId: i?.refId ? String(i.refId) : undefined,
          name: String(i?.name || ''),
          quantity: Number(i?.quantity || 0),
          unitPrice: Number(i?.unitPrice || 0),
          discountAmount: Number(i?.discountAmount || 0),
          staff: i?.staff ? String(i.staff) : undefined,
        }))
      : [];

    if (!items.length) {
      return res.status(400).json({ message: 'Đơn hàng trống.' });
    }

    for (const item of items) {
      if (!item.name || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Dòng đơn hàng không hợp lệ.' });
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        return res.status(400).json({ message: 'Đơn giá không hợp lệ.' });
      }
      if (!Number.isFinite(item.discountAmount) || Number(item.discountAmount) < 0) {
        return res.status(400).json({ message: 'Giảm giá theo dòng không hợp lệ.' });
      }
      if (Number(item.discountAmount) > item.unitPrice * item.quantity) {
        return res.status(400).json({ message: 'Giảm giá theo dòng vượt quá thành tiền dòng.' });
      }
    }

    const lineItemsTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const lineDiscountTotal = items.reduce(
      (sum, i) => sum + Math.min(i.unitPrice * i.quantity, Math.max(0, Math.round(Number(i.discountAmount || 0)))),
      0
    );
    const subtotal = lineItemsTotal - lineDiscountTotal;

    let discount = 0;
    if (!isWalkIn && customerIdRaw && ObjectId.isValid(customerIdRaw)) {
      const customer = await currentDb().collection('customers').findOne({ _id: new ObjectId(customerIdRaw) });
      const tags = Array.isArray(customer?.tags) ? customer?.tags : [];
      const isVip = tags.some((t: unknown) => /vip/i.test(String(t)));
      if (isVip) discount = subtotal * 0.1;
    }

    const afterDiscount = subtotal - discount;
    const tipAmount = Math.round((afterDiscount * (Number.isFinite(tipPercent) ? tipPercent : 0)) / 100);
    const vat = isVatEnabled ? Math.round(afterDiscount * 0.1) : 0;
    const total = afterDiscount + tipAmount + vat;

    if (paymentMethod === 'cash' && (!Number.isFinite(receivedAmount) || receivedAmount < total)) {
      return res.status(400).json({ message: 'Số tiền nhận chưa đủ.' });
    }

    const now = new Date();

    // Decrement stock for product lines (best-effort atomic per product).
    for (const item of items.filter((i) => i.type === 'product')) {
      if (!item.refId || !ObjectId.isValid(item.refId)) {
        return res.status(400).json({ message: `Thiếu refId sản phẩm cho "${item.name}".` });
      }
      const productId = new ObjectId(item.refId);
      const result = await currentDb().collection('products').updateOne(
        { _id: productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity }, $set: { updatedAt: now } }
      );
      if (!result.matchedCount) {
        return res.status(409).json({ message: `Tồn kho không đủ cho "${item.name}".` });
      }
    }

    const orderDoc = {
      customerId: !isWalkIn && customerIdRaw && ObjectId.isValid(customerIdRaw) ? new ObjectId(customerIdRaw) : null,
      customerName: !isWalkIn ? customerNameRaw : 'Khách vãng lai',
      isWalkIn,
      paymentMethod,
      receivedAmount: Number.isFinite(receivedAmount) ? receivedAmount : 0,
      tipPercent: Number.isFinite(tipPercent) ? tipPercent : 0,
      isVatEnabled,
      totals: {
        lineItemsTotal,
        lineDiscountTotal,
        subtotal,
        discount,
        tipAmount,
        vat,
        total,
        change: paymentMethod === 'cash' ? (receivedAmount - total) : 0,
      },
      items: items.map((i) => ({
        type: i.type,
        refId: i.refId && ObjectId.isValid(i.refId) ? new ObjectId(i.refId) : null,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: Math.max(0, Math.round(Number(i.discountAmount || 0))),
        staff: i.staff || '',
        lineTotal: i.unitPrice * i.quantity,
        lineDiscount: Math.min(i.unitPrice * i.quantity, Math.max(0, Math.round(Number(i.discountAmount || 0)))),
        lineNetTotal: Math.max(0, Math.round(i.unitPrice * i.quantity - Math.min(i.unitPrice * i.quantity, Math.max(0, Math.round(Number(i.discountAmount || 0)))))),
      })),
      createdBy: {
        userId: authPayload.sub ? String(authPayload.sub) : '',
        account: authPayload.account ? String(authPayload.account) : '',
        role: authPayload.role ? String(authPayload.role) : '',
      },
      createdAt: now,
    };

    const result = await currentDb().collection('pos_orders').insertOne(orderDoc);

    let updatedCustomer: any = null;
    if (!isWalkIn && customerIdRaw && ObjectId.isValid(customerIdRaw)) {
      const customerId = new ObjectId(customerIdRaw);
      const currentCustomer = await currentDb().collection('customers').findOne({ _id: customerId });
      const pointsEarned = Math.max(0, Math.floor(total / 10000)); // same rule as POS UI (demo)
      const servicesSummary = items
        .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
        .slice(0, 6)
        .join(', ');
      const staffNames = Array.from(
        new Set(items.map((i) => String(i.staff || '')).filter(Boolean))
      );

      const historyItem = {
        date: formatDateVi(now),
        service: servicesSummary || 'POS',
        stylist: staffNames.join(', ') || 'POS',
        price: `${Math.round(total).toLocaleString('vi-VN')}₫`,
        orderId: String(result.insertedId),
      };

      await currentDb().collection('customers').updateOne(
        { _id: customerId },
        {
          $set: {
            lastVisit: formatDateVi(now),
            updatedAt: now,
            spendingData: buildUpdatedSpendingData(
              Array.isArray(currentCustomer?.spendingData) ? currentCustomer.spendingData : [],
              total,
              now
            ),
          },
          $inc: { points: pointsEarned },
          $push: { history: { $each: [historyItem], $position: 0 } },
        } as any
      );

      updatedCustomer = await currentDb().collection('customers').findOne({ _id: customerId });
    }

    return res.status(201).json({
      ok: true,
      order: {
        id: String(result.insertedId),
        totals: orderDoc.totals,
        createdAt: orderDoc.createdAt,
      },
      customer: updatedCustomer
        ? {
            id: String(updatedCustomer._id),
            name: updatedCustomer.name || '',
            tags: Array.isArray(updatedCustomer.tags) ? updatedCustomer.tags : [],
            phone: updatedCustomer.phone || '',
            email: updatedCustomer.email || '',
            lastVisit: updatedCustomer.lastVisit || formatDateVi(now),
            avatar: updatedCustomer.avatar || '',
            memberSince: updatedCustomer.memberSince,
            points: updatedCustomer.points,
            maxPoints: updatedCustomer.maxPoints,
            spendingData: updatedCustomer.spendingData || [],
            history: updatedCustomer.history || [],
            isWalkIn: false,
          }
        : null,
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể thanh toán POS.' });
  }
}

