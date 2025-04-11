from database import db

class User(db.Model):
    __tablename__ = 'user'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fname = db.Column(db.String(50), nullable=False)
    lname = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Store hashed password
    registration_date = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    def to_dict(self):
        """Convert model instance to dictionary (excluding password)."""
        return {
            'user_id': self.user_id,
            'fname': self.fname,
            'lname': self.lname,
            'email': self.email,
            'registration_date': self.registration_date.strftime('%Y-%m-%d %H:%M:%S')
        }
