from database import db

class Cart(db.Model):
    __tablename__ = 'cart'

    cart_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.product_id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    added_on = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    user = db.relationship('User', backref='cart_items', lazy=True)
    product = db.relationship('Product', backref='cart_items', lazy=True)

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'cart_id': self.cart_id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'added_on': self.added_on.strftime('%Y-%m-%d %H:%M:%S')
        }
