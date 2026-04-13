"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = signAuthToken;
exports.verifyAuthToken = verifyAuthToken;
exports.getTokenFromHeader = getTokenFromHeader;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function signAuthToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, { expiresIn: '7d' });
}
function verifyAuthToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
}
function getTokenFromHeader(header) {
    if (!header)
        return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token)
        return null;
    return token;
}
//# sourceMappingURL=auth.js.map