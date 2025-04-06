from database import db

class OrderProduct(db.Model):
    __tablename__ = 'order_product'

    order_id = db.Column(db.Integer, db.ForeignKey('order.order_id', ondelete="CASCADE"), primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.product_id', ondelete="CASCADE"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'order_id': self.order_id,
            'product_id': self.product_id,
            'quantity': self.quantity
        }
