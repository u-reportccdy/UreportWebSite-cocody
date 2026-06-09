import { Router } from 'express';
import articleRoutes from './article.routes';
import eventRoutes from './event.routes';

const router = Router();

// Routes principales de l'API
router.use('/articles', articleRoutes);
router.use('/events', eventRoutes);

export default router;
