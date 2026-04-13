"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServiceCategories = listServiceCategories;
exports.createServiceCategory = createServiceCategory;
exports.deleteServiceCategory = deleteServiceCategory;
exports.updateServiceCategory = updateServiceCategory;
const mongodb_1 = require("mongodb");
const auth_1 = require("../lib/auth");
const db_1 = require("../lib/db");
async function requireAuth(req, res) {
    const token = (0, auth_1.getTokenFromHeader)(req.headers.authorization);
    if (!token) {
        res.status(401).json({ message: 'Thiếu token xác thực.' });
        return false;
    }
    (0, auth_1.verifyAuthToken)(token);
    return true;
}
async function listServiceCategories(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const categories = await (0, db_1.currentDb)()
            .collection('service_categories')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        return res.json({
            ok: true,
            categories: categories.map((item) => ({
                id: String(item._id),
                name: item.name || '',
                icon: item.icon || 'scissors',
                color: item.color || '#4a0e0e',
                description: item.description || '',
                isVisible: item.isVisible !== false,
            })),
        });
    }
    catch (_error) {
        return res.status(401).json({ message: 'Không thể tải danh mục dịch vụ.' });
    }
}
async function createServiceCategory(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const name = String(req.body?.name || '').trim();
        const icon = String(req.body?.selectedIcon || req.body?.icon || 'scissors').trim();
        const color = String(req.body?.selectedColor || req.body?.color || '#4a0e0e').trim();
        const description = String(req.body?.description || '').trim();
        const isVisible = req.body?.isVisible !== false;
        if (!name) {
            return res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });
        }
        const duplicate = await (0, db_1.currentDb)().collection('service_categories').findOne({
            normalizedName: name.toLowerCase(),
        });
        if (duplicate) {
            return res.status(409).json({ message: 'Danh mục đã tồn tại.' });
        }
        const now = new Date();
        const category = {
            name,
            normalizedName: name.toLowerCase(),
            icon,
            color,
            description,
            isVisible,
            createdAt: now,
            updatedAt: now,
        };
        const result = await (0, db_1.currentDb)().collection('service_categories').insertOne(category);
        return res.status(201).json({
            ok: true,
            category: {
                id: String(result.insertedId),
                name,
                icon,
                color,
                description,
                isVisible,
            },
        });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể tạo danh mục dịch vụ.' });
    }
}
async function deleteServiceCategory(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const categoryId = String(req.params.id || '').trim();
        if (!categoryId || !mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Id danh mục không hợp lệ.' });
        }
        const category = await (0, db_1.currentDb)().collection('service_categories').findOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        }
        const replacementCategoryName = String(req.body?.replacementCategoryName || '').trim();
        const usedCount = await (0, db_1.currentDb)().collection('services').countDocuments({ category: category.name });
        if (usedCount > 0) {
            if (!replacementCategoryName) {
                return res.status(409).json({ message: 'Danh mục đang có dịch vụ. Vui lòng chọn danh mục thay thế.' });
            }
            if (replacementCategoryName === category.name) {
                return res.status(400).json({ message: 'Danh mục thay thế phải khác danh mục đang xóa.' });
            }
            const replacement = await (0, db_1.currentDb)().collection('service_categories').findOne({ name: replacementCategoryName });
            if (!replacement) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục thay thế.' });
            }
            await (0, db_1.currentDb)()
                .collection('services')
                .updateMany({ category: category.name }, { $set: { category: replacementCategoryName, updatedAt: new Date() } });
        }
        await (0, db_1.currentDb)().collection('service_categories').deleteOne({ _id: new mongodb_1.ObjectId(categoryId) });
        return res.json({ ok: true, deletedId: categoryId });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể xóa danh mục dịch vụ.' });
    }
}
async function updateServiceCategory(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const categoryId = String(req.params.id || '').trim();
        if (!categoryId || !mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Id danh mục không hợp lệ.' });
        }
        const current = await (0, db_1.currentDb)().collection('service_categories').findOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (!current) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
        }
        const name = String(req.body?.name || '').trim();
        const icon = String(req.body?.selectedIcon || req.body?.icon || current.icon || 'scissors').trim();
        const color = String(req.body?.selectedColor || req.body?.color || current.color || '#4a0e0e').trim();
        const description = String(req.body?.description || '').trim();
        const isVisible = req.body?.isVisible !== false;
        if (!name) {
            return res.status(400).json({ message: 'Vui lòng nhập tên danh mục.' });
        }
        const duplicated = await (0, db_1.currentDb)().collection('service_categories').findOne({
            normalizedName: name.toLowerCase(),
            _id: { $ne: new mongodb_1.ObjectId(categoryId) },
        });
        if (duplicated) {
            return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
        }
        await (0, db_1.currentDb)().collection('service_categories').updateOne({ _id: new mongodb_1.ObjectId(categoryId) }, {
            $set: {
                name,
                normalizedName: name.toLowerCase(),
                icon,
                color,
                description,
                isVisible,
                updatedAt: new Date(),
            },
        });
        if (current.name !== name) {
            await (0, db_1.currentDb)()
                .collection('services')
                .updateMany({ category: current.name }, { $set: { category: name, updatedAt: new Date() } });
        }
        return res.json({
            ok: true,
            category: {
                id: categoryId,
                name,
                icon,
                color,
                description,
                isVisible,
            },
        });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể cập nhật danh mục dịch vụ.' });
    }
}
//# sourceMappingURL=serviceCategories.controller.js.map