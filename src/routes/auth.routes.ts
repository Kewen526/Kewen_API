import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate([
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate([
    body('username').notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  AuthController.login
);

router.get('/me', authenticate, AuthController.me);

export default router;
