import React from 'react';
import type { HistoryEntry } from '../types';
import { HistoryItem } from './HistoryItem';
import { HistoryIcon, TrashIcon } from './Icons';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onView: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onView, onDelete, onClearAll }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6"/>
            History
        </h2>
        {history.length > 0 && (
            <button
                onClick={onClearAll}
                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition flex items-center gap-1"
            >
                <TrashIcon className="w-4 h-4" />
                Clear All
            </button>
        )}
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Your past photoshoots will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 -mr-4">
          {history.map(entry => (
            <HistoryItem 
                key={entry.id} 
                entry={entry} 
                onView={onView} 
                onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
