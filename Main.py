from flask import Flask, request, jsonify, render_template
from bson.objectid import ObjectId
from flask_pymongo import PyMongo
from flask_cors import CORS
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
    """Masks all but the last four digits of a credit card number."""
    return "*" * (len(card_number) - 4) + card_number[-4:]

def get_card_type(card_number):
    """Determines the credit card type based on the first few digits."""
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

        # Mask credit card number
        masked_card = mask_card_number(credit_card)
        card_type = get_card_type(credit_card)

        # Decide which API to call based on card number
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

        # Save order data to MongoDB
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
        mongo.db.orders.insert_one(order_data)

        if success:
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