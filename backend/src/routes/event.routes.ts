import { Router } from 'express';
import { getEvents } from '../controllers/event.controller';

const router = Router();

// Routes pour les événements
router.get('/', getEvents);

export default router;
