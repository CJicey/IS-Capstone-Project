from flask import Flask, render_template, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/shop')
def shop():
    return render_template('shop.html')

@app.route('/sale')
def sale():
    return render_template('sale.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/about-us')
def about_us():
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True)