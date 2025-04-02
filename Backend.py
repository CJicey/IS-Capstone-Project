from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/"
mongo = PyMongo(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/process_payment', methods=['POST'])
def process_payment():
    data = request.json
    
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    order_data = {
        "fname": data.get("fname"),
        "lname": data.get("lname"),
        "creditcard": data.get("creditcard"),
        "expdate": data.get("expdate"),
        "cvv": data.get("CVV")
    }

    try:
        # Insert into MongoDB
        mongo.db.orders.insert_one(order_data)
        return jsonify({"status": "success", "message": "Payment processed"}), 200
    except Exception as e:
        print("Database error:", e)
        return jsonify({"error": "Database error"}), 500

@app.route('/shop')
def shop():
    return render_template('shop.html')

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/about-us')
def about_us():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True)