import React from 'react';

const AuthLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Restoring your session</p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
