// @/api/http.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BACKEND || '';
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

export const post = async <T = any>(
  endpoint: string, 
  data: any,
  config?: any
): Promise<T> => {
  try {
    const isFormData = data instanceof FormData;
    
    const response = await apiClient.post<T>(endpoint, data, {
      ...config,
      headers: {
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
        ...config?.headers,
      },
    });
    
    return response.data;
  } catch (error: any) {
    if (error?.response) {
      console.error("POST error:", error.response.status, error.response.data);
    } else {
      console.error("POST network error:", error?.message, { url: `${apiClient.defaults.baseURL}${endpoint}` });
    }
    throw error;
  }
};

export const get = async <T = any>(endpoint: string): Promise<T> => {
  try {
    const response = await apiClient.get<T>(endpoint);
    return response.data;
  } catch (error: any) {
    if (error?.response) {
      console.error("GET error:", error.response.status, error.response.data);
    } else {
      console.error("GET network error:", error?.message, { url: `${apiClient.defaults.baseURL}${endpoint}` });
    }
    throw error;
  }
};