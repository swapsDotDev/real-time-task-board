# Real-Time Task Board - Frontend

The frontend of the Real-Time Team Task Board application built with React 19, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern React 19** with hooks and context API
- **Responsive Design** with Tailwind CSS
- **Real-time Updates** via Socket.IO
- **Authentication Flow** with protected routes
- **Task Management Interface** with Kanban board
- **Dark/Light Mode Support** (coming soon)
- **Mobile-Friendly** responsive design

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library
- **@dnd-kit** - Drag and drop functionality

## 📦 Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the frontend root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=TaskBoard
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   ├── Tasks/          # Task-related components
│   └── UI/             # Reusable UI components
├── contexts/
│   ├── AuthContext.jsx    # Authentication state management
│   └── TaskContext.jsx    # Task state management
├── lib/
│   ├── api.js          # Axios configuration
│   └── socket.js       # Socket.IO client
├── pages/
│   ├── Auth/           # Login/Register pages
│   ├── Dashboard/      # Dashboard page
│   ├── Tasks/          # Task pages (Board, List, Detail)
│   └── Profile/        # User profile pages
├── services/
│   └── api.js          # API service functions
├── utils/
│   └── helpers.js      # Utility functions
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## 🔗 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

The application uses a custom design system built with Tailwind CSS:

### Button Classes
- `btn` - Base button styles
- `btn-primary` - Primary button
- `btn-secondary` - Secondary button
- `btn-success` - Success button
- `btn-danger` - Danger button
- `btn-outline` - Outline button

### Form Classes
- `input` - Base input styles
- `input-error` - Error state input

### Card Classes
- `card` - Base card styles
- `card-header` - Card header
- `card-body` - Card body

### Badge Classes
- `badge` - Base badge styles
- `badge-primary` - Primary badge
- `badge-success` - Success badge
- `badge-warning` - Warning badge
- `badge-danger` - Danger badge

## 🔌 Real-time Features

The application connects to the backend via Socket.IO for real-time updates:

- **Task Updates** - Live updates when tasks are created, updated, or deleted
- **User Presence** - See who's online
- **Typing Indicators** - See when someone is typing a comment
- **Notifications** - Real-time push notifications

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

## 🔧 Development Tips

### React 19 Compatibility
Some packages may not fully support React 19 yet. Use the `--legacy-peer-deps` flag when installing:
```bash
npm install --legacy-peer-deps
```

### Hot Reload Issues
If hot reload stops working:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Tailwind IntelliSense
Install the "Tailwind CSS IntelliSense" VS Code extension for better development experience.

## 🐛 Common Issues

1. **Build Errors with React 19**
   - Use `--legacy-peer-deps` flag
   - Check package compatibility

2. **Socket Connection Issues**
   - Verify API URL in environment variables
   - Check if backend is running

3. **Styling Issues**
   - Ensure Tailwind is properly configured
   - Check for CSS conflicts

## 📄 License

This project is licensed under the MIT License.
