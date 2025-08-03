import React from 'react';
import { useParams } from 'react-router-dom';

const TaskDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">Task detail view for task {id} coming soon...</p>
      </div>
    </div>
  );
};

export default TaskDetail;
