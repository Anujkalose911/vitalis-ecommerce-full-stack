from database import db

class Product(db.Model):
    __tablename__ = 'product'

    product_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10,2), nullable=False)
    category = db.Column(db.Enum('Fitness Equipment', 'Wellness & Self-care', 
                                 'Hair & Skin Products', 'Health Supplements'), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        """Convert product instance to dictionary."""
        return {
            'product_id': self.product_id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'category': self.category,
            'stock': self.stock,
            'image_url': self.image_url
        }
