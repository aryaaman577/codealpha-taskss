import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export async function connectDB(retries = MAX_RETRIES): Promise<void> {
  const mongoURI = env.MONGODB_URI;

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error(`❌ MongoDB connection attempt failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    if (retries <= 1) {
      console.error('🔴 All retries exhausted. Exiting.');
      process.exit(1);
    }
    console.log(`🔄 Retrying in ${RETRY_DELAY / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    return connectDB(retries - 1);
  }
}
