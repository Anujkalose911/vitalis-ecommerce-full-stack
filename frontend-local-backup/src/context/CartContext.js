import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

// Create the context
const CartContext = createContext();

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is logged in
  const isLoggedIn = () => {
    return localStorage.getItem('token') !== null;
  };

  // Get user ID from token (in a real app, you would decode the JWT token)
  const getUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // For now, we'll extract the user ID from our dummy token format
    // In a real app, you would decode the JWT token
    const match = token.match(/dummy_token_(\d+)/);
    return match ? match[1] : null;
  };

  // Fetch cart items for the logged-in user
  const fetchCartItems = async () => {
    if (!isLoggedIn()) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userId = getUserId();
      if (!userId) {
        setCartItems([]);
        return;
      }
      
      const response = await API.get(`/cart/user/${userId}`);
      setCartItems(response.data);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product) => {
    if (!isLoggedIn()) {
      throw new Error('Please log in to add items to cart');
    }

    setLoading(true);
    setError(null);
    
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await API.post('/cart', {
        user_id: userId,
        product_id: product.product_id,
        quantity: 1
      });

      // Refresh cart items after adding
      await fetchCartItems();
      return response.data;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartId) => {
    if (!isLoggedIn()) {
      throw new Error('Please log in to remove items from cart');
    }

    setLoading(true);
    setError(null);
    
    try {
      await API.delete(`/cart/${cartId}`);
      // Refresh cart items after removing
      await fetchCartItems();
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.message || 'Failed to remove item from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (cartId, quantity) => {
    if (!isLoggedIn()) {
      throw new Error('Please log in to update cart');
    }

    setLoading(true);
    setError(null);
    
    try {
      await API.put(`/cart/${cartId}`, { quantity });
      // Refresh cart items after updating
      await fetchCartItems();
    } catch (err) {
      console.error('Error updating cart:', err);
      setError(err.message || 'Failed to update cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear all items from cart
  const clearCart = async () => {
    if (!isLoggedIn()) {
      throw new Error('Please log in to clear cart');
    }

    setLoading(true);
    setError(null);
    
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Get all cart items for the user
      const response = await API.get(`/cart/user/${userId}`);
      const cartItems = response.data;
      
      // Delete each cart item
      for (const item of cartItems) {
        await API.delete(`/cart/${item.cart_id}`);
      }
      
      // Refresh cart items after clearing
      await fetchCartItems();
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart items when component mounts or user logs in/out
  useEffect(() => {
    fetchCartItems();
  }, []);

  // Context value
  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    fetchCartItems,
    isLoggedIn,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext; 