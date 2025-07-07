import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateCartItemQuantity, isLoggedIn, loading: cartLoading } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch product details for each cart item
  useEffect(() => {
    const fetchProducts = async () => {
      if (!cartItems || cartItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Get unique product IDs from cart items
        const uniqueProductIds = [...new Set(cartItems.map(item => item.product_id))];
        
        // Fetch product details for each unique product
        const productPromises = uniqueProductIds.map(id => getProductById(id));
        const productResults = await Promise.all(productPromises);
        
        // Map products with their cart quantities
        const productsWithQuantities = productResults.map(product => {
          const cartItem = cartItems.find(item => item.product_id === product.product_id);
          return {
            ...product,
            cart_id: cartItem.cart_id,
            quantity: cartItem.quantity
          };
        });
        
        setProducts(productsWithQuantities);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cartItems]);

  // Calculate total price
  const calculateTotal = () => {
    return products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  // Handle quantity change
  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartId);
      return;
    }
    
    try {
      await updateCartItemQuantity(cartId, newQuantity);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again.');
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    navigate('/orders', { state: { cartItems: products } });
  };

  // If user is not logged in
  if (!isLoggedIn()) {
    return (
      <div className="cart-container">
        <h1>Your Cart</h1>
        <div className="cart-message">
          <p>Please log in or sign up to view your cart.</p>
          <div className="cart-actions">
            <a href="/login" className="btn btn-primary">Log In</a>
            <a href="/signup" className="btn btn-secondary">Sign Up</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      
      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Loading State */}
      {(loading || cartLoading) ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      ) : (
        <>
          {/* Empty Cart Message */}
          {products.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <a href="/" className="continue-shopping">Continue Shopping</a>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                {products.map(product => (
                  <div key={product.product_id} className="cart-item">
                    <div className="cart-item-image">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                        }}
                      />
                    </div>
                    
                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{product.name}</h3>
                      <p className="cart-item-price">₹{product.price.toFixed(2)}</p>
                      
                      <div className="cart-item-quantity">
                        <button 
                          className="quantity-btn minus-btn" 
                          onClick={() => handleQuantityChange(product.cart_id, product.quantity - 1)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                        <span className="quantity-number">{product.quantity}</span>
                        <button 
                          className="quantity-btn plus-btn" 
                          onClick={() => handleQuantityChange(product.cart_id, product.quantity + 1)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      </div>
                      
                      <button 
                        className="remove-btn" 
                        onClick={() => removeFromCart(product.cart_id)}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="cart-item-total">
                      <p>₹{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cart Summary */}
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={products.length === 0}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Cart;