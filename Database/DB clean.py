from flask_pymongo import PyMongo
from flask import Flask

app = Flask(__name__)

# Connect to MongoDB
app.config["MONGO_URI"] = "mongodb+srv://CJicey:Baller10@cluster0.3dkrku9.mongodb.net/your_database_name"
mongo = PyMongo(app)

# Clear all documents from the "orders" collection
result = mongo.db.orders.delete_many({})

print(f"Deleted {result.deleted_count} documents from the 'orders' collection.")