import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404 - Page Not Found</h1>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;