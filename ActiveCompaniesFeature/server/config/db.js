import mongoose from 'mongoose';

export function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    console.warn('⚠️  MONGODB_URI is missing; database operations will fail.');
    return Promise.resolve();
  }
  return mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}


