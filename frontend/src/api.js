import axios from 'axios';

// Set base URL (adjust it if your backend runs on a different port)
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Updated to include /api prefix
});

// Function to set authentication token
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

export default API;
