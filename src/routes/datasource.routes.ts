import { Router } from 'express';
import { body, param } from 'express-validator';
import { DataSourceController } from '../controllers/DataSourceController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['MYSQL', 'POSTGRESQL', 'MONGODB', 'REDIS', 'SQL_SERVER', 'SQLITE']).withMessage('Invalid database type'),
    body('host').trim().notEmpty().withMessage('Host is required'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port'),
    body('database').trim().notEmpty().withMessage('Database is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
  ]),
  DataSourceController.create
);

router.get('/', DataSourceController.list);

router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  DataSourceController.get
);

router.put(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  DataSourceController.update
);

router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  DataSourceController.delete
);

router.post(
  '/:id/test',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  DataSourceController.test
);

router.get(
  '/:id/tables',
  validate([param('id').isUUID().withMessage('Invalid ID')]),
  DataSourceController.getTables
);

router.get(
  '/:id/tables/:tableName/schema',
  validate([
    param('id').isUUID().withMessage('Invalid ID'),
    param('tableName').notEmpty().withMessage('Table name is required'),
  ]),
  DataSourceController.getTableSchema
);

router.post(
  '/:id/query',
  validate([
    param('id').isUUID().withMessage('Invalid ID'),
    body('sql').trim().notEmpty().withMessage('SQL is required'),
  ]),
  DataSourceController.executeQuery
);

export default router;
