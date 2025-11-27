import { Router } from 'express';
import authRoutes from './auth.routes';
import dataSourceRoutes from './datasource.routes';
import apiRoutes from './api.routes';
import dynamicRoutes from './dynamic.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/datasources', dataSourceRoutes);
router.use('/apis', apiRoutes);
router.use('/dynamic', dynamicRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Kewen API Platform is running',
    timestamp: Date.now(),
  });
});

export default router;
