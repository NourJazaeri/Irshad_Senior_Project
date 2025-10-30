// Migration script to add senderRole to existing chat messages
// Run this ONCE with: node src/migrate-chat.js

import 'dotenv/config';
import mongoose from 'mongoose';
import Chat from './models/Chat.js';

async function migrateChatMessages() {
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all messages without senderRole
    const messagesWithoutRole = await Chat.find({ senderRole: { $exists: false } });
    console.log(`Found ${messagesWithoutRole.length} messages without senderRole`);

    if (messagesWithoutRole.length === 0) {
      console.log('✅ No migration needed - all messages have senderRole');
      process.exit(0);
    }

    // Update messages - assume supervisor sent them (or you can customize logic)
    const result = await Chat.updateMany(
      { senderRole: { $exists: false } },
      { $set: { senderRole: 'supervisor' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} messages with senderRole='supervisor'`);
    console.log('Migration complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateChatMessages();
