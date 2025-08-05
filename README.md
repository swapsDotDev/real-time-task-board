# Real-Time Team Task Board

A web-based Real-Time Team Task Board application enabling teams to collaborate on task management with real-time updates, role-based access, and a Kanban-style interface.

## 🌟 Features

### Core Functionality
- **User Authentication & Authorization**
  - Sign-up and login with email/password
  - JWT-based secure authentication
  - Role-based access control (Admin/Member)
  - Password hashing with bcrypt

- **Task Management**
  - Create, read, update, and delete tasks
  - Kanban-style board with drag-and-drop (@dnd-kit)
  - Task status management (To Do, In Progress, Done)
  - Priority levels (Low, Medium, High)
  - Task assignment to team members
  - Due date management
  - Comments system

- **Real-Time Updates**
  - Native WebSocket implementation for real-time communication
  - Live task updates across all connected clients
  - User presence indicators
  - Real-time task creation, updates, and deletion

- **User Interface**
  - Responsive design with Tailwind CSS
  - Mobile-friendly interface
  - Drag-and-drop task management
  - Search and filtering capabilities

### Admin Features
- **User Management**
  - View and manage team members
  - Role assignment (Admin/Member)
  - User activation/deactivation

- **Task Management**
  - Full CRUD operations on all tasks
  - Task reassignment capabilities
  - Admin dashboard with task overview

### Security Features
- **Authentication & Authorization**
  - JWT token management with blacklisting
  - Role-based access control
  - Password encryption with bcrypt
  - Input validation and sanitization
  - CORS protection
  - Rate limiting

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Native WebSocket implementation
- **Authentication**: JWT (JSON Web Tokens) with token blacklisting
- **Validation**: express-validator
- **Security**: Helmet, bcryptjs, CORS, express-rate-limit

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Context API with useReducer
- **HTTP Client**: Axios
- **Real-time**: Native WebSocket Client
- **UI Components**: Lucide React (icons), Heroicons
- **Notifications**: React Hot Toast
- **Drag & Drop**: @dnd-kit (for Kanban board)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd real-time-task-board
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install --legacy-peer-deps
cp .env.example .env
# Edit .env file to point to your backend API
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔑 Demo Credentials

Use these credentials to test the application with pre-configured users:

### Admin User
- **Name**: Admin User
- **Email**: admin@taskboard.com
- **Password**: AdminPass123!

### Demo User
- **Name**: Swapnil Kale
- **Email**: swapnilkale1411@gmail.com
- **Password**: swapnil@kale

> **Note**: The admin user has full access to user management, task oversight, and administrative features. The demo user has standard member permissions for task management and collaboration.

## ⚙️ Environment Configuration

### Backend Environment Variables (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskboard
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=TaskBoard
```

## 📁 Project Structure

```
real-time-task-board/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth & validation middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # WebSocket services
│   │   ├── tests/          # Test files
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   ├── .env.example        # Environment template
│   ├── create-admin.js     # Admin user creation script
│   ├── Dockerfile          # Docker configuration
│   ├── package.json        # Dependencies & scripts
│   └── README.md           # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   ├── .env.example        # Environment template
│   ├── Dockerfile          # Docker configuration
│   ├── package.json        # Dependencies & scripts
│   ├── tailwind.config.js  # Tailwind configuration
│   └── vite.config.js      # Vite configuration
├── .gitignore              # Git ignore rules
├── DEPLOYMENT_CHECKLIST.md # Step-by-step deployment guide
├── DEPLOYMENT_GUIDE.md     # Detailed deployment instructions
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Root package.json for scripts
├── setup-github.sh         # GitHub setup script (Linux/Mac)
├── setup-github.bat        # GitHub setup script (Windows)
├── vercel.json             # Vercel deployment configuration
└── README.md               # Main documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

### Tasks
- `GET /api/tasks` - Get all tasks with filters
- `GET /api/tasks/board` - Get Kanban board data
- `GET /api/tasks/stats` - Get task statistics
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/status` - Activate/deactivate user

### Admin Routes
- `GET /api/admin/tasks` - Get all tasks (admin view)
- `POST /api/admin/tasks` - Create task as admin
- `PUT /api/admin/tasks/:id` - Update any task
- `DELETE /api/admin/tasks/:id` - Delete any task
- `PUT /api/admin/tasks/:id/reassign` - Reassign task

## 🔌 WebSocket Events

### Client to Server
- `joinTaskRoom(taskId)` - Join task-specific room
- `leaveTaskRoom(taskId)` - Leave task room
- `typing({ taskId, isTyping })` - Send typing indicator
- `updateStatus(status)` - Update user status

### Server to Client
- `taskCreated(data)` - New task created
- `taskUpdated(data)` - Task updated
- `taskDeleted(data)` - Task deleted
- `commentAdded(data)` - New comment added
- `connectedUsers(users)` - List of online users
- `notification(data)` - Push notification
- `userTyping(data)` - Typing indicator
- `taskProgressUpdated(data)` - Task progress update
- `taskReassigned(data)` - Task reassignment

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### API Testing Examples
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get tasks (requires auth token)
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Prerequisites for Deployment
1. **MongoDB Atlas account** (for production database)
2. **Render account** (for backend deployment)
3. **Vercel account** (for frontend deployment)
4. **GitHub repository** (for source code)

### Step 1: Create MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Set network access to `0.0.0.0/0` (allow from anywhere)
5. Get your connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/taskboard`

