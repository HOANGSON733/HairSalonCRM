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

function normalizeStatus(stock: number) {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 5) return 'low-stock';
  return 'in-stock';
}

export async function listProducts(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 12)));
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      currentDb()
        .collection('products')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      currentDb().collection('products').countDocuments({}),
    ]);

    return res.json({
      ok: true,
      products: products.map((product) => ({
        id: String(product._id),
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        sku: product.sku || '',
        volume: product.volume || '',
        description: product.description || '',
        sellingPrice: product.sellingPrice || '0',
        costPrice: product.costPrice || '0',
        stock: Number(product.stock || 0),
        maxStock: Number(product.maxStock || 1),
        image: product.image || '',
        status: product.status || normalizeStatus(Number(product.stock || 0)),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Không thể tải danh sách sản phẩm.' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const name = String(req.body?.name || '').trim();
    const brand = String(req.body?.brand || '').trim();
    const category = String(req.body?.category || '').trim();
    const sku = String(req.body?.sku || '').trim().toUpperCase();
    const volume = String(req.body?.volume || '').trim();
    const description = String(req.body?.description || '').trim();
    const sellingPrice = String(req.body?.sellingPrice || '').trim();
    const costPrice = String(req.body?.costPrice || '').trim();
    const image = String(req.body?.image || '').trim();
    const stock = Number(req.body?.stock || 0);
    const maxStock = Math.max(1, Number(req.body?.maxStock || 1));

    if (!name || !brand || !category) {
      return res.status(400).json({ message: 'Vui lòng nhập tên sản phẩm, thương hiệu và danh mục.' });
    }

    const categoryExists = await currentDb().collection('product_categories').findOne({ name: category });
    if (!categoryExists) {
      return res.status(400).json({ message: 'Danh mục sản phẩm không tồn tại trong Hệ thống.' });
    }

    if (sku) {
      const duplicatedSku = await currentDb().collection('products').findOne({ sku });
      if (duplicatedSku) {
        return res.status(409).json({ message: 'Mã SKU đã tồn tại.' });
      }
    }

    const now = new Date();
    const product = {
      name,
      brand,
      category,
      ...(sku ? { sku } : {}),
      ...(volume ? { volume } : {}),
      description: description || '—',
      sellingPrice: sellingPrice || '0',
      costPrice: costPrice || '0',
      stock: Number.isFinite(stock) ? stock : 0,
      maxStock: Number.isFinite(maxStock) ? maxStock : 1,
      image,
      status: normalizeStatus(Number.isFinite(stock) ? stock : 0),
      createdAt: now,
      updatedAt: now,
    };

    const result = await currentDb().collection('products').insertOne(product);

    return res.status(201).json({
      ok: true,
      product: {
        id: String(result.insertedId),
        ...product,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể tạo sản phẩm mới.' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const productId = String(req.params.id || '').trim();
    if (!productId || !ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Id sản phẩm không hợp lệ.' });
    }

    const name = String(req.body?.name || '').trim();
    const brand = String(req.body?.brand || '').trim();
    const category = String(req.body?.category || '').trim();
    const sku = String(req.body?.sku || '').trim().toUpperCase();
    const volume = String(req.body?.volume || '').trim();
    const description = String(req.body?.description || '').trim();
    const sellingPrice = String(req.body?.sellingPrice || '').trim();
    const costPrice = String(req.body?.costPrice || '').trim();
    const image = String(req.body?.image || '').trim();
    const stock = Number(req.body?.stock || 0);
    const maxStock = Math.max(1, Number(req.body?.maxStock || 1));

    if (!name || !brand || !category) {
      return res.status(400).json({ message: 'Vui lòng nhập tên sản phẩm, thương hiệu và danh mục.' });
    }

    const categoryExists = await currentDb().collection('product_categories').findOne({ name: category });
    if (!categoryExists) {
      return res.status(400).json({ message: 'Danh mục sản phẩm không tồn tại trong Hệ thống.' });
    }

    const current = await currentDb().collection('products').findOne({ _id: new ObjectId(productId) });
    if (!current) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (sku) {
      const duplicatedSku = await currentDb().collection('products').findOne({
        sku,
        _id: { $ne: new ObjectId(productId) },
      });
      if (duplicatedSku) {
        return res.status(409).json({ message: 'Mã SKU đã tồn tại.' });
      }
    }

    const updated = {
      name,
      brand,
      category,
      ...(sku ? { sku } : {}),
      ...(volume ? { volume } : {}),
      description: description || '—',
      sellingPrice: sellingPrice || '0',
      costPrice: costPrice || '0',
      stock: Number.isFinite(stock) ? stock : 0,
      maxStock: Number.isFinite(maxStock) ? maxStock : 1,
      image,
      status: normalizeStatus(Number.isFinite(stock) ? stock : 0),
      updatedAt: new Date(),
    };

    await currentDb().collection('products').updateOne({ _id: new ObjectId(productId) }, { $set: updated });

    return res.json({
      ok: true,
      product: {
        id: productId,
        ...current,
        ...updated,
      },
    });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể cập nhật sản phẩm.' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const productId = String(req.params.id || '').trim();
    if (!productId || !ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Id sản phẩm không hợp lệ.' });
    }

    const result = await currentDb().collection('products').deleteOne({ _id: new ObjectId(productId) });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa.' });
    }

    return res.json({ ok: true, deletedId: productId });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể xóa sản phẩm.' });
  }
}

export async function restockProduct(req: Request, res: Response) {
  try {
    if (!(await requireAuth(req, res))) return;

    const productId = String(req.params.id || '').trim();
    if (!productId || !ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Id sản phẩm không hợp lệ.' });
    }

    const amount = Number(req.body?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Số lượng nhập kho phải lớn hơn 0.' });
    }

    const current = await currentDb().collection('products').findOne({ _id: new ObjectId(productId) });
    if (!current) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    const nextStock = Math.max(0, Number(current.stock || 0) + amount);
    const update = {
      stock: nextStock,
      status: normalizeStatus(nextStock),
      updatedAt: new Date(),
    };

    await currentDb().collection('products').updateOne({ _id: new ObjectId(productId) }, { $set: update });
    return res.json({ ok: true, product: { id: productId, ...current, ...update } });
  } catch (_error) {
    return res.status(400).json({ message: 'Không thể nhập kho sản phẩm.' });
  }
}
