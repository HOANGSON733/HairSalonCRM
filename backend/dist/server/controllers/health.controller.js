"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = health;
const config_1 = require("../config");
const db_1 = require("../lib/db");
async function health(_req, res) {
    try {
        await (0, db_1.currentDb)().command({ ping: 1 });
        return res.json({ ok: true, db: config_1.config.dbName });
    }
    catch (_error) {
        return res.status(500).json({ ok: false, message: 'MongoDB not available' });
    }
}
//# sourceMappingURL=health.controller.js.map