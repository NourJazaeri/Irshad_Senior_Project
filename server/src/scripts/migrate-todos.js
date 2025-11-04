import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config();

async function migrateTodos() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    // Check if todos collection exists
    const collections = await db.listCollections().toArray();
    const todosExists = collections.some(c => c.name === 'todos');
    
    if (!todosExists) {
      console.log('✅ No "todos" collection found. Nothing to migrate.');
      process.exit(0);
    }
    
    // Check if todolists collection already exists
    const todolistsExists = collections.some(c => c.name === 'todolists');
    
    if (todolistsExists) {
      console.log('⚠️  "todolists" collection already exists. Migration may have already been done.');
    }
    
    // Copy all documents from todos to todolists
    const todos = await db.collection('todos').find({}).toArray();
    
    if (todos.length === 0) {
      console.log('✅ No documents in "todos" collection. Nothing to migrate.');
      process.exit(0);
    }
    
    console.log(`📋 Found ${todos.length} documents in "todos" collection.`);
    
    // Insert into todolists collection
    if (todos.length > 0) {
      await db.collection('todolists').insertMany(todos);
      console.log(`✅ Successfully migrated ${todos.length} documents to "todolists" collection.`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('💡 You can now delete the old "todos" collection if you want.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateTodos();

