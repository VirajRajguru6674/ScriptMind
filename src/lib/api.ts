
let base = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim();
if (base.endsWith('/')) base = base.slice(0, -1);
if (!base.endsWith('/api')) base += '/api';

const API_BASE_URL = base;

export default API_BASE_URL;
