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

export async function listProductCategories(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;
    const categories = await currentDb().collection('product_categories').find({}).sort({ createdAt: -1 }).toArray();
    return res.json({
      ok: true,
      categories: categories.map((item) => ({
        id: String(item._id),
        name: item.name || '',
        icon: item.icon || 'sparkles',
        color: item.color || '#4a0e0e',
        description: item.description || '',
        isVisible: item.isVisible !== false,
      })),
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tải danh mục sản phẩm.' });
  }
}

export async function createProductCategory(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;
    const name = String(req.body?.name || '').trim();
    const icon = String(req.body?.selectedIcon || req.body?.icon || 'sparkles').trim();
    const color = String(req.body?.selectedColor || req.body?.color || '#4a0e0e').trim();
    const description = String(req.body?.description || '').trim();
    const isVisible = req.body?.isVisible !== false;
    if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });

    const dup = await currentDb().collection('product_categories').findOne({ normalizedName: name.toLowerCase() });
    if (dup) return res.status(409).json({ message: 'Danh mục đã tồn tại.' });

    const now = new Date();
    const doc = { name, normalizedName: name.toLowerCase(), icon, color, description, isVisible, createdAt: now, updatedAt: now };
    const result = await currentDb().collection('product_categories').insertOne(doc);
    return res.status(201).json({ ok: true, category: { id: String(result.insertedId), name, icon, color, description, isVisible } });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tạo danh mục sản phẩm.' });
  }
}

export async function updateProductCategory(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;
    const categoryId = String(req.params.id || '').trim();
    if (!categoryId || !ObjectId.isValid(categoryId)) return res.status(400).json({ message: 'Id danh mục không hợp lệ.' });

    const current = await currentDb().collection('product_categories').findOne({ _id: new ObjectId(categoryId) });
    if (!current) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });

    const name = String(req.body?.name || '').trim();
    const icon = String(req.body?.selectedIcon || req.body?.icon || current.icon || 'sparkles').trim();
    const color = String(req.body?.selectedColor || req.body?.color || current.color || '#4a0e0e').trim();
    const description = String(req.body?.description || '').trim();
    const isVisible = req.body?.isVisible !== false;
    if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });

    const dup = await currentDb().collection('product_categories').findOne({
      normalizedName: name.toLowerCase(),
      _id: { $ne: new ObjectId(categoryId) },
    });
    if (dup) return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });

    await currentDb().collection('product_categories').updateOne(
      { _id: new ObjectId(categoryId) },
      { $set: { name, normalizedName: name.toLowerCase(), icon, color, description, isVisible, updatedAt: new Date() } }
    );
    if (current.name !== name) {
      await currentDb().collection('products').updateMany({ category: current.name }, { $set: { category: name, updatedAt: new Date() } });
    }

    return res.json({ ok: true, category: { id: categoryId, name, icon, color, description, isVisible } });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật danh mục sản phẩm.' });
  }
}

export async function deleteProductCategory(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;
    const categoryId = String(req.params.id || '').trim();
    if (!categoryId || !ObjectId.isValid(categoryId)) return res.status(400).json({ message: 'Id danh mục không hợp lệ.' });

    const current = await currentDb().collection('product_categories').findOne({ _id: new ObjectId(categoryId) });
    if (!current) return res.status(404).json({ message: 'Không tìm thấy danh mục.' });

    const replacementCategoryName = String(req.body?.replacementCategoryName || '').trim();
    const usedCount = await currentDb().collection('products').countDocuments({ category: current.name });
    if (usedCount > 0) {
      if (!replacementCategoryName) return res.status(409).json({ message: 'Danh mục đang có sản phẩm. Vui lòng chọn danh mục thay thế.' });
      if (replacementCategoryName === current.name) return res.status(400).json({ message: 'Danh mục thay thế phải khác danh mục đang xóa.' });
      const replacement = await currentDb().collection('product_categories').findOne({ name: replacementCategoryName });
      if (!replacement) return res.status(404).json({ message: 'Không tìm thấy danh mục thay thế.' });
      await currentDb().collection('products').updateMany(
        { category: current.name },
        { $set: { category: replacementCategoryName, updatedAt: new Date() } }
      );
    }

    await currentDb().collection('product_categories').deleteOne({ _id: new ObjectId(categoryId) });
    return res.json({ ok: true, deletedId: categoryId });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa danh mục sản phẩm.' });
  }
}
