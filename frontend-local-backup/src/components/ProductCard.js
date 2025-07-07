import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart, updateCartItemQuantity, removeFromCart, cartItems, isLoggedIn } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [cartItemId, setCartItemId] = useState(null);

  // Find if product is in cart and get its quantity
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const item = cartItems.find(item => item.product_id === product.product_id);
      if (item) {
        setQuantity(item.quantity);
        setCartItemId(item.cart_id);
      } else {
        setQuantity(0);
        setCartItemId(null);
      }
    } else {
      setQuantity(0);
      setCartItemId(null);
    }
  }, [cartItems, product.product_id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await addToCart(product);
      setQuantity(1);
      setCartItemId(result.cart.cart_id);
    } catch (err) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (!cartItemId) return;
    
    setLoading(true);
    try {
      await updateCartItemQuantity(cartItemId, quantity + 1);
      setQuantity(quantity + 1);
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (!cartItemId || quantity <= 0) return;
    
    setLoading(true);
    try {
      if (quantity === 1) {
        await removeFromCart(cartItemId);
        setQuantity(0);
        setCartItemId(null);
      } else {
        await updateCartItemQuantity(cartItemId, quantity - 1);
        setQuantity(quantity - 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
          }}
        />
      </div>
      
      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₹{product.price.toFixed(2)}</p>
        <p className="product-description">{product.description}</p>
        
        {quantity > 0 ? (
          <div className="quantity-controls">
            <button 
              className="quantity-btn minus-btn" 
              onClick={handleDecrement}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span className="quantity-number">{quantity}</span>
            <button 
              className="quantity-btn plus-btn" 
              onClick={handleIncrement}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        ) : (
          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
        )}
        
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Login Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Sign In Required</h3>
            <p>Please sign in or create an account to add items to cart.</p>
            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <a href="/login" className="login-btn">Sign In</a>
              <a href="/signup" className="signup-btn">Sign Up</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard; 