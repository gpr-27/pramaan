// MongoDB connection helper.
//
// Connecting is best-effort: if no MONGODB_URI is configured, or the cluster is
// unreachable, we log and return false so the caller can fall back to the
// in-memory store. The app must always boot — a missing/!down DB is not fatal.
import mongoose from 'mongoose';
import config, { isMongoConfigured } from '../config/index.js';
import logger from '../lib/logger.js';

let connected = false;

export function isMongoConnected() {
  return connected && mongoose.connection.readyState === 1;
}

/**
 * Attempt to connect to MongoDB. Returns true on success, false otherwise.
 * Never throws — failures degrade to the in-memory fallback.
 */
export async function connectMongo() {
  if (!isMongoConfigured) {
    logger.info('MongoDB: no MONGODB_URI set — using in-memory persona store');
    return false;
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    connected = true;
    logger.info('MongoDB: connected — personas will persist');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      connected = false;
      logger.warn('MongoDB: disconnected');
    });
    mongoose.connection.on('connected', () => {
      connected = true;
    });

    return true;
  } catch (err) {
    connected = false;
    logger.warn(`MongoDB: connection failed (${err.message}) — falling back to in-memory store`);
    return false;
  }
}

export default connectMongo;
