import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin, requireTaskAccess } from '../middleware/auth.js';
import { 
  validateTaskCreation, 
  validateTaskUpdate, 
  validateComment, 
  validateObjectId, 
  validateTaskQuery 
} from '../middleware/validation.js';
import { websocketService } from '../server.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks with filtering and pagination
// @access  Private (Admin: sees all tasks, Member: sees all tasks but with limited edit access)
router.get('/', authenticateToken, validateTaskQuery, async (req, res) => {
  try {
    const {
      status,
      assigned_to,
      created_by,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (assigned_to) filter.assigned_to = assigned_to;
    if (created_by) filter.created_by = created_by;
    if (priority) filter.priority = priority;

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Role-based filtering for members
    if (req.user.role !== 'admin') {
      // Members can see all tasks but with limited actions
      // No additional filtering needed - they can view all for team transparency
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with population
    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email avatar')
      .populate('created_by', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks' 
    });
  }
});

// @route   GET /api/tasks/admin/manage
// @desc    Get all tasks with admin management details
// @access  Admin only
router.get('/admin/manage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('assigned_to', 'name email avatar role')
      .populate('created_by', 'name email avatar role')
      .populate('comments.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Add management metadata
    const tasksWithMetadata = tasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        _metadata: {
          isOverdue: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done',
          ageInDays: task.ageInDays,
          commentCount: task.comments.length,
          canBeReassigned: true,
          canBeDeleted: true
        }
      };
    });

    res.json({
      tasks: tasksWithMetadata,
      summary: {
        total: tasks.length,
        byStatus: {
          'To Do': tasks.filter(t => t.status === 'To Do').length,
          'In Progress': tasks.filter(t => t.status === 'In Progress').length,
          'Done': tasks.filter(t => t.status === 'Done').length
        },
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done').length
      }
    });

  } catch (error) {
    console.error('Admin manage tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin task management data' 
    });
  }
});

// @route   POST /api/tasks/admin/create
// @desc    Admin creates a task for any user
// @access  Admin only
router.post('/admin/create', authenticateToken, requireAdmin, validateTaskCreation, async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date, tags, estimatedHours } = req.body;

    // Verify assigned user exists
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    // Create task
    const task = new Task({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assigned_to,
      created_by: req.user._id,
      due_date,
      tags: tags || [],
      estimatedHours
    });

    await task.save();

    // Populate task for response
    await task.populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' }
    ]);

    // Emit real-time event via WebSocket
    websocketService.broadcastTaskCreated(task.toObject(), req.user._id.toString());

    res.status(201).json({
      message: 'Task created successfully by admin',
      task: task.toObject()
    });

  } catch (error) {
    console.error('Admin create task error:', error);
    res.status(500).json({ 
      error: 'Failed to create task' 
    });
  }
});

// @route   PUT /api/tasks/admin/:id
// @desc    Admin updates any task
// @access  Admin only
router.put('/admin/:id', authenticateToken, requireAdmin, validateObjectId(), validateTaskUpdate, async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date, tags, estimatedHours } = req.body;

    // Find the task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify assigned user exists if changing assignment
    if (assigned_to && assigned_to !== task.assigned_to.toString()) {
      const assignedUser = await User.findById(assigned_to);
      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        tags,
        estimatedHours,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' }
    ]);

    // Emit real-time event via WebSocket
    websocketService.broadcastTaskUpdated(updatedTask.toObject(), req.body, req.user._id.toString());

    res.json({
      message: 'Task updated successfully by admin',
      task: updatedTask.toObject()
    });

  } catch (error) {
    console.error('Admin update task error:', error);
    res.status(500).json({ 
      error: 'Failed to update task' 
    });
  }
});

// @route   DELETE /api/tasks/admin/:id
// @desc    Admin deletes any task
// @access  Admin only
router.delete('/admin/:id', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Emit real-time event via WebSocket
    websocketService.broadcastTaskDeleted(req.params.id, req.user._id.toString());

    res.json({
      message: 'Task deleted successfully by admin'
    });

  } catch (error) {
    console.error('Admin delete task error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task' 
    });
  }
});

