import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for task assignment)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { active = 'true', role, search, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};
    if (active === 'true') filter.isActive = true;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users' 
    });
  }
});

// @route   GET /api/users/me/tasks
// @desc    Get current user's tasks
// @access  Private
router.get('/me/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, created = 'false' } = req.query;

    // Build filter
    const filter = created === 'true' 
      ? { created_by: req.user._id }
      : { assigned_to: req.user._id };
    
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email avatar')
      .populate('created_by', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tasks });

  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks' 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { assigned_to: user._id },
            { created_by: user._id }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = taskStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      user: user.getPublicProfile(),
      taskStats: stats
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile' 
    });
  }
});

// @route   GET /api/users/:id/tasks
// @desc    Get tasks for specific user
// @access  Private (Admin or same user)
router.get('/:id/tasks', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const userId = req.params.id;
    const { status, created = 'false' } = req.query;

    // Check if user can access these tasks
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build filter
    const filter = created === 'true' 
      ? { created_by: userId }
      : { assigned_to: userId };
    
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email avatar')
      .populate('created_by', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tasks });

  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user tasks' 
    });
  }
});

// Admin-only routes
// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/:id/role', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ 
        error: 'Valid role (admin or member) is required' 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from removing their own admin role if they're the only admin
    if (req.user._id.toString() === user._id.toString() && user.role === 'admin' && role === 'member') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove admin role. At least one admin must remain.' 
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      error: 'Failed to update user role' 
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/deactivate user
// @access  Admin only
router.put('/:id/status', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        error: 'isActive must be a boolean value' 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves if they're the only admin
    if (req.user._id.toString() === user._id.toString() && user.role === 'admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({ 
        role: 'admin', 
        isActive: true,
        _id: { $ne: user._id }
      });
      if (activeAdminCount === 0) {
        return res.status(400).json({ 
          error: 'Cannot deactivate the last active admin' 
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      error: 'Failed to update user status' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Admin only
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves if they're the only admin
    if (req.user._id.toString() === userId) {
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        const adminCount = await User.countDocuments({ 
          role: 'admin', 
          isActive: true,
          _id: { $ne: userId }
        });
        if (adminCount === 0) {
          return res.status(400).json({ 
            error: 'Cannot delete the last admin account' 
          });
        }
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has tasks assigned or created
    const taskCount = await Task.countDocuments({
      $or: [
        { assigned_to: userId },
        { created_by: userId }
      ]
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete user. They have ${taskCount} associated tasks. Please reassign or delete tasks first.` 
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user' 
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Admin only
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin', isActive: true });
    const memberUsers = await User.countDocuments({ role: 'member', isActive: true });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Get user activity (users who logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeLastWeek = await User.countDocuments({ 
      lastLogin: { $gte: sevenDaysAgo },
      isActive: true
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      memberUsers,
      recentRegistrations,
      activeLastWeek,
      activityRate: activeUsers > 0 ? Math.round((activeLastWeek / activeUsers) * 100) : 0
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics' 
    });
  }
});

export default router;
