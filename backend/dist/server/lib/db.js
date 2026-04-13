"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentDb = exports.usersCollection = void 0;
exports.connectMongo = connectMongo;
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const client = new mongodb_1.MongoClient(config_1.config.mongoUri);
async function connectMongo() {
    await client.connect();
    const db = client.db(config_1.config.dbName);
    await db.command({ ping: 1 });
    await db.collection('users').createIndex({ account: 1 }, { unique: true });
    await db.collection('products').createIndex({ sku: 1 }, { unique: true, sparse: true });
    await db.collection('service_categories').createIndex({ normalizedName: 1 }, { unique: true });
    await db.collection('product_categories').createIndex({ normalizedName: 1 }, { unique: true });
    await db.collection('pos_orders').createIndex({ createdAt: -1 });
    await db.collection('appointments').createIndex({ date: 1, time: 1, stylistId: 1 });
    await db.collection('customer_sources').createIndex({ normalizedName: 1 }, { unique: true });
    await seedDefaultServiceCategories();
    await seedDefaultProductCategories();
    await seedDefaultCustomerSources();
    await seedAdminUser();
    console.log(`MongoDB connected: ${config_1.config.dbName}`);
}
const usersCollection = () => client.db(config_1.config.dbName).collection('users');
exports.usersCollection = usersCollection;
const currentDb = () => client.db(config_1.config.dbName);
exports.currentDb = currentDb;
async function seedAdminUser() {
    const account = String(process.env.SEED_ADMIN_ACCOUNT || '')
        .trim()
        .toLowerCase();
    const password = String(process.env.SEED_ADMIN_PASSWORD || '');
    const role = String(process.env.SEED_ADMIN_ROLE || 'admin').trim() || 'admin';
    if (!account || !password)
        return;
    const users = (0, exports.usersCollection)();
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const result = await users.updateOne({ account }, {
        $setOnInsert: {
            account,
            password: hashedPassword,
            role,
            createdAt: new Date(),
        },
    }, { upsert: true });
    if (result.upsertedCount) {
        console.log(`Seeded admin account: ${account}`);
    }
}
async function seedDefaultServiceCategories() {
    const defaults = [
        { name: 'Cắt & Tạo Kiểu', icon: 'scissors', color: '#4a0e0e' },
        { name: 'Hóa Chất', icon: 'palette', color: '#c5a059' },
        { name: 'Phục Hồi', icon: 'sparkles', color: '#1a1a1a' },
    ];
    const categories = (0, exports.currentDb)().collection('service_categories');
    for (const item of defaults) {
        await categories.updateOne({ normalizedName: item.name.toLowerCase() }, {
            $setOnInsert: {
                ...item,
                normalizedName: item.name.toLowerCase(),
                description: '',
                isVisible: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }, { upsert: true });
    }
}
const DEFAULT_CUSTOMER_SOURCE_NAMES = [
    'Facebook',
    'Instagram',
    'TikTok',
    'Zalo',
    'Google / Website',
    'Người quen giới thiệu',
    'Vãng lai',
];
async function seedDefaultCustomerSources() {
    const col = (0, exports.currentDb)().collection('customer_sources');
    let order = 0;
    for (const name of DEFAULT_CUSTOMER_SOURCE_NAMES) {
        const normalizedName = name.toLowerCase();
        await col.updateOne({ normalizedName }, {
            $setOnInsert: {
                name,
                normalizedName,
                sortOrder: order,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }, { upsert: true });
        order += 1;
    }
}
async function seedDefaultProductCategories() {
    const defaults = [
        { name: 'Dưỡng tóc & Phục hồi', icon: 'sparkles', color: '#4a0e0e' },
        { name: 'Dầu gội & Dầu xả', icon: 'coffee', color: '#c5a059' },
        { name: 'Tạo kiểu', icon: 'scissors', color: '#1a1a1a' },
    ];
    const categories = (0, exports.currentDb)().collection('product_categories');
    for (const item of defaults) {
        await categories.updateOne({ normalizedName: item.name.toLowerCase() }, {
            $setOnInsert: {
                ...item,
                normalizedName: item.name.toLowerCase(),
                description: '',
                isVisible: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        }, { upsert: true });
    }
}
//# sourceMappingURL=db.js.map