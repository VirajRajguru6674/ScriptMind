import { useState, useEffect, useMemo } from "react";

export interface HistoryItem {
  id: string | number;
  videoId: string;
  title: string;
  thumbnail: string;
  notes: string;
  createdAt: string | number;
  video_id?: string;
  created_at?: string | number;
  is_favorite?: boolean;
}

const API_BASE_URL = 'http://localhost:3001/api';

export function useNotesHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/history`, { headers });
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((item: any) => ({
          ...item,
          videoId: item.video_id,
          createdAt: item.created_at,
          is_favorite: !!item.is_favorite
        }));
        setHistory(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch history from MySQL:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    let result = [...history];
    if (favoritesOnly) {
      result = result.filter((item) => item.is_favorite);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [history, searchQuery, favoritesOnly]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const total = history.length;
    const todayCount = history.filter(
      (item) => new Date(item.createdAt).toDateString() === today
    ).length;
    return { total, todayCount };
  }, [history]);

  const addToHistory = (item: any) => {
    fetchHistory();
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const toggleFavorite = async (item: HistoryItem) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/history/${item.id}/favorite`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_favorite: !item.is_favorite })
      });
      if (res.ok) {
        setHistory((prev) =>
          prev.map((h) =>
            h.id === item.id ? { ...h, is_favorite: !item.is_favorite } : h
          )
        );
        await fetchHistory();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const deleteHistoryItem = async (item: HistoryItem) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/history/${item.id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== item.id));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return {
    history,
    filteredHistory,
    searchQuery,
    setSearchQuery,
    favoritesOnly,
    setFavoritesOnly,
    stats,
    addToHistory,
    clearHistory,
    fetchHistory,
    toggleFavorite,
    deleteHistoryItem
  };
}
