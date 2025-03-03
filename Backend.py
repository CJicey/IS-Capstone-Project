from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/prebrewed')
def prebrewed():
    return render_template("prebrewed")

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/shop')
def shop():
    # Dummy product data for testing (Replace with database query)
    products = [
        {"name": "Coffee Beans", "image": "coffee.jpg", "price": 12.99},
        {"name": "Espresso Machine", "image": "espresso.jpg", "price": 299.99}
    ]
    
    categories = ["Coffee", "Machines", "Accessories"]  # Dummy category data
    
    return render_template('shop.html', products=products, categories=categories, cart_count=3)

@app.route('/about-us')
def about_us():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True)