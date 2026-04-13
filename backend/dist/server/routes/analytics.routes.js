"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analyticsRouter = (0, express_1.Router)();
analyticsRouter.get('/dashboard', analytics_controller_1.getDashboardAnalytics);
analyticsRouter.get('/reports', analytics_controller_1.getReportsAnalytics);
analyticsRouter.get('/staff-performance', analytics_controller_1.getStaffPerformance);
analyticsRouter.get('/staff-recent-activities', analytics_controller_1.getStaffRecentActivities);
exports.default = analyticsRouter;
//# sourceMappingURL=analytics.routes.js.map