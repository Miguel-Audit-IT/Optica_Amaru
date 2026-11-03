import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#121826] border border-[#2A364F] rounded-xl p-5 ${className}`}>
    <div className="h-3 w-24 bg-[#1A2234] rounded mb-3" />
    <div className="h-8 w-32 bg-[#1A2234] rounded mb-2" />
    <div className="h-2 w-16 bg-[#1A2234] rounded" />
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-[#1A2234] border border-[#2A364F] rounded-lg p-3 flex justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-[#2A364F] rounded" />
          <div className="h-2 w-40 bg-[#2A364F] rounded" />
        </div>
        <div className="h-5 w-14 bg-[#2A364F] rounded" />
      </div>
    ))}
  </div>
);

