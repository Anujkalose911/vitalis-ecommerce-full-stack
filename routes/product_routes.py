from flask import Blueprint, request, jsonify
from database import db
from models.product import Product
from sqlalchemy import or_

product_bp = Blueprint('product_bp', __name__)

# Create Product
@product_bp.route('/products', methods=['POST'])
def create_product():
    data = request.get_json()
    
    # Validate input
    if not all(key in data for key in ['name', 'description', 'price', 'category', 'stock', 'image_url']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Ensure stock is not negative
    if data['stock'] < 0:
        return jsonify({'error': 'Stock cannot be negative'}), 400

    new_product = Product(
        name=data['name'],
        description=data['description'],
        price=data['price'],
        category=data['category'],
        stock=data['stock'],
        image_url=data['image_url']
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({'message': 'Product created successfully', 'product': new_product.to_dict()}), 201

# Get All Products
@product_bp.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products])

# Get Products by Categories
@product_bp.route('/products/categories', methods=['GET'])
def get_products_by_categories():
    categories = request.args.get('categories', '').split(',')
    if not categories or categories[0] == '':
        return jsonify({'error': 'No categories provided'}), 400
    
    products = Product.query.filter(Product.category.in_(categories)).all()
    return jsonify([product.to_dict() for product in products])

# Search Products
@product_bp.route('/products/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    
    # Search in both name and description
    products = Product.query.filter(
        or_(
            Product.name.ilike(f'%{query}%'),
            Product.description.ilike(f'%{query}%')
        )
    ).all()
    
    return jsonify([product.to_dict() for product in products])

# Get Single Product by ID
@product_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict())

# Update Product
@product_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()

    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        product.price = data['price']
    if 'category' in data:
        product.category = data['category']
    if 'stock' in data:
        product.stock = data['stock']
    if 'image_url' in data:
        product.image_url = data['image_url']

    db.session.commit()
    return jsonify({'message': 'Product updated successfully', 'product': product.to_dict()})

# Delete Product
@product_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})
