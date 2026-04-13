import { Router } from 'express';
import { getDashboardAnalytics, getReportsAnalytics, getStaffPerformance, getStaffRecentActivities } from '../controllers/analytics.controller.ts';

const analyticsRouter = Router();

analyticsRouter.get('/dashboard', getDashboardAnalytics);
analyticsRouter.get('/reports', getReportsAnalytics);
analyticsRouter.get('/staff-performance', getStaffPerformance);
analyticsRouter.get('/staff-recent-activities', getStaffRecentActivities);

export default analyticsRouter;

