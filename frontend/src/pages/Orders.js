import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, getUserOrders } from '../services/orderService';
import { getProductById } from '../services/productService';
import '../styles/Orders.css';

function Orders() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, clearCart, isLoggedIn } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderProducts, setOrderProducts] = useState({}); // Store product details for each order
  
  // Payment related states
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    walletId: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Check token format
  const checkToken = () => {
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token);
    
    if (token) {
      const match = token.match(/dummy_token_(\d+)/);
      if (match) {
        console.log('User ID from token:', match[1]);
      } else {
        console.error('Token format is invalid');
      }
    } else {
      console.error('No token found in localStorage');
    }
  };

  // Fetch previous orders and cart products on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn()) {
        navigate('/login');
        return;
      }

      checkToken();
      setLoading(true);
      setError(null);

      try {
        // Fetch previous orders
        const orders = await getUserOrders();
        console.log('Orders fetched:', orders);
        setPreviousOrders(Array.isArray(orders) ? orders : []);

        // Fetch product details for each order's items
        if (orders && orders.length > 0) {
          const productDetails = {};
          
          for (const order of orders) {
            console.log(`Processing order ${order.order_id}:`, order);
            
            if (order.items && order.items.length > 0) {
              console.log(`Order ${order.order_id} has ${order.items.length} items:`, order.items);
              
              const productPromises = order.items.map(item => {
                console.log(`Fetching product details for product_id: ${item.product_id}`);
                return getProductById(item.product_id)
                  .then(product => {
                    console.log(`Product details for ${item.product_id}:`, product);
                    if (!product) {
                      console.error(`Product not found for ID: ${item.product_id}`);
                      return null;
                    }
                    return {
                      ...product,
                      quantity: item.quantity,
                      price: item.price
                    };
                  })
                  .catch(err => {
                    console.error(`Error fetching product ${item.product_id}:`, err);
                    return null;
                  });
              });

              const products = await Promise.all(productPromises);
              const validProducts = products.filter(product => product !== null);
              console.log(`Valid products for order ${order.order_id}:`, validProducts);
              productDetails[order.order_id] = validProducts;
            } else {
              console.log(`Order ${order.order_id} has no items`);
            }
          }
          
          console.log('All order products:', productDetails);
          setOrderProducts(productDetails);
        }

        // Fetch product details for cart items
        if (cartItems && cartItems.length > 0) {
          const productPromises = cartItems.map(item => 
            getProductById(item.product_id)
              .then(product => {
                if (!product) {
                  console.error(`Product not found for ID: ${item.product_id}`);
                  return null;
                }
                return {
                  id: product.product_id,
                  product_id: product.product_id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  quantity: item.quantity,
                  cart_item_id: item.cart_id
                };
              })
              .catch(err => {
                console.error(`Error fetching product ${item.product_id}:`, err);
                return null;
              })
          );

          const products = await Promise.all(productPromises);
          const validProducts = products.filter(product => product !== null);
          console.log('Fetched products for cart:', validProducts);
          setProducts(validProducts);
          
          // Show payment section if coming from cart
          if (location.state && location.state.fromCart) {
            setShowPaymentSection(true);
          }
        } else {
          setProducts([]); // Initialize with empty array if no cart items
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load orders. Please try again later.');
        setProducts([]); // Initialize with empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, navigate, cartItems, location.state]);

  // Calculate total amount for the current cart
  const calculateTotal = () => {
    if (!products || products.length === 0) return 0;
    return products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentError('');
  };

  // Handle payment details change
  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  // Validate payment details based on selected method
  const validatePaymentDetails = () => {
    if (!selectedPaymentMethod) {
      setPaymentError('Please select a payment method');
      return false;
    }

    switch (selectedPaymentMethod) {
      case 'upi':
        if (!paymentDetails.upiId) {
          setPaymentError('Please enter UPI ID');
          return false;
        }
        break;
      case 'card':
        if (!paymentDetails.cardNumber || !paymentDetails.cardName || 
            !paymentDetails.cardExpiry || !paymentDetails.cardCvv) {
          setPaymentError('Please fill all card details');
          return false;
        }
        break;
      case 'wallet':
        if (!paymentDetails.walletId) {
          setPaymentError('Please enter wallet ID');
          return false;
        }
        break;
      case 'cod':
        // Cash on delivery doesn't need validation
        break;
      default:
        setPaymentError('Invalid payment method');
        return false;
    }

    return true;
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentDetails()) {
      return;
    }

    setPaymentProcessing(true);
    setPaymentError('');

    try {
      // For UPI, Card, or Wallet, process payment and place order immediately
      if (selectedPaymentMethod !== 'cod') {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Prepare order data
        const orderData = {
          total_amount: calculateTotal(),
          items: products.map(product => ({
            product_id: product.product_id,
            quantity: product.quantity,
            price: product.price
          })),
          payment_method: selectedPaymentMethod
        };

        // Create the order
        const newOrder = await createOrder(orderData);
        console.log('Order placed successfully:', newOrder);
        
        setCurrentOrder(newOrder);
        setOrderPlaced(true);
        clearCart(); // Clear the cart after successful order
        setProducts([]); // Clear products state
        setShowPaymentSection(false); // Hide payment section
        
        // Refresh previous orders
        const updatedOrders = await getUserOrders();
        setPreviousOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
      } else {
        // For Cash on Delivery, just show success message
        setPaymentSuccess(true);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!paymentSuccess) {
      setError('Please complete the payment process before placing the order.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare order data
      const orderData = {
        total_amount: calculateTotal(),
        items: products.map(product => ({
          product_id: product.product_id,
          quantity: product.quantity,
          price: product.price
        })),
        payment_method: selectedPaymentMethod // Include payment method
      };

      console.log('Placing order with data:', orderData);

      // Create the order
      const newOrder = await createOrder(orderData);
      console.log('Order placed successfully:', newOrder);
      
      setCurrentOrder(newOrder);
      setOrderPlaced(true);
      clearCart(); // Clear the cart after successful order
      setProducts([]); // Clear products state
      setShowPaymentSection(false); // Hide payment section
      setPaymentSuccess(false); // Reset payment success
      
      // Refresh previous orders
      const updatedOrders = await getUserOrders();
      setPreviousOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class based on order status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-badge pending';
      case 'Shipped':
        return 'status-badge shipped';
      case 'Delivered':
        return 'status-badge delivered';
      case 'Cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  // Get default image URL for products
  const getDefaultImageUrl = (productName) => {
    return `https://via.placeholder.com/100x100?text=${encodeURIComponent(productName.substring(0, 10))}`;
  };

  if (!isLoggedIn()) {
    return (
      <div className="orders-container">
        <h1>My Orders</h1>
        <div className="login-message">
          <p>Please log in to view your orders.</p>
          <button onClick={() => navigate('/login')} className="login-btn">Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h1>My Orders</h1>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {/* Order Summary Section */}
          {!orderPlaced && products && products.length > 0 && (
            <div className="order-summary-section">
              <h2>Order Summary</h2>
              <div className="order-items">
                {products.map(product => (
                  <div key={product.id} className="order-item">
                    <div className="order-item-image">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getDefaultImageUrl(product.name);
                        }}
                      />
                    </div>
                    <div className="order-item-details">
                      <h3>{product.name}</h3>
                      <p className="price">₹{product.price.toFixed(2)}</p>
                      <p className="quantity">Quantity: {product.quantity}</p>
                      <p className="subtotal">Subtotal: ₹{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <h3>Total Amount: ₹{calculateTotal().toFixed(2)}</h3>
                {!showPaymentSection && (
                  <div className="order-buttons">
                    <button 
                      className="proceed-to-payment-btn"
                      onClick={() => setShowPaymentSection(true)}
                      disabled={loading}
                    >
                      Proceed to Payment
                    </button>
                    <button 
                      className="back-to-cart-btn"
                      onClick={() => navigate('/cart')}
                      disabled={loading}
                    >
                      Back to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Section */}
          {showPaymentSection && products && products.length > 0 && !orderPlaced && (
            <div className="payment-section">
              <h2>Payment Options</h2>
              
              {paymentSuccess && selectedPaymentMethod === 'cod' ? (
                <div className="payment-success">
                  <h3>Order Confirmed!</h3>
                  <p>Your order will be processed with Cash on Delivery.</p>
                  <div className="payment-buttons">
                    <button 
                      className="place-order-btn"
                      onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </button>
                    <button 
                      className="back-to-cart-btn"
                      onClick={() => navigate('/cart')}
                      disabled={loading}
                    >
                      Back to Cart
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="payment-form">
                  <div className="payment-methods">
                    <div 
                      className={`payment-method ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodChange('upi')}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        id="upi" 
                        checked={selectedPaymentMethod === 'upi'}
                        onChange={() => handlePaymentMethodChange('upi')}
                      />
                      <label htmlFor="upi">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" />
                        <span>UPI</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`payment-method ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodChange('card')}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        id="card" 
                        checked={selectedPaymentMethod === 'card'}
                        onChange={() => handlePaymentMethodChange('card')}
                      />
                      <label htmlFor="card">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Credit/Debit Card" />
                        <span>Credit/Debit Card</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`payment-method ${selectedPaymentMethod === 'wallet' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodChange('wallet')}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        id="wallet" 
                        checked={selectedPaymentMethod === 'wallet'}
                        onChange={() => handlePaymentMethodChange('wallet')}
                      />
                      <label htmlFor="wallet">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Paytm_logo.svg/2560px-Paytm_logo.svg.png" alt="Wallet" />
                        <span>Wallet</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`payment-method ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => handlePaymentMethodChange('cod')}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        id="cod" 
                        checked={selectedPaymentMethod === 'cod'}
                        onChange={() => handlePaymentMethodChange('cod')}
                      />
                      <label htmlFor="cod">
                        <img src="https://cdn-icons-png.flaticon.com/512/1554/1554591.png" alt="Cash on Delivery" />
                        <span>Cash on Delivery</span>
                      </label>
                    </div>
                  </div>
                  
                  {paymentError && <div className="payment-error">{paymentError}</div>}
                  
                  <div className="payment-details">
                    {selectedPaymentMethod === 'upi' && (
                      <div className="form-group">
                        <label htmlFor="upiId">UPI ID</label>
                        <input 
                          type="text" 
                          id="upiId" 
                          name="upiId" 
                          placeholder="Enter your UPI ID (e.g., username@upi)"
                          value={paymentDetails.upiId}
                          onChange={handlePaymentDetailsChange}
                        />
                      </div>
                    )}
                    
                    {selectedPaymentMethod === 'card' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="cardNumber">Card Number</label>
                          <input 
                            type="text" 
                            id="cardNumber" 
                            name="cardNumber" 
                            placeholder="1234 5678 9012 3456"
                            value={paymentDetails.cardNumber}
                            onChange={handlePaymentDetailsChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cardName">Cardholder Name</label>
                          <input 
                            type="text" 
                            id="cardName" 
                            name="cardName" 
                            placeholder="Name on card"
                            value={paymentDetails.cardName}
                            onChange={handlePaymentDetailsChange}
                          />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="cardExpiry">Expiry Date</label>
                            <input 
                              type="text" 
                              id="cardExpiry" 
                              name="cardExpiry" 
                              placeholder="MM/YY"
                              value={paymentDetails.cardExpiry}
                              onChange={handlePaymentDetailsChange}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="cardCvv">CVV</label>
                            <input 
                              type="text" 
                              id="cardCvv" 
                              name="cardCvv" 
                              placeholder="123"
                              value={paymentDetails.cardCvv}
                              onChange={handlePaymentDetailsChange}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedPaymentMethod === 'wallet' && (
                      <div className="form-group">
                        <label htmlFor="walletId">Wallet ID</label>
                        <input 
                          type="text" 
                          id="walletId" 
                          name="walletId" 
                          placeholder="Enter your wallet ID"
                          value={paymentDetails.walletId}
                          onChange={handlePaymentDetailsChange}
                        />
                      </div>
                    )}
                    
                    {selectedPaymentMethod === 'cod' && (
                      <div className="cod-message">
                        <p>You will pay the full amount when your order is delivered.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="payment-buttons">
                    <button 
                      type="submit" 
                      className={selectedPaymentMethod === 'cod' ? 'place-order-btn' : 'pay-now-btn'}
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing ? 'Processing...' : selectedPaymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                    </button>
                    <button 
                      type="button" 
                      className="back-to-cart-btn"
                      onClick={() => navigate('/cart')}
                      disabled={paymentProcessing}
                    >
                      Back to Cart
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Order Confirmation */}
          {orderPlaced && currentOrder && (
            <div className="order-confirmation">
              <div className="success-message">
                <h2>Order Placed Successfully!</h2>
                <p>Order ID: #{currentOrder.id}</p>
                <p>Status: {currentOrder.status}</p>
                <p>Total Amount: ₹{currentOrder.total_amount.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Previous Orders Section */}
          <div className="previous-orders-section">
            <h2>Previous Orders</h2>
            {previousOrders && previousOrders.length > 0 ? (
              <div className="previous-orders">
                {previousOrders.map(order => {
                  console.log(`Rendering order ${order.order_id} with products:`, orderProducts[order.order_id]);
                  return (
                    <div key={order.order_id} className="order-card">
                      <div className="order-header">
                        <div className="order-header-top">
                          <h3>Order #{order.order_id}</h3>
                          <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                        </div>
                        <div className="order-header-details">
                          <p className="order-date">Ordered on: {formatDate(order.order_date)}</p>
                          <p className="order-total">Total: ₹{order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="order-items">
                        {orderProducts[order.order_id] && orderProducts[order.order_id].map(product => {
                          console.log(`Rendering product ${product.product_id} with image:`, product.image_url);
                          return (
                            <div key={`${order.order_id}-${product.product_id}`} className="order-item">
                              <div className="order-item-image">
                                <img 
                                  src={product.image_url || getDefaultImageUrl(product.name)} 
                                  alt={product.name}
                                  onError={(e) => {
                                    console.error(`Image load error for ${product.name}:`, e);
                                    e.target.onerror = null;
                                    e.target.src = getDefaultImageUrl(product.name);
                                  }}
                                />
                              </div>
                              <div className="order-item-details">
                                <h4>{product.name}</h4>
                                <p className="price">₹{product.price.toFixed(2)}</p>
                                <p className="quantity">Quantity: {product.quantity}</p>
                                <p className="subtotal">Subtotal: ₹{(product.price * product.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-orders">No previous orders yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Orders;