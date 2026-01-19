import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const fetchTrends = async () => {
  try {
    const response = await api.get('/trends');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch trends');
  }
};

export const refreshTrends = async () => {
  try {
    const response = await api.post('/trends/refresh');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to refresh trends');
  }
};

export const getTrendsBySource = async (source) => {
  try {
    const response = await api.get(`/trends/source/${source}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch trends by source');
  }
};

export const getStats = async () => {
  try {
    const response = await api.get('/trends/stats');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch stats');
  }
};
