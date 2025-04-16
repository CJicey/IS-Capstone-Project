from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)

app.config["MONGO_URI"] = "mongodb://localhost:27017/CosmoCanyon"
mongo = PyMongo(app)
result = mongo.db.orders.delete_many({})

print(f"Deleted {result.deleted_count} documents from the 'orders' collection.")