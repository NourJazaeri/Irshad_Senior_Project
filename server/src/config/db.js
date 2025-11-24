import mongoose from 'mongoose';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
    
    // Drop old unique index on departmentName if it exists (migration)
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('Department');
      const indexes = await collection.indexes();
      
      // Check if old index exists
      const oldIndex = indexes.find(idx => idx.name === 'departmentName_1');
      if (oldIndex) {
        console.log("🔄 Dropping old unique index on departmentName...");
        await collection.dropIndex('departmentName_1');
        console.log("✅ Old index dropped successfully");
      }
    } catch (indexError) {
      // If index doesn't exist or already dropped, that's fine
      if (indexError.code !== 27) { // 27 = IndexNotFound
        console.warn("⚠️  Could not drop old index (may not exist):", indexError.message);
      }
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // stop app if DB connection fails
  }
}

export default connectDB;