### Step 2: Deploy Backend to Render
1. Go to [Render](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure deployment settings:
   ```
   Name: real-time-task-board-backend
   Branch: main
   Root Directory: backend
   Runtime: Node.js
   Build Command: npm install
   Start Command: npm start
   ```
4. Set environment variables in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-secure-64-character-secret>
   PORT=10000
   FRONTEND_URL=<your-vercel-app-url>
   ```
5. Deploy and note your backend URL (e.g., `https://your-app.onrender.com`)

### Step 3: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and import your GitHub repository
2. Configure project settings:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
3. Set environment variables in Vercel dashboard:
   ```
   VITE_API_URL=<your-render-backend-url>/api
   VITE_APP_NAME=TaskBoard
   ```
4. Deploy and note your frontend URL

### Step 4: Update CORS Settings
1. Go back to Render and update the `FRONTEND_URL` environment variable
2. Set it to your Vercel deployment URL
3. Redeploy the backend service

### Step 5: Create Admin User
1. In your Render backend dashboard, go to the Shell tab
2. Run the admin creation script:
   ```bash
   node create-admin.js
   ```
3. Follow the prompts to create your admin user

### Live Application URLs
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-app.onrender.com`
- **Health Check**: `https://your-app.onrender.com/api/health`

### Environment Variables for Production

#### Backend (Render)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
JWT_SECRET=your_super_secure_64_character_secret_key_here
PORT=10000
FRONTEND_URL=https://your-project.vercel.app
```

#### Frontend (Vercel)
```env
VITE_API_URL=https://your-app.onrender.com/api
VITE_APP_NAME=TaskBoard
```

### GitHub Repository Setup
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Real-time Task Board"

# Create GitHub repository and push
git branch -M main
git remote add origin https://github.com/yourusername/real-time-task-board.git
git push -u origin main
```

## 🛡️ Security Features

- **Authentication**: JWT-based secure authentication with token blacklisting
- **Authorization**: Role-based access control (Admin/Member)
- **Password Security**: bcrypt password hashing
- **Input Validation**: Comprehensive validation with express-validator
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing protection
- **Security Headers**: Helmet.js protection
- **MongoDB Protection**: Mongoose injection protection

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running locally or verify Atlas connection string
   - Ensure MONGODB_URI is correctly set in .env

2. **WebSocket Connection Issues**
   - Ensure both frontend and backend are running
   - Check that JWT token is being passed correctly
   - Verify network configuration

3. **Authentication Issues**
   - Check JWT_SECRET is set in backend .env
   - Verify token expiration settings
   - Clear browser localStorage if needed

### Creating Admin User
```bash
cd backend
node create-admin.js
```

## 📊 Project Architecture

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'member']),
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Tasks Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String (enum: ['To Do', 'In Progress', 'Done']),
  priority: String (enum: ['Low', 'Medium', 'High']),
  assigned_to: ObjectId (ref: 'User'),
  created_by: ObjectId (ref: 'User'),
  due_date: Date,
  tags: [String],
  comments: [{
    user: ObjectId (ref: 'User'),
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 💡 Design Choices & Challenges

### Real-Time Implementation
- **Challenge**: Choosing between Socket.IO and native WebSockets
- **Solution**: Implemented native WebSocket for lightweight, direct communication
- **Benefit**: Better control over connection management and reduced overhead

### State Management
- **Challenge**: Managing complex task state across components
- **Solution**: Used React Context API with useReducer for centralized state
- **Benefit**: Predictable state updates and easier debugging

### Authentication
- **Challenge**: Secure token management with logout functionality
- **Solution**: Implemented JWT with token blacklisting for secure logout
- **Benefit**: Immediate token invalidation on logout

### Drag and Drop
- **Challenge**: Smooth drag-and-drop with real-time updates
- **Solution**: Used @dnd-kit library with optimistic updates
- **Benefit**: Responsive UI with fallback for failed operations
