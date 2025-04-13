from flask import Flask, request, jsonify, render_template
from bson.objectid import ObjectId
from flask_pymongo import PyMongo
from flask_cors import CORS
from datetime import datetime, timedelta
import requests
import re

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/your_database_name"
mongo = PyMongo(app)

try:
    mongo.db.orders.find_one()
    print("✅ MongoDB connected successfully!")
except Exception as e:
    print(f"❌ ERROR: MongoDB connection failed - {e}")

# Mock API endpoints
API_ENDPOINTS = {
    "success": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success",
    "insufficient": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient",
    "carddetails": "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails"
}

def mask_card_number(card_number):
    return "*" * (len(card_number) - 4) + card_number[-4:]

def get_card_type(card_number):
    card_patterns = {
        "Visa": r"^4[0-9]{12}(?:[0-9]{3})?$",
        "MasterCard": r"^5[1-5][0-9]{14}$",
        "American Express": r"^3[47][0-9]{13}$",
        "Discover": r"^6(?:011|5[0-9]{2})[0-9]{12}$"
    }
    for card_type, pattern in card_patterns.items():
        if re.match(pattern, card_number):
            return card_type
    return "Unknown"

def is_valid_expiration_date(exp_date_str):
    """Validates expiration date format MM/YY and checks if it is not expired."""
    try:
        if not re.match(r"^(0[1-9]|1[0-2])\/\d{2}$", exp_date_str):
            return False, "Expiration date must be in MM/YY format"

        exp_month, exp_year = map(int, exp_date_str.split("/"))
        exp_year += 2000  # Convert YY to YYYY

        now = datetime.utcnow()
        # Set expiration to the end of the expiration month
        exp_date = datetime(exp_year, exp_month, 1) + timedelta(days=31)
        exp_date = datetime(exp_date.year, exp_date.month, 1) - timedelta(days=1)

        if now > exp_date:
            return False, "Card has expired"

        return True, ""
    except Exception as e:
        return False, f"Invalid expiration date: {str(e)}"

@app.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request, missing data"}), 400

        first_name = data.get("fname")
        last_name = data.get("lname")
        credit_card = data.get("creditcard")
        exp_date = data.get("expdate")
        cvv = data.get("CVV")

        if not all([first_name, last_name, credit_card, exp_date, cvv]):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate expiration date
        valid_exp, exp_message = is_valid_expiration_date(exp_date)
        if not valid_exp:
            return jsonify({"error": exp_message}), 400

        masked_card = mask_card_number(credit_card)
        card_type = get_card_type(credit_card)

        if credit_card.startswith("4"):
            api_url = API_ENDPOINTS["success"]
        elif credit_card.startswith("5"):
            api_url = API_ENDPOINTS["insufficient"]
        else:
            api_url = API_ENDPOINTS["carddetails"]

        response = requests.get(api_url)
        if response.status_code != 200:
            return jsonify({"error": "Payment gateway error"}), 500

        api_response = response.json()
        success = api_response.get("Success", False)
        reason = api_response.get("Reason", "Unknown error")
        auth_token = api_response.get("AuthorizationToken")
        authorized_amount = api_response.get("AuthorizedAmount", 0.0)

        order_data = {
            "fname": first_name,
            "lname": last_name,
            "card_type": card_type,
            "masked_card": masked_card,
            "success": success,
            "reason": reason,
            "authorized_amount": authorized_amount,
            "authorization_token": auth_token
        }
        inserted_order = mongo.db.orders.insert_one(order_data)
        order_id = inserted_order.inserted_id

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/warehouse')
def warehouse():
    orders = list(mongo.db.orders.find()) 
    return render_template('warehouse.html', orders=orders)

@app.route('/about')
def about_us():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True)