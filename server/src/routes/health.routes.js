import { Router } from 'express';
import { prisma } from '../prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      app: 'Smart School Fee Management System',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      app: 'Smart School Fee Management System',
      database: 'disconnected',
      error: error.message,
    });
  }
});

export default router;
