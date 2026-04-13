"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = listServices;
exports.createService = createService;
exports.updateService = updateService;
exports.deleteService = deleteService;
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
async function listServices(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const services = await (0, db_1.currentDb)()
            .collection('services')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        return res.json({
            ok: true,
            services: services.map((service) => ({
                id: String(service._id),
                name: service.name || '',
                duration: service.duration || '',
                price: service.price || '',
                maxPrice: service.maxPrice || '',
                cost: service.cost,
                commissionRate: service.commissionRate === 0 ? 0 : service.commissionRate ? Number(service.commissionRate) : undefined,
                description: service.description || '',
                image: service.image || '',
                category: service.category || '',
                popularity: service.popularity ? Number(service.popularity) : undefined,
                tags: Array.isArray(service.tags) ? service.tags : undefined,
                gender: service.gender,
            })),
        });
    }
    catch (_error) {
        return res.status(401).json({ message: 'Không thể tải danh sách dịch vụ.' });
    }
}
async function createService(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const name = String(req.body?.name || '').trim();
        const category = String(req.body?.category || '').trim();
        const description = String(req.body?.description || '').trim();
        const duration = String(req.body?.duration || '').trim();
        const price = String(req.body?.price || '').trim();
        const maxPrice = String(req.body?.maxPrice || '').trim();
        const image = String(req.body?.image || '').trim();
        const cost = req.body?.cost !== undefined ? String(req.body.cost || '').trim() : undefined;
        const commissionRate = req.body?.commissionRate !== undefined && req.body?.commissionRate !== null
            ? Number(req.body.commissionRate)
            : undefined;
        const popularity = req.body?.popularity !== undefined && req.body?.popularity !== null ? Number(req.body.popularity) : undefined;
        const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((t) => String(t)) : undefined;
        const gender = req.body?.gender !== undefined ? String(req.body.gender || '').trim() : undefined;
        if (!name || !category || !duration || !price) {
            return res.status(400).json({ message: 'Vui lòng nhập tên, danh mục, thời lượng và giá.' });
        }
        const categoryExists = await (0, db_1.currentDb)().collection('service_categories').findOne({ name: category });
        if (!categoryExists) {
            return res.status(400).json({ message: 'Danh mục dịch vụ không tồn tại trong Hệ thống.' });
        }
        const now = new Date();
        const service = {
            name,
            category,
            description: description || '—',
            duration,
            price,
            ...(maxPrice ? { maxPrice } : {}),
            image,
            ...(cost ? { cost } : {}),
            ...(Number.isFinite(commissionRate) ? { commissionRate } : {}),
            ...(Number.isFinite(popularity) ? { popularity } : {}),
            ...(tags && tags.length ? { tags } : {}),
            ...(gender ? { gender } : {}),
            createdAt: now,
            updatedAt: now,
        };
        const result = await (0, db_1.currentDb)().collection('services').insertOne(service);
        return res.status(201).json({
            ok: true,
            service: {
                id: String(result.insertedId),
                ...service,
            },
        });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể tạo dịch vụ mới.' });
    }
}
async function updateService(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const serviceId = String(req.params.id || '').trim();
        if (!serviceId || !mongodb_1.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: 'Id dịch vụ không hợp lệ.' });
        }
        const name = String(req.body?.name || '').trim();
        const category = String(req.body?.category || '').trim();
        const description = String(req.body?.description || '').trim();
        const duration = String(req.body?.duration || '').trim();
        const price = String(req.body?.price || '').trim();
        const maxPrice = String(req.body?.maxPrice || '').trim();
        const image = String(req.body?.image || '').trim();
        const cost = req.body?.cost !== undefined ? String(req.body.cost || '').trim() : undefined;
        const commissionRate = req.body?.commissionRate !== undefined && req.body?.commissionRate !== null
            ? Number(req.body.commissionRate)
            : undefined;
        const popularity = req.body?.popularity !== undefined && req.body?.popularity !== null ? Number(req.body.popularity) : undefined;
        const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((t) => String(t)) : undefined;
        const gender = req.body?.gender !== undefined ? String(req.body.gender || '').trim() : undefined;
        if (!name || !category || !duration || !price) {
            return res.status(400).json({ message: 'Vui lòng nhập tên, danh mục, thời lượng và giá.' });
        }
        const categoryExists = await (0, db_1.currentDb)().collection('service_categories').findOne({ name: category });
        if (!categoryExists) {
            return res.status(400).json({ message: 'Danh mục dịch vụ không tồn tại trong Hệ thống.' });
        }
        const current = await (0, db_1.currentDb)().collection('services').findOne({ _id: new mongodb_1.ObjectId(serviceId) });
        if (!current) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ.' });
        }
        const updated = {
            name,
            category,
            description: description || '—',
            duration,
            price,
            image,
            updatedAt: new Date(),
        };
        if (maxPrice)
            updated.maxPrice = maxPrice;
        if (cost !== undefined)
            updated.cost = cost;
        if (commissionRate !== undefined && Number.isFinite(commissionRate))
            updated.commissionRate = commissionRate;
        if (popularity !== undefined && Number.isFinite(popularity))
            updated.popularity = popularity;
        if (tags !== undefined)
            updated.tags = tags;
        if (gender !== undefined)
            updated.gender = gender;
        await (0, db_1.currentDb)()
            .collection('services')
            .updateOne({ _id: new mongodb_1.ObjectId(serviceId) }, { $set: updated });
        return res.json({
            ok: true,
            service: {
                id: serviceId,
                ...current,
                ...updated,
            },
        });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể cập nhật dịch vụ.' });
    }
}
async function deleteService(req, res) {
    try {
        if (!(await requireAuth(req, res)))
            return;
        const serviceId = String(req.params.id || '').trim();
        if (!serviceId || !mongodb_1.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ message: 'Id dịch vụ không hợp lệ.' });
        }
        const result = await (0, db_1.currentDb)().collection('services').deleteOne({ _id: new mongodb_1.ObjectId(serviceId) });
        if (!result.deletedCount) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ để xóa.' });
        }
        return res.json({ ok: true, deletedId: serviceId });
    }
    catch (_error) {
        return res.status(400).json({ message: 'Không thể xóa dịch vụ.' });
    }
}
//# sourceMappingURL=services.controller.js.map