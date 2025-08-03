// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Create the taskboard database
db = db.getSiblingDB('taskboard');

// Create an admin user for the application
db.createUser({
  user: 'taskboard_user',
  pwd: 'taskboard_password',
  roles: [
    {
      role: 'readWrite',
      db: 'taskboard'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string with at least 6 characters and is required'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'member'],
          description: 'must be either admin or member'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'createdBy'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        description: {
          bsonType: 'string',
          description: 'must be a string'
        },
        status: {
          bsonType: 'string',
          enum: ['todo', 'in-progress', 'done'],
          description: 'must be todo, in-progress, or done'
        },
        priority: {
          bsonType: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'must be low, medium, or high'
        },
        dueDate: {
          bsonType: 'date',
          description: 'must be a date'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ createdBy: 1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ tags: 1 });
db.tasks.createIndex({ title: 'text', description: 'text' });

// Production-ready database - no default users
// Users will be created through the registration process

print('Production database initialization completed successfully!');
print('No default users created - register through the application UI.');
