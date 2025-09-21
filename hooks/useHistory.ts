import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../types';

const HISTORY_STORAGE_KEY = 'photoshootGeneratorHistory';

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
            setHistory([]);
        }
    }, []);

    const saveHistory = (newHistory: HistoryEntry[]) => {
        try {
            // Sort by ID (timestamp) descending to keep it ordered
            const sortedHistory = newHistory.sort((a, b) => b.id - a.id);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sortedHistory));
            setHistory(sortedHistory);
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    };

    const addToHistory = useCallback((newEntryData: Omit<HistoryEntry, 'id' | 'date'>) => {
        const newEntry: HistoryEntry = {
            ...newEntryData,
            id: Date.now(),
            date: new Date().toISOString(),
        };
        
        setHistory(prevHistory => {
            const updatedHistory = [newEntry, ...prevHistory];
            saveHistory(updatedHistory);
            return updatedHistory;
        });
    }, []);

    const removeFromHistory = useCallback((id: number) => {
        if (window.confirm("Are you sure you want to delete this history item?")) {
            setHistory(prevHistory => {
                const updatedHistory = prevHistory.filter(entry => entry.id !== id);
                saveHistory(updatedHistory);
                return updatedHistory;
            });
        }
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to clear your entire generation history? This action cannot be undone.")) {
            setHistory([]);
            try {
                localStorage.removeItem(HISTORY_STORAGE_KEY);
            } catch (error) {
                console.error("Failed to clear history from localStorage", error);
            }
        }
    }, []);
    
    return { history, addToHistory, removeFromHistory, clearHistory };
};
