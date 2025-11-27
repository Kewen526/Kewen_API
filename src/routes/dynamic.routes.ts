import { Router } from 'express';
import { DynamicApiController } from '../controllers/DynamicApiController';
import { apiKeyAuth } from '../middleware/auth';

const router = Router();

router.all('/:version/*', apiKeyAuth, DynamicApiController.execute);

router.all('/*', apiKeyAuth, DynamicApiController.execute);

export default router;
