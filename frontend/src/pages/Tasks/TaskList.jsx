import React from 'react';

const TaskList = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Task List</h1>
        <button className="btn-primary">Add Task</button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">Task list view coming soon...</p>
      </div>
    </div>
  );
};

export default TaskList;
