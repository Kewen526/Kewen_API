import { Router } from 'express';
import { body, param } from 'express-validator';
import { ApiController } from '../controllers/ApiController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('path').trim().notEmpty().withMessage('Path is required'),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Invalid HTTP method'),
    body('dataSourceId').isUUID().withMessage('Invalid data source ID'),
    body('sql').trim().notEmpty().withMessage('SQL is required'),
  ]),
  ApiController.create
);

router.get('/', ApiController.list);

router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.get
);

router.put(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.update
);

router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.delete
);

router.post(
  '/:id/publish',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.publish
);

router.post(
  '/:id/unpublish',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.unpublish
);

router.get(
  '/:id/metrics',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.getMetrics
);

router.get(
  '/:id/logs',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  ApiController.getLogs
);

export default router;
