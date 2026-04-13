"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
async function login(req, res) {
    try {
        const account = String(req.body?.account || '').trim().toLowerCase();
        const password = String(req.body?.password || '');
        if (!account || !password) {
            return res.status(400).json({ message: 'Thiếu tài khoản hoặc mật khẩu.' });
        }
        const user = await (0, db_1.usersCollection)().findOne({ account });
        if (!user) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
        }
        const storedPassword = String(user.password || '');
        const isHashed = storedPassword.startsWith('$2');
        const isValid = isHashed
            ? await bcryptjs_1.default.compare(password, storedPassword)
            : storedPassword === password;
        if (!isValid) {
            return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
        }
        if (!isHashed) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            await (0, db_1.usersCollection)().updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        }
        const role = String(user.role || 'staff');
        const token = (0, auth_1.signAuthToken)({
            sub: String(user._id),
            account: String(user.account),
            role,
        });
        return res.json({
            ok: true,
            token,
            user: {
                id: String(user._id),
                account: user.account,
                role,
            },
        });
    }
    catch (_error) {
        return res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.' });
    }
}
async function me(req, res) {
    try {
        const token = (0, auth_1.getTokenFromHeader)(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ message: 'Thiếu token xác thực.' });
        }
        const payload = (0, auth_1.verifyAuthToken)(token);
        const userId = String(payload.sub || '');
        if (!userId) {
            return res.status(401).json({ message: 'Token không hợp lệ.' });
        }
        const user = await (0, db_1.usersCollection)().findOne({ _id: new mongodb_1.ObjectId(userId) });
        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại.' });
        }
        return res.json({
            ok: true,
            user: {
                id: String(user._id),
                account: user.account,
                role: user.role || 'staff',
            },
        });
    }
    catch (_error) {
        return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ.' });
    }
}
//# sourceMappingURL=auth.controller.js.map