#!/usr/bin/env node

/**
 * Production Admin User Creation Script
 * 
 * This script creates the first admin user for the production system.
 * Run this once after deployment to create your initial admin account.
 * 
 * Usage:
 * node create-admin.js
 * 
 * Or with environment variables:
 * ADMIN_NAME="Your Name" ADMIN_EMAIL="admin@yourcompany.com" ADMIN_PASSWORD="securepassword" node create-admin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// Create readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any admin users already exist
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('');
      
      const overwrite = await question('Do you want to create another admin user? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ Admin creation cancelled.');
        process.exit(0);
      }
    }

    // Get admin details from environment variables or user input
    let adminName = process.env.ADMIN_NAME;
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName) {
      adminName = await question('Enter admin name: ');
    }

    if (!adminEmail) {
      adminEmail = await question('Enter admin email: ');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      console.log('❌ Invalid email format');
      process.exit(1);
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }

    if (!adminPassword) {
      adminPassword = await question('Enter admin password (min 6 characters): ');
    }

    // Validate password
    if (adminPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Create admin user
    console.log('🔄 Creating admin user...');
    
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Admin Details:');
    console.log(`  Name: ${adminUser.name}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  Created: ${adminUser.createdAt}`);
    console.log('');
    console.log('🚀 You can now login to the application with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Process interrupted');
  rl.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the script
console.log('🔧 TaskBoard Admin User Creation Script');
console.log('=====================================');
console.log('');

createAdminUser();
