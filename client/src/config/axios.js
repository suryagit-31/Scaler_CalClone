import axios from "axios";

// Use environment variable for API URL, fallback to relative path for development
const API_URL = import.meta.env.VITE_API_URL || "";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
