import React from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const TermsOfService: React.FC = () => {
  const lastUpdated = 'March 21, 2025';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last Updated: {lastUpdated}</p>
        
        <div className="prose dark:prose-invert">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Acceptance of Terms</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Etiam porta sem malesuada magna mollis euismod. Cras mattis consectetur purus sit amet fermentum. Aenean lacinia bibendum nulla sed consectetur. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">User Responsibilities</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras mattis consectetur purus sit amet fermentum. Nulla vitae elit libero, a pharetra augue. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;