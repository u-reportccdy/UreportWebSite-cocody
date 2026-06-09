import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'API is running perfectly.' });
});

// Default route
app.get('/', (req: Request, res: Response) => {
  res.send('U-Report API Server');
});

// Start server
app.listen(PORT, () => {
  console.log(`Le serveur backend est lancé sur le port ${PORT}`);
});
