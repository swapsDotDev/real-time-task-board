# Real-Time Task Board - Backend

A RESTful API backend for the Real-Time Team Task Board application built with Node.js, Express.js, MongoDB, and Socket.IO for real-time functionality.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/Member)
  - Password hashing with bcrypt
  - Token refresh mechanism

- **Task Management**
  - CRUD operations for tasks
  - Kanban board organization
  - Task filtering and search
  - Comments and attachments support
  - Due date management
  - Priority levels

- **Real-Time Updates**
  - Socket.IO integration
  - Real-time task updates
  - Live user presence
  - Typing indicators
  - Push notifications

- **Security Features**
  - Helmet.js for security headers
  - Rate limiting
  - Input validation and sanitization
  - CORS configuration
  - MongoDB injection protection

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Validation**: express-validator
- **Security**: Helmet, bcryptjs, CORS
- **Testing**: Jest (configured)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-time-task-board/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "member" // optional, defaults to "member"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### Task Endpoints

#### Get All Tasks
```http
GET /api/tasks
Authorization: Bearer <jwt-token>
Query Parameters:
- status: "To Do" | "In Progress" | "Done"
- assigned_to: <user-id>
- created_by: <user-id>
- priority: "Low" | "Medium" | "High"
- page: number (default: 1)
- limit: number (default: 20)
- search: string
```

#### Get Kanban Board Data
```http
GET /api/tasks/board
Authorization: Bearer <jwt-token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Design UI mockups",
  "description": "Create wireframes for the dashboard",
  "status": "To Do",
  "priority": "High",
  "assigned_to": "<user-id>",
  "due_date": "2025-08-10T00:00:00.000Z",
  "tags": ["design", "ui"],
  "estimatedHours": 8
}
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "In Progress",
  "actualHours": 4
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <jwt-token>
```

#### Add Comment
```http
POST /api/tasks/:id/comments
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "text": "This looks great! Ready for review."
}
```

### User Endpoints

#### Get All Users
```http
GET /api/users
Authorization: Bearer <jwt-token>
Query Parameters:
- active: "true" | "false"
- role: "admin" | "member"
- search: string
```

#### Get User Profile
```http
GET /api/users/:id
Authorization: Bearer <jwt-token>
```

## 🔌 Socket.IO Events

### Client to Server Events

- `joinTaskRoom(taskId)` - Join task-specific room for updates
- `leaveTaskRoom(taskId)` - Leave task room
- `typing({ taskId, isTyping })` - Send typing indicator
- `updateStatus(status)` - Update user online status

### Server to Client Events

- `taskCreated(data)` - New task created
- `taskUpdated(data)` - Task updated
- `taskDeleted(data)` - Task deleted
- `commentAdded(data)` - New comment added
- `connectedUsers(users)` - List of online users
- `notification(data)` - Push notification
- `userTyping(data)` - User typing indicator

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validation.js        # Input validation rules
│   ├── models/
│   │   ├── User.js              # User model
│   │   └── Task.js              # Task model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── tasks.js             # Task routes
│   │   └── users.js             # User routes
│   ├── services/
│   │   └── socketService.js     # Socket.IO handlers
│   ├── tests/
│   │   └── auth.test.js         # Test files
│   └── server.js                # Main server file
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test specific endpoint with curl:
```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}'
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Configuration**: Restricted to frontend domain
- **Helmet.js**: Security headers and protection
- **MongoDB Injection**: Protected with Mongoose sanitization

## 📊 Database Schema

### User Schema
```javascript
{
  name: String (required, max: 50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed, min: 6 chars),
  role: String (enum: ['admin', 'member'], default: 'member'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Schema
```javascript
{
  title: String (required, max: 100 chars),
  description: String (required, max: 1000 chars),
  status: String (enum: ['To Do', 'In Progress', 'Done']),
  priority: String (enum: ['Low', 'Medium', 'High']),
  assigned_to: ObjectId (ref: User, required),
  created_by: ObjectId (ref: User, required),
  due_date: Date,
  tags: [String] (max: 10, each max: 20 chars),
  comments: [{
    user: ObjectId (ref: User),
    text: String (max: 500 chars),
    createdAt: Date
  }],
  completedAt: Date,
  estimatedHours: Number (0-1000),
  actualHours: Number (0-1000),
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<production-jwt-secret>
FRONTEND_URL=<production-frontend-url>
```

### Deploy to Render/Heroku
1. Set environment variables in your deployment platform
2. Ensure MongoDB Atlas is configured for production
3. Update CORS settings for production domain
4. Deploy using platform-specific instructions

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MONGODB_URI format
   - Verify network access in MongoDB Atlas
   - Ensure correct username/password

2. **JWT Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **Socket.IO Connection Issues**
   - Verify CORS configuration
   - Check if frontend URL matches FRONTEND_URL
   - Ensure proper token is passed to socket connection

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... },
  "token": "jwt-token" // if applicable
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": [ ... ] // validation errors if applicable
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

For questions or support, please contact the development team.
