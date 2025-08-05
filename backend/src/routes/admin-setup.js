import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Special one-time admin creation endpoint
// This should be removed after creating your admin user
router.post('/create-first-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin user already exists. This endpoint is disabled.' 
      });
    }

    // Check if any users exist at all (only allow if database is empty or has very few users)
    const userCount = await User.countDocuments();
    if (userCount > 5) {
      return res.status(400).json({ 
        message: 'Database already has users. This endpoint is disabled for security.' 
      });
    }

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Create admin user
    const adminUser = new User({
      name,
      email,
      password, // Will be hashed by the pre-save middleware
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      message: 'Error creating admin user', 
      error: error.message 
    });
  }
});

export default router;
