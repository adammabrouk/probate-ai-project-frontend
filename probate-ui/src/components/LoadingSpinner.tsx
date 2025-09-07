// src/components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]} ${className}`}></div>
  );
};

interface LoadingCardProps {
  title: string;
  height?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ title, height = 'h-64', className = '' }) => {
  return (
    <div className={`rounded-2xl border border-gray-200 shadow-sm p-4 bg-white ${height} ${className}`}>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="flex items-center justify-center h-4/5">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    </div>
  );
};

interface LoadingTableProps {
  title: string;
  rows?: number;
  columns?: number;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ title, rows = 5, columns = 4 }) => {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm p-4 bg-white">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center mt-4">
        <LoadingSpinner size="sm" className="mr-2" />
        <span className="text-sm text-gray-500">Loading data...</span>
      </div>
    </div>
  );
};

interface LoadingGridProps {
  items?: number;
  className?: string;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({ items = 6, className = '' }) => {
  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <LoadingCard key={index} title="Loading..." height="h-48" />
      ))}
    </div>
  );
};
