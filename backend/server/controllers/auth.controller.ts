import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { usersCollection } from '../lib/db';
import { getTokenFromHeader, signAuthToken, verifyAuthToken } from '../lib/auth';

export async function login(req: Request, res: Response) {
  try {
    const account = String(req.body?.account || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!account || !password) {
      return res.status(400).json({ message: 'Thiếu tài khoản hoặc mật khẩu.' });
    }

    const user = await usersCollection().findOne({ account });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    const storedPassword = String(user.password || '');
    const isHashed = storedPassword.startsWith('$2');
    const isValid = isHashed
      ? await bcrypt.compare(password, storedPassword)
      : storedPassword === password;

    if (!isValid) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    if (!isHashed) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await usersCollection().updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
    }

    const role = String(user.role || 'staff');
    const token = signAuthToken({
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
  } catch (_error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Thiếu token xác thực.' });
    }

    const payload = verifyAuthToken(token);
    const userId = String(payload.sub || '');
    if (!userId) {
      return res.status(401).json({ message: 'Token không hợp lệ.' });
    }

    const user = await usersCollection().findOne({ _id: new ObjectId(userId) });
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
  } catch (_error) {
    return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ.' });
  }
}
