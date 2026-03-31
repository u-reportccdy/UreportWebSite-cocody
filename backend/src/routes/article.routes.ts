import { Router } from 'express';
import { getArticles } from '../controllers/article.controller';

const router = Router();

// Routes pour les articles
router.get('/', getArticles);

export default router;
