from flask import Blueprint, request, jsonify
from database import db
from models.cart import Cart
from models.user import User
from models.product import Product

cart_bp = Blueprint('cart_bp', __name__)

# Add item to cart
@cart_bp.route('/cart', methods=['POST'])
def add_to_cart():
    data = request.get_json()

    if not data.get('user_id') or not data.get('product_id') or not data.get('quantity'):
        return jsonify({'error': 'Missing required fields'}), 400

    user = User.query.get(data['user_id'])
    product = Product.query.get(data['product_id'])

    if not user or not product:
        return jsonify({'error': 'User or Product not found'}), 404

    if product.stock < data['quantity']:
        return jsonify({'error': 'Insufficient stock available'}), 400

    new_cart_item = Cart(
        user_id=data['user_id'],
        product_id=data['product_id'],
        quantity=data['quantity']
    )

    db.session.add(new_cart_item)
    db.session.commit()

    return jsonify({'message': 'Item added to cart', 'cart': new_cart_item.to_dict()}), 201


# Get all cart items
@cart_bp.route('/cart', methods=['GET'])
def get_cart_items():
    cart_items = Cart.query.all()
    return jsonify([item.to_dict() for item in cart_items])


# Get cart items for a specific user
@cart_bp.route('/cart/user/<int:user_id>', methods=['GET'])
def get_user_cart(user_id):
    cart_items = Cart.query.filter_by(user_id=user_id).all()
    return jsonify([item.to_dict() for item in cart_items])


# Update cart item quantity
@cart_bp.route('/cart/<int:cart_id>', methods=['PUT'])
def update_cart_item(cart_id):
    cart_item = Cart.query.get(cart_id)
    if not cart_item:
        return jsonify({'error': 'Cart item not found'}), 404

    data = request.get_json()
    if 'quantity' in data:
        if data['quantity'] <= 0:
            return jsonify({'error': 'Quantity must be greater than zero'}), 400
        cart_item.quantity = data['quantity']

    db.session.commit()
    return jsonify({'message': 'Cart updated', 'cart': cart_item.to_dict()})


# Remove an item from the cart
@cart_bp.route('/cart/<int:cart_id>', methods=['DELETE'])
def remove_from_cart(cart_id):
    cart_item = Cart.query.get(cart_id)
    if not cart_item:
        return jsonify({'error': 'Cart item not found'}), 404

    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'message': 'Item removed from cart'})
