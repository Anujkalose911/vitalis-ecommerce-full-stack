from database import db
from models.order_product import OrderProduct
from models.product import Product

class Order(db.Model):
    __tablename__ = 'order'

    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete="CASCADE"), nullable=False)
    total_amount = db.Column(db.Numeric(10,2), nullable=False)
    order_date = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    status = db.Column(db.Enum('Pending', 'Shipped', 'Delivered', 'Cancelled'), default='Pending', nullable=False)
    payment_status = db.Column(db.String(20), default='Pending', nullable=False)
    payment_method = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        """Convert model instance to dictionary"""
        # Get order products
        order_products = OrderProduct.query.filter_by(order_id=self.order_id).all()
        
        # Get product details for each order product
        items = []
        for op in order_products:
            product = Product.query.get(op.product_id)
            if product:
                items.append({
                    'product_id': op.product_id,
                    'quantity': op.quantity,
                    'price': float(product.price),
                    'product_name': product.name
                })
        
        return {
            'order_id': self.order_id,
            'user_id': self.user_id,
            'total_amount': float(self.total_amount),
            'order_date': self.order_date.strftime('%Y-%m-%d %H:%M:%S'),
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'items': items
        }
