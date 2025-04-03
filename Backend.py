from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Secure MongoDB Connection
app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/your_database_name"
mongo = PyMongo(app)

# Verify MongoDB Connection
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/about')
def about_us():
    return render_template('about.html')

@app.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request, missing data"}), 400

        # Retrieve form data
        first_name = data.get("fname")
        last_name = data.get("lname")
        credit_card = data.get("creditcard")
        exp_date = data.get("expdate")
        cvv = data.get("CVV")

        # Validate input
        if not all([first_name, last_name, credit_card, exp_date, cvv]):
            return jsonify({"error": "Missing required fields"}), 400

        # Select API URL based on card number (mock validation)
        if credit_card.startswith("4"):
            api_url = API_ENDPOINTS["success"]
        else:
            api_url = API_ENDPOINTS["insufficient"]

        # Call mock payment API
        response = requests.get(api_url)
        if response.status_code != 200:
            return jsonify({"error": "Payment gateway error"}), 500

        api_response = response.json()
        transaction_status = api_response.get("status")

        # Store only essential details in MongoDB (No Credit Card Info)
        order_data = {
            "fname": first_name,
            "lname": last_name,
            "status": transaction_status
        }
        mongo.db.orders.insert_one(order_data)

        if transaction_status == "success":
            return jsonify({"status": "success", "message": "Transaction Approved!"}), 200
        else:
            return jsonify({"status": "failed", "message": "Transaction Failed"}), 400

    except requests.exceptions.RequestException as e:
        print("❌ API request failed:", e)
        return jsonify({"error": "Payment processing error"}), 500
    except Exception as e:
        print("❌ Server error:", e)
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)