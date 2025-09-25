import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    console.warn('⚠️  MONGODB_URI is missing; database operations will fail.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10s timeout
    });
    console.log('✅ Connected to MongoDB (Mongoose)');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}
