from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://myuser:mypassword@localhost/mydatabase'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/prebrewed')
def prebrewed():
    return render_template('prebrewed.html')

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/Shop')
def Shop():
    return render_template('Shop.html')

@app.route('/about')
def about():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True)