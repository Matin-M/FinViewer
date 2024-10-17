
from flask_migrate import Migrate
from models import db, Transaction
import yfinance as yf
from flask_cors import CORS
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import os
import numpy as np
DATABASE_URL = os.environ.get('DATABASE_URL')

# app.py

app = Flask(__name__)
CORS(app)

# Configure the SQLAlchemy part of the app instance
DATABASE_URL = os.environ.get(
    'DATABASE_URL', 'postgresql://postgres:postgres@db:5432/postgres')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the app with the extension
db.init_app(app)
migrate = Migrate(app, db)


@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock(ticker):
    try:
        stock = yf.Ticker(ticker)
        data = stock.info
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/buy', methods=['POST'])
def buy_stock():
    data = request.get_json()
    ticker = data.get('ticker')
    quantity = data.get('quantity')
    if not ticker or not quantity:
        return jsonify({'error': 'Invalid input'}), 400
    try:
        new_transaction = Transaction(
            ticker=ticker.upper(),
            quantity=int(quantity),
            transaction_type='buy'
        )
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({'message': 'Stock bought successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sell', methods=['POST'])
def sell_stock():
    data = request.get_json()
    ticker = data.get('ticker')
    quantity = data.get('quantity')
    if not ticker or not quantity:
        return jsonify({'error': 'Invalid input'}), 400
    try:
        new_transaction = Transaction(
            ticker=ticker.upper(),
            quantity=int(quantity),
            transaction_type='sell'
        )
        db.session.add(new_transaction)
        db.session.commit()
        return jsonify({'message': 'Stock sold successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio', methods=['GET'])
def view_portfolio():
    try:
        transactions = Transaction.query.all()
        portfolio = {}
        for txn in transactions:
            qty = portfolio.get(txn.ticker, 0)
            if txn.transaction_type == 'buy':
                qty += txn.quantity
            elif txn.transaction_type == 'sell':
                qty -= txn.quantity
            portfolio[txn.ticker] = qty
        # Remove tickers with zero quantity
        portfolio = {k: v for k, v in portfolio.items() if v != 0}
        return jsonify(portfolio), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stock_history/<ticker>', methods=['GET'])
def get_stock_history(ticker):
    try:
        time_range = request.args.get('range', '1mo')  # Default to 1 month
        stock = yf.Ticker(ticker)
        history = stock.history(period=time_range, interval='1d')

        # Downsample to a fixed number of points (e.g., 30)
        desired_points = 60
        if len(history) > desired_points:
            indices = np.linspace(0, len(history) - 1,
                                  desired_points, dtype=int)
            history = history.iloc[indices]

        data = []
        for date, row in history.iterrows():
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
