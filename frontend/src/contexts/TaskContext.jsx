import { createContext, useContext, useReducer, useEffect } from 'react';
import { tasksAPI, handleAPIError } from '../services/api';
import socketService from '../lib/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  tasks: [],
  boardData: {
    'To Do': [],
    'In Progress': [],
    'Done': []
  },
  selectedTask: null,
  filters: {
    status: '',
    assigned_to: '',
    priority: '',
    search: '',
  },
  stats: {
    statusStats: {},
    priorityStats: {},
    overdueTasks: 0,
    monthlyCompletion: { completed: 0, total: 0, rate: 0 }
  },
  connectedUsers: [],
  typingUsers: {},
  isLoading: false,
  error: null,
};

// Action types
const TASK_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Tasks
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  
  // Board
  SET_BOARD_DATA: 'SET_BOARD_DATA',
  MOVE_TASK: 'MOVE_TASK',
  
  // Selected task
  SET_SELECTED_TASK: 'SET_SELECTED_TASK',
  ADD_COMMENT: 'ADD_COMMENT',
  
  // Filters
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  
  // Stats
  SET_STATS: 'SET_STATS',
  
  // Real-time
  SET_CONNECTED_USERS: 'SET_CONNECTED_USERS',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
};

// Reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case TASK_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case TASK_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case TASK_ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload, isLoading: false };

    case TASK_ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        boardData: {
          ...state.boardData,
          [action.payload.status]: [
            action.payload,
            ...state.boardData[action.payload.status]
          ]
        }
      };

    case TASK_ACTIONS.UPDATE_TASK:
      const updatedTasks = state.tasks.map(task =>
        task._id === action.payload._id ? action.payload : task
      );
      
      // Update board data
      const newBoardData = { ...state.boardData };
      Object.keys(newBoardData).forEach(status => {
        newBoardData[status] = newBoardData[status].filter(
          task => task._id !== action.payload._id
        );
      });
      newBoardData[action.payload.status].push(action.payload);

      return {
        ...state,
        tasks: updatedTasks,
        boardData: newBoardData,
        selectedTask: state.selectedTask?._id === action.payload._id
          ? action.payload
          : state.selectedTask
      };

    case TASK_ACTIONS.DELETE_TASK:
      const filteredTasks = state.tasks.filter(task => task._id !== action.payload);
      
      // Remove from board data
      const updatedBoardData = { ...state.boardData };
      Object.keys(updatedBoardData).forEach(status => {
        updatedBoardData[status] = updatedBoardData[status].filter(
          task => task._id !== action.payload
        );
      });

      return {
        ...state,
        tasks: filteredTasks,
        boardData: updatedBoardData,
        selectedTask: state.selectedTask?._id === action.payload
          ? null
          : state.selectedTask
      };

    case TASK_ACTIONS.SET_BOARD_DATA:
      return { ...state, boardData: action.payload, isLoading: false };

    case TASK_ACTIONS.MOVE_TASK:
      const { taskId, newStatus } = action.payload;
      const taskToMove = state.tasks.find(task => task._id === taskId);
      
      if (!taskToMove) return state;

      const movedBoardData = { ...state.boardData };
      
      // Remove from old status
      Object.keys(movedBoardData).forEach(status => {
        movedBoardData[status] = movedBoardData[status].filter(
          task => task._id !== taskId
        );
      });
      
      // Add to new status
      const updatedTask = { ...taskToMove, status: newStatus };
      movedBoardData[newStatus].push(updatedTask);

      return {
        ...state,
        boardData: movedBoardData,
        tasks: state.tasks.map(task =>
          task._id === taskId ? updatedTask : task
        )
      };

    case TASK_ACTIONS.SET_SELECTED_TASK:
      return { ...state, selectedTask: action.payload };

    case TASK_ACTIONS.ADD_COMMENT:
      const { taskId: commentTaskId, comment } = action.payload;
      
      return {
        ...state,
        selectedTask: state.selectedTask?._id === commentTaskId
          ? {
              ...state.selectedTask,
              comments: [...(state.selectedTask.comments || []), comment]
            }
          : state.selectedTask,
        tasks: state.tasks.map(task =>
          task._id === commentTaskId
            ? { ...task, comments: [...(task.comments || []), comment] }
            : task
        )
      };

    case TASK_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case TASK_ACTIONS.CLEAR_FILTERS:
      return { ...state, filters: initialState.filters };

    case TASK_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };

    case TASK_ACTIONS.SET_CONNECTED_USERS:
      return { ...state, connectedUsers: action.payload };

    case TASK_ACTIONS.SET_TYPING_USERS:
      return { ...state, typingUsers: action.payload };

    default:
      return state;
  }
};

// Create context
const TaskContext = createContext();

