from flask import Blueprint, request, jsonify
from database import db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS, cross_origin

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()

        # Validate required fields
        if not data or not data.get('fname') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400

        # Check if user with same email exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 409  # Conflict error

        # Hash the password before storing
        hashed_password = generate_password_hash(data['password'])

        # Create new user
        new_user = User(
            fname=data['fname'],
            lname=data.get('lname', ''),  # Default empty string if lname is missing
            email=data['email'],
            password=hashed_password
        )

        # Add user to database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User created successfully', 'user': new_user.to_dict()}), 201

    except Exception as e:
        db.session.rollback()  # Prevent transaction failure
        print("Error:", str(e))  # Log the error in terminal
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

# Add login route
@user_bp.route('/users/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
            
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        # Check if user exists and password is correct
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        # In a real app, you would generate a JWT token here
        # For now, just return a dummy token
        token = "dummy_token_" + str(user.user_id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

# Get All Users
@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

# Get Single User by ID
@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

# Update User
@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if data.get('fname'):
        user.fname = data['fname']
    if data.get('lname'):
        user.lname = data['lname']
    if data.get('email'):
        user.email = data['email']

    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()})

# Delete User
@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})
