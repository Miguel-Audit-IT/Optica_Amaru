import React from 'react';

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white dark:bg-[#24211F] border border-[#E2E8F0] dark:border-[#37322E] rounded-xl p-5 shadow-sm ${className}`}>
    <div className="h-3 w-24 bg-slate-200 dark:bg-[#37322E] rounded mb-3" />
    <div className="h-8 w-32 bg-slate-200 dark:bg-[#37322E] rounded mb-2" />
    <div className="h-2 w-16 bg-slate-200 dark:bg-[#37322E] rounded" />
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-slate-50 dark:bg-[#1A1816] border border-[#E2E8F0] dark:border-[#37322E] rounded-lg p-3 flex justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 dark:bg-[#37322E] rounded" />
          <div className="h-2 w-40 bg-slate-200 dark:bg-[#37322E] rounded" />
        </div>
        <div className="h-5 w-14 bg-slate-200 dark:bg-[#37322E] rounded" />
      </div>
    ))}
  </div>
);
