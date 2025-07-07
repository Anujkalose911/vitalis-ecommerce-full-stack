import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get user ID from token
const getUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage');
    return null;
  }

  // Extract user ID from token
  const match = token.match(/dummy_token_(\d+)/);
  if (!match) {
    console.error('Token format is invalid:', token);
    return null;
  }

  const userId = match[1];
  console.log('Extracted user ID:', userId);
  return userId;
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    console.log('Creating order for user:', userId);
    console.log('Order data:', orderData);

    // Ensure all required fields are present
    if (!orderData.total_amount || !orderData.items || orderData.items.length === 0) {
      throw new Error('Missing required order data');
    }

    // Ensure each item has the required fields
    orderData.items.forEach((item, index) => {
      console.log(`Checking item at index ${index}:`, item);

      if (!item.product_id) {
        console.error('Invalid item - missing product_id:', item);
        throw new Error(`Item at index ${index} is missing product_id`);
      }

      if (item.quantity === undefined || item.quantity === null) {
        console.error('Invalid item - missing quantity:', item);
        throw new Error(`Item at index ${index} is missing quantity`);
      }

      if (item.price === undefined || item.price === null) {
        console.error('Invalid item - missing price:', item);
        throw new Error(`Item at index ${index} is missing price`);
      }
    });

    // Add payment status and method to order data
    const orderPayload = {
      ...orderData,
      user_id: parseInt(userId),  // Convert to integer
      payment_status: 'Success',  // Set payment status to Success after successful payment
      payment_method: orderData.payment_method || null  // Include payment method if available
    };

    const response = await axios.post(`${API_URL}/orders`, orderPayload, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Order creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      throw new Error(error.response.data.message || 'Failed to create order');
    }
    throw error;
  }
};

// Get all orders for the current user
export const getUserOrders = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    console.log('Fetching orders for user:', userId);
    const response = await axios.get(`${API_URL}/orders/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Orders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Get order details by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
}; 