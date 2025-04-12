from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)

# Connect to MongoDB
app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/your_database_name"
mongo = PyMongo(app)

# Retrieve all orders
orders = mongo.db.orders.find()

for order in orders:
    print(order) 