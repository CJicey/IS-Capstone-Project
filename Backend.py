from flask import Flask, request, jsonify, render_template, url_for
from flask_pymongo import PyMongo
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# MongoDB connection
app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/your_database_name"
mongo = PyMongo(app)

if mongo.db is None:
    print("❌ ERROR: MongoDB connection failed. Ensure MongoDB is running.")

# Mock API endpoints for transactions
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
    data = request.json
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    credit_card = data.get("creditcard")
    exp_date = data.get("expdate")
    cvv = data.get("CVV")

    # Determine the correct API URL
    if not credit_card or not exp_date or not cvv:
        api_url = API_ENDPOINTS["carddetails"]
    elif credit_card.startswith("4"):
        api_url = API_ENDPOINTS["success"]
    else:
        api_url = API_ENDPOINTS["insufficient"]

    try:
        response = requests.get(api_url)
        api_response = response.json()

        # Save transaction to MongoDB
        order_data = {
            "fname": data.get("fname"),
            "lname": data.get("lname"),
            "creditcard": credit_card,
            "expdate": exp_date,
            "cvv": cvv,
            "status": api_response.get("status")
        }
        mongo.db.orders.insert_one(order_data)

        if api_response.get("status") == "success":
            return jsonify({"status": "success", "message": "Transaction Approved!"}), 200
        elif api_response.get("status") == "insufficient":
            return jsonify({"status": "failed", "message": "Transaction Failed: Insufficient Funds"}), 400
        else:
            return jsonify({"status": "failed", "message": "Transaction Failed: Incorrect or Missing Card Details"}), 400

    except Exception as e:
        print("Error processing transaction:", e)
        return jsonify({"error": "Transaction failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)