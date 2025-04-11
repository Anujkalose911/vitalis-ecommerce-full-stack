import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getProductsByCategories, searchProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import Typewriter from '../components/Typewriter';
import '../styles/Home.css';

function Home() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubheading, setShowSubheading] = useState(false);

  // Define categories
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'Fitness Equipment', name: 'Fitness & Equipment' },
    { id: 'Wellness & Self-care', name: 'Wellness & Self-Care' },
    { id: 'Hair & Skin Products', name: 'Hair & Skin Products' },
    { id: 'Health Supplements', name: 'Health Supplements' }
  ];

  // Parse search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    
    if (searchParam) {
      setSearchQuery(searchParam);
      setActiveCategory('all');
      handleSearch(searchParam);
    } else {
      fetchProducts();
    }
  }, [location.search]);

  // Fetch products on component mount
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getProductsByCategories([
        'Fitness Equipment', 
        'Wellness & Self-care',
        'Hair & Skin Products',
        'Health Supplements'
      ]);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query) {
      fetchProducts();
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = await searchProducts(query);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to search products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products when active category changes
  useEffect(() => {
    if (searchQuery) return; // Don't filter if there's a search query
    
    if (activeCategory === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.category === activeCategory);
      setFilteredProducts(filtered);
    }
  }, [activeCategory, products, searchQuery]);

  // Handle main heading typewriter completion
  const handleMainHeadingComplete = () => {
    setShowSubheading(true);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>
          <Typewriter 
            text="Elevate Your Wellbeing" 
            delay={100} 
            onComplete={handleMainHeadingComplete} 
          />
        </h1>
        {showSubheading && (
          <p>
            <Typewriter 
              text="Premium Fitness, Wellness, and Self-Care Essentials" 
              delay={50} 
            />
          </p>
        )}
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Search Results Header */}
      {searchQuery && (
        <div className="search-results-header">
          <h2>Search Results for "{searchQuery}"</h2>
          <button 
            className="clear-search-btn"
            onClick={() => {
              setSearchQuery('');
              fetchProducts();
            }}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          {/* No Products Message */}
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found {searchQuery ? `for "${searchQuery}"` : 'in this category'}.</p>
            </div>
          ) : (
            /* Products Grid */
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
  