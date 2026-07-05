import React from "react";

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-4 flex flex-col gap-4 animate-pulse">
      <div className="w-full h-48 bg-zinc-800 rounded-xl"></div>
      <div className="flex justify-between items-center">
        <div className="w-1/3 h-4 bg-zinc-800 rounded"></div>
        <div className="w-1/4 h-4 bg-zinc-800 rounded"></div>
      </div>
      <div className="w-3/4 h-6 bg-zinc-800 rounded"></div>
      <div className="w-full h-4 bg-zinc-800 rounded"></div>
      <div className="w-2/3 h-4 bg-zinc-800 rounded"></div>
      <div className="w-full h-10 bg-zinc-800 rounded-xl mt-2"></div>
    </div>
  );
};

export const SkeletonRow: React.FC = () => {
  return (
    <div className="flex gap-4 items-center py-4 border-b border-zinc-800 animate-pulse">
      <div className="w-16 h-16 bg-zinc-800 rounded-xl"></div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-1/2 h-5 bg-zinc-800 rounded"></div>
        <div className="w-1/4 h-4 bg-zinc-800 rounded"></div>
      </div>
      <div className="w-16 h-6 bg-zinc-800 rounded"></div>
    </div>
  );
};