// Task provider component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) return;

    // Task events
    socketService.onTaskCreated((data) => {
      dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: data.task });
      toast.success(`New task created: ${data.task.title}`);
    });

    socketService.onTaskUpdated((data) => {
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: data.task });
      if (data.changes.status) {
        toast.success(`Task moved to ${data.task.status}`);
      }
    });

    socketService.onTaskDeleted((data) => {
      dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: data.taskId });
      toast.success('Task deleted');
    });

    socketService.onCommentAdded((data) => {
      dispatch({
        type: TASK_ACTIONS.ADD_COMMENT,
        payload: { taskId: data.taskId, comment: data.comment }
      });
      toast.success('New comment added');
    });

    // User events
    socketService.onConnectedUsers((data) => {
      dispatch({ type: TASK_ACTIONS.SET_CONNECTED_USERS, payload: data.users });
    });

    socketService.onUserTyping((data) => {
      dispatch({
        type: TASK_ACTIONS.SET_TYPING_USERS,
        payload: {
          ...state.typingUsers,
          [data.taskId]: data.isTyping ? data.user : null
        }
      });
    });

    // Progress updates
    socketService.onTaskProgressUpdated((data) => {
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: data.task });
      toast.info('Task progress updated');
    });

    // Task reassignment
    socketService.onTaskReassigned((data) => {
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: data.task });
      toast.info('Task reassigned');
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [isAuthenticated]);

  // Fetch tasks
  const fetchTasks = async (params = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      
      const response = await tasksAPI.getTasks({
        ...state.filters,
        ...params
      });
      
      dispatch({ type: TASK_ACTIONS.SET_TASKS, payload: response.data.tasks });
    } catch (error) {
      const errorData = handleAPIError(error);
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: errorData.message });
      toast.error(errorData.message);
    }
  };

  // Fetch board data
  const fetchBoardData = async (params = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      
      const response = await tasksAPI.getBoard(params);
      
      dispatch({ type: TASK_ACTIONS.SET_BOARD_DATA, payload: response.data });
    } catch (error) {
      const errorData = handleAPIError(error);
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: errorData.message });
      toast.error(errorData.message);
    }
  };

  // Create task
  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);
      // Real-time update will handle adding to state
      toast.success('Task created successfully');
      return { success: true, task: response.data.task };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Update task
  const updateTask = async (taskId, taskData) => {
    try {
      const response = await tasksAPI.updateTask(taskId, taskData);
      // Real-time update will handle updating state
      toast.success('Task updated successfully');
      return { success: true, task: response.data.task };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await tasksAPI.deleteTask(taskId);
      // Real-time update will handle removing from state
      toast.success('Task deleted successfully');
      return { success: true };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Move task (drag and drop)
  const moveTask = async (taskId, newStatus) => {
    try {
      // Optimistic update
      dispatch({
        type: TASK_ACTIONS.MOVE_TASK,
        payload: { taskId, newStatus }
      });

      await tasksAPI.updateTask(taskId, { status: newStatus });
      return { success: true };
    } catch (error) {
      // Revert optimistic update
      fetchBoardData();
      
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Add comment
  const addComment = async (taskId, commentData) => {
    try {
      const response = await tasksAPI.addComment(taskId, commentData);
      // Real-time update will handle adding to state
      return { success: true, comment: response.data.comment };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Fetch single task
  const fetchTask = async (taskId) => {
    try {
      const response = await tasksAPI.getTask(taskId);
      dispatch({ type: TASK_ACTIONS.SET_SELECTED_TASK, payload: response.data.task });
      return { success: true, task: response.data.task };
    } catch (error) {
      const errorData = handleAPIError(error);
      toast.error(errorData.message);
      return { success: false, error: errorData.message };
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await tasksAPI.getStats();
      dispatch({ type: TASK_ACTIONS.SET_STATS, payload: response.data });
    } catch (error) {
      const errorData = handleAPIError(error);
      console.error('Failed to fetch stats:', errorData.message);
    }
  };

  // Set filters
  const setFilters = (filters) => {
    dispatch({ type: TASK_ACTIONS.SET_FILTERS, payload: filters });
  };

  // Clear filters
  const clearFilters = () => {
    dispatch({ type: TASK_ACTIONS.CLEAR_FILTERS });
  };

  // Join/leave task rooms
  const joinTaskRoom = (taskId) => {
    socketService.joinTaskRoom(taskId);
  };

  const leaveTaskRoom = (taskId) => {
    socketService.leaveTaskRoom(taskId);
  };

  // Typing indicators
  const sendTyping = (taskId, isTyping) => {
    socketService.sendTyping(taskId, isTyping);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    ...state,
    
    // Actions
    fetchTasks,
    fetchBoardData,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addComment,
    fetchTask,
    fetchStats,
    setFilters,
    clearFilters,
    clearError,
    
    // Socket actions
    joinTaskRoom,
    leaveTaskRoom,
    sendTyping,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Hook to use task context
export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export default TaskContext;
