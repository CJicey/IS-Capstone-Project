from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)

app.config["MONGO_URI"] = "mongodb://localhost:27017/CosmoCanyon"
mongo = PyMongo(app)
orders = mongo.db.orders.find()

for order in orders:
    print(order)
    print()