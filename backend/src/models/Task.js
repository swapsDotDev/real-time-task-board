import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to someone']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  due_date: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0,
    max: 1000
  },
  actualHours: {
    type: Number,
    min: 0,
    max: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ status: 1 });
taskSchema.index({ assigned_to: 1 });
taskSchema.index({ created_by: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ due_date: 1 });
taskSchema.index({ tags: 1 });

// Compound indexes for common queries
taskSchema.index({ status: 1, assigned_to: 1 });
taskSchema.index({ status: 1, created_by: 1 });

// Pre-save middleware to set completedAt when status changes to Done
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'Done') {
      this.completedAt = undefined;
    }
  }
  next();
});

// Virtual for task age in days
taskSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get tasks by status
taskSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('assigned_to', 'name email avatar')
    .populate('created_by', 'name email avatar')
    .sort({ createdAt: -1 });
};

// Static method to get user's tasks
taskSchema.statics.getUserTasks = function(userId) {
  return this.find({ assigned_to: userId })
    .populate('assigned_to', 'name email avatar')
    .populate('created_by', 'name email avatar')
    .sort({ createdAt: -1 });
};

// Instance method to add comment
taskSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return this.save();
};

// Instance method to check if user can edit
taskSchema.methods.canEdit = function(userId, userRole) {
  // Admin can edit any task
  if (userRole === 'admin') {
    return true;
  }
  // Members can only edit tasks assigned to them
  return this.assigned_to && this.assigned_to.toString() === userId.toString();
};

// Instance method to check if user can delete
taskSchema.methods.canDelete = function(userId, userRole) {
  // Admin can delete any task
  if (userRole === 'admin') {
    return true;
  }
  // Members can only delete tasks they created
  return this.created_by.toString() === userId.toString();
};

// Instance method to check if user can view
taskSchema.methods.canView = function(userId, userRole) {
  // Everyone can view all tasks for team collaboration
  return true;
};

// Instance method to check if user can comment
taskSchema.methods.canComment = function(userId, userRole) {
  // Everyone can comment on all tasks for team collaboration
  return true;
};

export default mongoose.model('Task', taskSchema);
