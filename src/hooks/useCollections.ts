import { useState, useEffect, useCallback } from "react";

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  note_ids: number[];
}

import API_BASE_URL_CENTRAL from "@/lib/api";

const API_BASE_URL = API_BASE_URL_CENTRAL;

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);

  const fetchCollections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/collections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (name: string, description?: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        await fetchCollections();
        const data = await res.json();
        return data.id;
      }
      return null;
    } catch (error) {
      console.error("Failed to create collection:", error);
      return null;
    }
  };

  const addNoteToCollection = async (collectionId: number, noteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note_id: noteId })
      });
      if (res.ok) {
        await fetchCollections();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add note to collection:", error);
      return false;
    }
  };

  const removeNoteFromCollection = async (collectionId: number, noteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/items/${noteId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        await fetchCollections();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to remove note from collection:", error);
      return false;
    }
  };

  return {
    collections,
    fetchCollections,
    createCollection,
    addNoteToCollection,
    removeNoteFromCollection
  };
}
