import axios from "axios";

export const API = process.env.NEXT_PUBLIC_API_BACKEND;

if (!API) {
  throw new Error("❌ Falta la variable NEXT_PUBLIC_API_BACKEND en .env.local");
}

export const apiClient = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
});
