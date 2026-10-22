import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.env === 'development' ? ['warn', 'error'] : ['error'],
  });
};

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
