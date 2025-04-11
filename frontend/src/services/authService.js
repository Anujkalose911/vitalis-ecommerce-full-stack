import API, { setAuthToken } from "../api";

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/users", userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Login User
export const loginUser = async (credentials) => {
  try {
    const response = await API.post("/users/login", credentials);
    const { token, user } = response.data;

    // Store token and user data
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuthToken(token);

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Logout User
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setAuthToken(null);
};
