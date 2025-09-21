
import React from 'react';
import { CameraIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="bg-indigo-600 text-white p-2 rounded-lg mr-3">
            <CameraIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Photoshoot Generator
        </h1>
      </div>
    </header>
  );
};
