// Migration script to add senderRole to existing chat messages
// Run this ONCE with: node src/scripts/migrate-chat.js

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Chat from '../models/Chat.js';

async function migrateChatMessages() {
  try {
    // Connect to database using the same connection function as the app
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all messages without senderRole
    const messagesWithoutRole = await Chat.find({ senderRole: { $exists: false } });
    console.log(`📋 Found ${messagesWithoutRole.length} messages without senderRole`);

    if (messagesWithoutRole.length === 0) {
      console.log('✅ No migration needed - all messages have senderRole');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update messages - default to 'supervisor' for existing messages
    // Note: This is a best guess since we can't determine the actual sender
    // from existing data. You may want to review and update specific messages
    // manually if needed.
    const result = await Chat.updateMany(
      { senderRole: { $exists: false } },
      { $set: { senderRole: 'supervisor' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} messages with senderRole='supervisor'`);
    console.log(`📊 Matched: ${result.matchedCount} messages`);
    
    // Verify the migration
    const remainingWithoutRole = await Chat.countDocuments({ senderRole: { $exists: false } });
    if (remainingWithoutRole === 0) {
      console.log('✅ Migration verified - all messages now have senderRole');
    } else {
      console.log(`⚠️  Warning: ${remainingWithoutRole} messages still without senderRole`);
    }

    console.log('✅ Migration complete!');
    
    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

// Run the migration
migrateChatMessages();