// @route   PUT /api/tasks/admin/:id/reassign
// @desc    Admin reassigns a task to another user
// @access  Admin only
router.put('/admin/:id/reassign', authenticateToken, requireAdmin, validateObjectId(), async (req, res) => {
  try {
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ error: 'Assigned user ID is required' });
    }

    // Verify assigned user exists
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    // Find and update the task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldAssignee = task.assigned_to;
    task.assigned_to = assigned_to;
    await task.save();

    await task.populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' }
    ]);

    // Emit real-time event via WebSocket
    websocketService.broadcastTaskUpdated(task.toObject(), { assigned_to }, req.user._id.toString());

    res.json({
      message: 'Task reassigned successfully',
      task: task.toObject()
    });

  } catch (error) {
    console.error('Admin reassign task error:', error);
    res.status(500).json({ 
      error: 'Failed to reassign task' 
    });
  }
});

// @route   GET /api/tasks/member/assigned  
// @desc    Get tasks assigned to the current member
// @access  Private (Member)
router.get('/member/assigned', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for assigned tasks only
    const filter = { assigned_to: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name email avatar')
      .populate('created_by', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      message: `Found ${tasks.length} tasks assigned to you`
    });

  } catch (error) {
    console.error('Member assigned tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assigned tasks' 
    });
  }
});

// @route   PUT /api/tasks/member/:id
// @desc    Member updates only their assigned task
// @access  Private (Member can only edit assigned tasks)
router.put('/member/:id', authenticateToken, validateObjectId(), validateTaskUpdate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'You can only edit tasks assigned to you' 
      });
    }

    // Members can only update certain fields (not reassign or change priority)
    const allowedUpdates = {
      status: req.body.status,
      description: req.body.description,
      actualHours: req.body.actualHours
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        ...allowedUpdates,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' }
    ]);

    // Emit real-time event via WebSocket
    websocketService.broadcastTaskUpdated(updatedTask.toObject(), allowedUpdates, req.user._id.toString());

    res.json({
      message: 'Your assigned task updated successfully',
      task: updatedTask.toObject()
    });

  } catch (error) {
    console.error('Member update task error:', error);
    res.status(500).json({ 
      error: 'Failed to update task' 
    });
  }
});

// @route   POST /api/tasks/member/:id/progress
// @desc    Member adds progress update to their assigned task
// @access  Private (Member)
router.post('/member/:id/progress', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { progress, notes } = req.body;

    if (!progress && !notes) {
      return res.status(400).json({ error: 'Progress or notes required' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'You can only update progress on tasks assigned to you' 
      });
    }

    // Add progress update
    const progressUpdate = {
      user: req.user._id,
      text: notes || `Progress update: ${progress}%`,
      progress: progress || 0,
      timestamp: new Date()
    };

    task.comments.push(progressUpdate);
    await task.save();

    await task.populate('comments.user', 'name email avatar');
    const newComment = task.comments[task.comments.length - 1];

    // Broadcast real-time event
    websocketService.broadcastProgressUpdate(task._id, {
      progress: progressUpdate,
      updatedBy: req.user.getPublicProfile()
    });

    res.status(201).json({
      message: 'Progress updated successfully',
      progress: newComment
    });

  } catch (error) {
    console.error('Member progress update error:', error);
    res.status(500).json({ 
      error: 'Failed to update progress' 
    });
  }
});

