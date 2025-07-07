from flask import Blueprint, request, jsonify
from database import db
from models.order import Order
from models.order_product import OrderProduct
from models.product import Product

order_bp = Blueprint('order_bp', __name__)

# Create a new order
@order_bp.route('/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        print("Received order data:", data)  # Debug log
        
        user_id = data.get('user_id')
        total_amount = data.get('total_amount')
        items = data.get('items', [])  # Get items array from request
        payment_status = data.get('payment_status', 'Pending')  # Get payment status, default to 'Pending'
        payment_method = data.get('payment_method')  # Get payment method

        print(f"User ID: {user_id}, Total Amount: {total_amount}, Items: {items}, Payment Status: {payment_status}, Payment Method: {payment_method}")  # Debug log

        if not user_id or not total_amount or not items:
            print("Missing required fields")  # Debug log
            return jsonify({'message': 'Missing required fields'}), 400

        # Check stock availability and reduce stock
        for item in items:
            product = Product.query.get(item['product_id'])
            if not product:
                return jsonify({'message': f'Product {item["product_id"]} not found'}), 404
            
            if product.stock < item['quantity']:
                return jsonify({'message': f'Insufficient stock for product {product.name}. Available: {product.stock}, Requested: {item["quantity"]}'}), 400
            
            # Reduce stock
            product.stock -= item['quantity']
            print(f"Reduced stock for product {product.name} by {item['quantity']}. New stock: {product.stock}")

        # Create new order
        new_order = Order(
            user_id=user_id,
            total_amount=total_amount,
            status='Pending',
            payment_status=payment_status,
            payment_method=payment_method
        )
        db.session.add(new_order)
        db.session.flush()  # Get the order ID before committing
        
        print(f"Created order with ID: {new_order.order_id}")

        # Create order_product entries for each item
        for item in items:
            print(f"Creating order_product entry: {item}")  # Debug log
            try:
                # Ensure product_id is present
                if 'product_id' not in item:
                    print(f"Error: product_id missing in item: {item}")
                    db.session.rollback()
                    return jsonify({'message': 'product_id is required for each item'}), 400
                
                order_product = OrderProduct(
                    order_id=new_order.order_id,
                    product_id=item['product_id'],
                    quantity=item['quantity']
                )
                db.session.add(order_product)
            except Exception as e:
                print(f"Error creating order_product entry: {str(e)}")
                db.session.rollback()
                return jsonify({'message': f'Error creating order_product entry: {str(e)}'}), 500

        db.session.commit()
        print("Order and order_product entries committed successfully")  # Debug log
        
        # Fetch the complete order with items
        order_with_items = Order.query.get(new_order.order_id)
        return jsonify(order_with_items.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating order: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full stack trace
        return jsonify({'message': f'Error creating order: {str(e)}'}), 500

# Get All Orders
@order_bp.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders])

# Get Single Order by ID
@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(order.to_dict())

# Get all orders of a specific user
@order_bp.route('/orders/user/<int:user_id>', methods=['GET'])
def get_orders_by_user(user_id):
    orders = Order.query.filter_by(user_id=user_id).all()
    return jsonify([order.to_dict() for order in orders])


# Update Order (Change Status)
@order_bp.route('/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    data = request.get_json()
    if data.get('status') and data['status'] in ['Pending', 'Shipped', 'Delivered', 'Cancelled']:
        order.status = data['status']

    db.session.commit()
    return jsonify({'message': 'Order updated successfully', 'order': order.to_dict()})

# Delete Order
@order_bp.route('/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted successfully'})
