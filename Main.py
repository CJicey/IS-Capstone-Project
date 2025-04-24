from flask import Flask, request, jsonify, render_template  # Flask core modules
from bson.objectid import ObjectId                          # For handling MongoDB ObjectId
from flask_pymongo import PyMongo                           # MongoDB integration with Flask
from flask_cors import CORS                                 # For Cross-Origin Resource Sharing
from datetime import datetime, timedelta                    # To handle date/time operations
import requests                                             # To make external API calls
import re                                                   # For regex operations

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB configuration and initialization
app.config["MONGO_URI"] = "mongodb://localhost:27017/CosmoCanyon"
mongo = PyMongo(app)

# Check if MongoDB is connected successfully
try:
    mongo.db.orders.find_one()  # Try accessing the orders collection
    print("✅ MongoDB connected successfully!")
except Exception as e:
    print(f"❌ ERROR: MongoDB connection failed - {e}")

# Define mock API endpoints for payment processing (simulate payment gateway responses)
API_ENDPOINTS = {
    "success": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success",
    "insufficient": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient",
    "carddetails": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails"
}

# Utility: Mask the credit card number to hide all but the last 4 digits
def mask_card_number(card_number):
    return "*" * (len(card_number) - 4) + card_number[-4:]

# Utility: Identify the card type using regex
def get_card_type(card_number):
    if re.match(r"^4", card_number):
        return "Visa"
    elif re.match(r"^5[1-5]", card_number):
        return "MasterCard"
    elif re.match(r"^3[47]", card_number):
        return "American Express"
    else:
        return "Unknown"
    
# Utility: Validate expiration date format and check if the card is expired
def is_valid_expiration_date(exp_date_str):
    try:
        # Format must be MM/YY
        if not re.match(r"^(0[1-9]|1[0-2])\/\d{2}$", exp_date_str):
            return False, "Expiration date must be in MM/YY format"

        exp_month, exp_year = map(int, exp_date_str.split("/"))
        exp_year += 2000  # Convert YY to YYYY

        now = datetime.utcnow()

        # Set expiration to last day of the month
        exp_date = datetime(exp_year, exp_month, 1) + timedelta(days=31)
        exp_date = datetime(exp_date.year, exp_date.month, 1) - timedelta(days=1)

        if now > exp_date:
            return False, "Card has expired"

        return True, ""
    except Exception as e:
        return False, f"Invalid expiration date: {str(e)}"

# Payment processing route
@app.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request, missing data"}), 400

        # Extract required fields
        first_name = data.get("fname")
        last_name = data.get("lname")
        credit_card = data.get("creditcard")
        exp_date = data.get("expdate")
        cvv = data.get("CVV")
        total_amount = data.get("totalAmount", 0.0)

        # Optional customer info
        address = data.get("address", "")
        city = data.get("city", "")
        state = data.get("state", "")
        zipcode = data.get("zipcode", "")
        email = data.get("email", "")

        # Cart items
        cart = data.get("cart", [])

        # Validate essential fields
        if not all([first_name, last_name, credit_card, exp_date, cvv]):
            return jsonify({"error": "Missing required fields"}), 400

        if not isinstance(total_amount, (int, float)) or total_amount <= 0:
            return jsonify({"error": "Invalid or missing total amount"}), 400

        valid_exp, exp_message = is_valid_expiration_date(exp_date)
        if not valid_exp:
            return jsonify({"error": exp_message}), 400

        # Mask and determine card type
        masked_card = mask_card_number(credit_card)
        card_type = get_card_type(credit_card)

        # Handle unknown card type
        if card_type == "Unknown":
        # Simulate calling card detail error API
            response = requests.get(API_ENDPOINTS["carddetails"])
            if response.status_code != 200:
                return jsonify({"error": "Card verification failed"}), 500

        api_response = response.json()
        return jsonify({
            "status": "failed",
            "message": api_response.get("Reason", "Invalid card details"),
            "card_type": card_type,
            "masked_card": masked_card
        }), 400
    
        # Determine appropriate API endpoint based on total amount
        if total_amount >= 100:
            api_url = API_ENDPOINTS["insufficient"]
        elif total_amount > 0:
            api_url = API_ENDPOINTS["success"]
        else:
            api_url = API_ENDPOINTS["carddetails"]

        # Simulate external payment API call
        response = requests.get(api_url)
        if response.status_code != 200:
            return jsonify({"error": "Payment gateway error"}), 500

        # Parse API response
        api_response = response.json()
        success = api_response.get("Success", False)
        reason = api_response.get("Reason", "Unknown error")
        auth_token = api_response.get("AuthorizationToken")
        authorized_amount = api_response.get("AuthorizedAmount", total_amount)

        # Prepare and store order data in MongoDB
        order_data = {
            "first_name": first_name,
            "last_name": last_name,
            "address": address,
            "city": city,
            "state": state,
            "zipcode": zipcode,
            "email": email,
            "cart": cart,
            "totalAmount": authorized_amount,
            "card_type": card_type,
            "masked_card": masked_card,
            "success": success,
            "reason": reason,
            "authorization_token": auth_token,
            "settled": False
        }

        inserted_order = mongo.db.orders.insert_one(order_data)
        order_id = inserted_order.inserted_id

        # If successful, log authorization details
        if success:
            mongo.db.auth_collection.insert_one({
                "order_id": str(order_id),
                "timestamp": datetime.utcnow(),
                "auth_token": f"{order_id}_{auth_token}",
                "auth_amount": authorized_amount,
                "auth_expiry": datetime.utcnow() + timedelta(days=7)
            })

            return jsonify({
                "status": "success",
                "message": "Transaction Approved!",
                "card_type": card_type,
                "masked_card": masked_card,
                "auth_token": auth_token,
                "amount": authorized_amount
            }), 200
        else:
            return jsonify({
                "status": "failed",
                "message": reason,
                "card_type": card_type,
                "masked_card": masked_card
            }), 400

    except requests.exceptions.RequestException as e:
        print("❌ API request failed:", e)
        return jsonify({"error": "Payment processing error"}), 500
    except Exception as e:
        print("❌ Server error:", e)
        return jsonify({"error": "Internal server error"}), 500

# Endpoint to settle an authorized order
@app.route('/settle_order/<order_id>', methods=['POST'])
def settle_order(order_id):
    try:
        order = mongo.db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            return jsonify({"error": "Order not found"}), 404

        if order.get("success") and not order.get("settled"):
            mongo.db.orders.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"settled": True}}
            )
            return jsonify({"message": "Order settled successfully"}), 200
        else:
            return jsonify({"error": "Order already settled or not authorized"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to settle order: {str(e)}"}), 500

# Warehouse dashboard page to list all orders
@app.route('/warehouse')
def warehouse():
    orders = list(mongo.db.orders.find())

    # Default values for orders if fields are missing
    for order in orders:
        order.setdefault("totalAmount", 0.0)
        order.setdefault("cart", [])
        order.setdefault("first_name", "Unknown")
        order.setdefault("last_name", "")
    
    return render_template('warehouse.html', orders=orders)

# Render the home page
@app.route('/')
def index():
    return render_template('index.html')

# Render checkout page
@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

# Render sale page
@app.route('/sale')
def sale():
    return render_template('sale.html')

# Render about us page
@app.route('/about')
def about_us():
    return render_template('about.html')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)