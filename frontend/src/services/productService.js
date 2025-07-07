import API from '../api';

// Get all products
export const getAllProducts = async () => {
  try {
    const response = await API.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const response = await API.get('/products');
    const allProducts = response.data;
    
    // Filter products by category
    return allProducts.filter(product => product.category === category);
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Get a single product by ID
export const getProductById = async (productId) => {
  try {
    const response = await API.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Get products by categories
export const getProductsByCategories = async (categories) => {
  try {
    const response = await API.get('/products/categories', {
      params: { categories: categories.join(',') }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching products by categories:', error);
    throw error;
  }
};

// Search products
export const searchProducts = async (query) => {
  try {
    const response = await API.get('/products/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}; 