// @route   GET /api/tasks/board
// @desc    Get tasks organized by status for Kanban board
// @access  Private
router.get('/board', authenticateToken, async (req, res) => {
  try {
    const { assigned_to, created_by } = req.query;
    
    // Build filter
    const filter = {};
    if (assigned_to) filter.assigned_to = assigned_to;
    if (created_by) filter.created_by = created_by;

    // If user is not admin, only show tasks they're involved with
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assigned_to: req.user._id },
        { created_by: req.user._id }
      ];
    }

    // Get tasks grouped by status
    const statuses = ['To Do', 'In Progress', 'Done'];
    const boardData = {};

    for (const status of statuses) {
      const tasks = await Task.find({ ...filter, status })
        .populate('assigned_to', 'name email avatar')
        .populate('created_by', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean();
      
      boardData[status] = tasks;
    }

    res.json(boardData);

  } catch (error) {
    console.error('Get board data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch board data' 
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Build base filter
    const baseFilter = isAdmin ? {} : {
      $or: [
        { assigned_to: userId },
        { created_by: userId }
      ]
    };

    // Get task counts by status
    const statusStats = await Task.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get priority stats
    const priorityStats = await Task.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get overdue tasks
    const overdueTasks = await Task.countDocuments({
      ...baseFilter,
      due_date: { $lt: new Date() },
      status: { $ne: 'Done' }
    });

    // Get completion rate for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCompleted = await Task.countDocuments({
      ...baseFilter,
      completedAt: { $gte: startOfMonth },
      status: 'Done'
    });

    const monthlyTotal = await Task.countDocuments({
      ...baseFilter,
      createdAt: { $gte: startOfMonth }
    });

    res.json({
      statusStats: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      priorityStats: priorityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      overdueTasks,
      monthlyCompletion: {
        completed: monthlyCompleted,
        total: monthlyTotal,
        rate: monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics' 
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', authenticateToken, validateObjectId(), requireTaskAccess('view'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned_to', 'name email avatar')
      .populate('created_by', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .lean();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task' 
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Both Admin and Member can create tasks)
router.post('/', authenticateToken, validateTaskCreation, async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date, tags, estimatedHours } = req.body;

    // Verify assigned user exists
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    // Create task
    const task = new Task({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assigned_to,
      created_by: req.user._id,
      due_date,
      tags: tags || [],
      estimatedHours
    });

    await task.save();

    // Populate task for response
    await task.populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' }
    ]);

    // Broadcast real-time event
    websocketService.broadcastTaskCreated(task.toObject(), req.user.getPublicProfile());

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      error: 'Failed to create task' 
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authenticateToken, validateObjectId(), validateTaskUpdate, requireTaskAccess('update'), async (req, res) => {
  try {
    const updates = req.body;
    const task = req.task;

    // If assigned_to is being changed, verify user exists
    if (updates.assigned_to && updates.assigned_to !== task.assigned_to.toString()) {
      const assignedUser = await User.findById(updates.assigned_to);
      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
    }

    // Track what changed for real-time updates
    const changes = {};
    Object.keys(updates).forEach(key => {
      if (task[key] !== updates[key]) {
        changes[key] = {
          from: task[key],
          to: updates[key]
        };
      }
    });

    // Update task
    Object.assign(task, updates);
    await task.save();

    // Populate task for response
    await task.populate([
      { path: 'assigned_to', select: 'name email avatar' },
      { path: 'created_by', select: 'name email avatar' },
      { path: 'comments.user', select: 'name email avatar' }
    ]);

    // Broadcast real-time event
    websocketService.broadcastTaskUpdated(task.toObject(), changes, req.user.getPublicProfile());

    res.json({
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      error: 'Failed to update task' 
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', authenticateToken, validateObjectId(), requireTaskAccess('delete'), async (req, res) => {
  try {
    const task = req.task; // From requireTaskAccess middleware
    
    await Task.findByIdAndDelete(req.params.id);

    // Broadcast real-time event
    websocketService.broadcastTaskDeleted(req.params.id, req.user.getPublicProfile());

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task' 
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', authenticateToken, validateObjectId(), validateComment, requireTaskAccess('comment'), async (req, res) => {
  try {
    const { text } = req.body;
    const task = req.task;

    // Add comment
    task.comments.push({
      user: req.user._id,
      text
    });

    await task.save();

    // Populate the new comment
    await task.populate('comments.user', 'name email avatar');
    const newComment = task.comments[task.comments.length - 1];

    // Broadcast real-time event
    websocketService.broadcastCommentAdded(task._id, newComment, req.user.getPublicProfile());

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment' 
    });
  }
});

export default router;
