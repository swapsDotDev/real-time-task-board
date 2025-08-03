import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// User validation rules
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be either admin or member'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Task validation rules
export const validateTaskCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .escape(),
  
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Done'])
    .withMessage('Status must be one of: To Do, In Progress, Done'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be one of: Low, Medium, High'),
  
  body('assigned_to')
    .custom(isValidObjectId)
    .withMessage('Assigned user must be a valid user ID'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      return tags.every(tag => 
        typeof tag === 'string' && 
        tag.trim().length > 0 && 
        tag.trim().length <= 20
      );
    })
    .withMessage('Each tag must be a non-empty string with max 20 characters'),
  
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),
  
  handleValidationErrors
];

export const validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .escape(),
  
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Done'])
    .withMessage('Status must be one of: To Do, In Progress, Done'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be one of: Low, Medium, High'),
  
  body('assigned_to')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Assigned user must be a valid user ID'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      return tags.every(tag => 
        typeof tag === 'string' && 
        tag.trim().length > 0 && 
        tag.trim().length <= 20
      );
    })
    .withMessage('Each tag must be a non-empty string with max 20 characters'),
  
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),
  
  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Actual hours must be between 0 and 1000'),
  
  handleValidationErrors
];

// Comment validation
export const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .escape(),
  
  handleValidationErrors
];

// Parameter validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`${paramName} must be a valid ObjectId`),
  
  handleValidationErrors
];

// Query validation
export const validateTaskQuery = [
  query('status')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['To Do', 'In Progress', 'Done'].includes(value);
    })
    .withMessage('Status must be one of: To Do, In Progress, Done'),
  
  query('assigned_to')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return isValidObjectId(value);
    })
    .withMessage('Assigned user must be a valid user ID'),
  
  query('created_by')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return isValidObjectId(value);
    })
    .withMessage('Creator must be a valid user ID'),
  
  query('priority')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Allow empty strings
      return ['Low', 'Medium', 'High'].includes(value);
    })
    .withMessage('Priority must be one of: Low, Medium, High'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'due_date', 'priority', 'status'])
    .withMessage('SortBy must be one of: createdAt, updatedAt, due_date, priority, status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc'),
  
  handleValidationErrors
];
