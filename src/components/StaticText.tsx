import React from 'react';

interface StaticTextProps {
  data: {
    content?: string;
    textSize?: 'small' | 'medium' | 'large';
    textAlign?: 'left' | 'center' | 'right';
    textColor?: string;
    backgroundColor?: string;
  };
}

export function StaticText({ data }: StaticTextProps) {
  // Determine text size class
  const sizeClass = 
    data.textSize === 'large' ? 'text-xl' : 
    data.textSize === 'small' ? 'text-sm' : 
    'text-base';
  
  // Determine text alignment
  const alignClass = 
    data.textAlign === 'center' ? 'text-center' : 
    data.textAlign === 'right' ? 'text-right' : 
    'text-left';
  
  // Custom styles for color
  const customStyles = {
    color: data.textColor || 'inherit',
    backgroundColor: data.backgroundColor || 'transparent'
  };
  
  return (
    <div 
      className={`p-6 rounded-xl ${sizeClass} ${alignClass} text-gray-700 dark:text-gray-200`}
      style={customStyles}
    >
      {data.content ? (
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      ) : (
        <p>No content provided</p>
      )}
    </div>
  );
}