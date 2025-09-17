import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

export interface Harvest {
  _id?: string;
  cropName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  location: string;
  farmerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const harvestService = {
  // Get all harvests
  getAllHarvests: async (): Promise<Harvest[]> => {
    const response = await api.get('/harvests');
    return response.data;
  },

  // Create new harvest
  createHarvest: async (harvest: Omit<Harvest, '_id' | 'createdAt' | 'updatedAt'>): Promise<Harvest> => {
    const response = await api.post('/harvests', harvest);
    return response.data;
  },

  // Get harvest by ID
  getHarvestById: async (id: string): Promise<Harvest> => {
    const response = await api.get(`/harvests/${id}`);
    return response.data;
  },

  // Update harvest
  updateHarvest: async (id: string, harvest: Partial<Harvest>): Promise<Harvest> => {
    const response = await api.put(`/harvests/${id}`, harvest);
    return response.data;
  },

  // Delete harvest
  deleteHarvest: async (id: string): Promise<void> => {
    await api.delete(`/harvests/${id}`);
  },
};