import { apiClient } from "./client";

export const get = async (endpoint: string) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("GET error:", error);
    throw error;
  }
};

export const post = async (endpoint: string, data: any) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error("POST error:", error);
    throw error;
  }
};
