#!/usr/bin/env node

/**
 * Clear All User Tokens Script
 * 
 * This script clears all blacklisted tokens and forces all users to re-login
 * Run this after changing JWT_SECRET in production
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// BlacklistedToken schema (simple version)
const blacklistedTokenSchema = new mongoose.Schema({
  token: String,
  createdAt: { type: Date, default: Date.now },
});

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

const clearAllTokens = async () => {
  try {
    await connectDB();
    
    console.log('🧹 Clearing all blacklisted tokens...');
    const result = await BlacklistedToken.deleteMany({});
    console.log(`✅ Cleared ${result.deletedCount} blacklisted tokens`);
    
    console.log('🔄 All users will need to login again with the new JWT_SECRET');
    console.log('✅ Token cleanup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
    process.exit(1);
  }
};

clearAllTokens();
