import React from 'react';
import type { HistoryEntry } from '../types';
import { ViewIcon, TrashIcon, PhotoIcon } from './Icons';

interface HistoryItemProps {
  entry: HistoryEntry;
  onView: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry, onView, onDelete }) => {
  const thumbnail = entry.images.find(img => img.status === 'success')?.src;
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
  };
  
  const handleViewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onView(entry);
  }

  return (
    <li 
        className="flex items-center p-3 space-x-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group"
        onClick={() => onView(entry)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onView(entry)}
        aria-label={`View photoshoot from ${new Date(entry.date).toLocaleString()}`}
    >
      <div className="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt="Photoshoot thumbnail" className="w-full h-full object-cover" />
        ) : (
          <PhotoIcon className="w-8 h-8 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate" title={entry.formState.productDescription}>
          {entry.formState.productDescription || "No Description"}
        </p>
        <p className="text-xs text-slate-500">
          {new Date(entry.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &bull; {entry.images.length} photos
        </p>
      </div>
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleViewClick}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors" 
            aria-label="View history item"
          >
            <ViewIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" 
            aria-label="Delete history item"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
      </div>
    </li>
  );
};
