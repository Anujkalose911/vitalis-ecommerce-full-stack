from flask import Blueprint, request, jsonify
from database import db
from models.order_product import OrderProduct

order_product_bp = Blueprint('order_product_bp', __name__)

# Add product to order
@order_product_bp.route('/order-products', methods=['POST'])
def add_product_to_order():
    data = request.get_json()

    if not all(k in data for k in ('order_id', 'product_id', 'quantity')):
        return jsonify({'error': 'Missing fields'}), 400

    new_entry = OrderProduct(
        order_id=data['order_id'],
        product_id=data['product_id'],
        quantity=data['quantity']
    )

    db.session.add(new_entry)
    db.session.commit()
    return jsonify({'message': 'Product added to order successfully', 'order_product': new_entry.to_dict()}), 201

# Get all products for a specific order
@order_product_bp.route('/order-products/<int:order_id>', methods=['GET'])
def get_order_products(order_id):
    entries = OrderProduct.query.filter_by(order_id=order_id).all()
    return jsonify([entry.to_dict() for entry in entries])

# Delete a specific product from an order
@order_product_bp.route('/order-products', methods=['DELETE'])
def delete_order_product():
    data = request.get_json()

    order_id = data.get('order_id')
    product_id = data.get('product_id')

    entry = OrderProduct.query.filter_by(order_id=order_id, product_id=product_id).first()
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Order product deleted successfully'})
