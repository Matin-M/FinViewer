from flask_migrate import Migrate
from models import db, Transaction
import yfinance as yf
from flask_cors import CORS
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import os
import numpy as np
import logging

DATABASE_URL = os.environ.get('DATABASE_URL')

app = Flask(__name__)
CORS(app)

# Configure the SQLAlchemy part of the app instance
DATABASE_URL = os.environ.get(
    'DATABASE_URL', 'postgresql://postgres:postgres@db:5432/postgres')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = True

# Initialize the app with the extension
db.init_app(app)
migrate = Migrate(app, db)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
file_handler = logging.FileHandler('error.log')
file_handler.setLevel(logging.DEBUG)  # Capture debug-level logs as well
app.logger.addHandler(file_handler)


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
        # Get the current price
        stock = yf.Ticker(ticker)
        stock_info = stock.info

        # Try to get the regular, post-market, or previous close price
        current_price = stock_info.get('regularMarketPrice') or \
            stock_info.get('postMarketPrice') or \
            stock_info.get('previousClose')

        if current_price is None:
            return jsonify({'error': 'Unable to retrieve price data'}), 500

        # Proceed with buying the stock at the determined price
        new_transaction = Transaction(
            ticker=ticker.upper(),
            quantity=int(quantity),
            transaction_type='buy',
            price=current_price
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({'message': f'Stock bought successfully at {current_price}'}), 201
    except Exception as e:
        app.logger.error(f"Error occurred in /api/buy: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sell', methods=['POST'])
def sell_stock():
    data = request.get_json()
    ticker = data.get('ticker')
    quantity = data.get('quantity')
    if not ticker or not quantity:
        return jsonify({'error': 'Invalid input'}), 400
    try:
        # Get the current price
        stock = yf.Ticker(ticker)
        stock_info = stock.info

        # Try to get the regular, post-market, or previous close price
        current_price = stock_info.get('regularMarketPrice') or \
            stock_info.get('postMarketPrice') or \
            stock_info.get('previousClose')

        if current_price is None:
            return jsonify({'error': 'Unable to retrieve price data'}), 500

        # Proceed with selling the stock at the determined price
        new_transaction = Transaction(
            ticker=ticker.upper(),
            quantity=int(quantity),
            transaction_type='sell',
            price=current_price
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({'message': f'Stock sold successfully at {current_price}'}), 201
    except Exception as e:
        app.logger.error(f"Error occurred in /api/sell: {str(e)}")
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


@app.route('/api/portfolio_details', methods=['GET'])
def get_portfolio_details():
    try:
        transactions = Transaction.query.order_by(Transaction.timestamp).all()
        portfolio = {}
        for txn in transactions:
            ticker = txn.ticker.upper()
            if ticker not in portfolio:
                portfolio[ticker] = {'quantity': 0, 'cost_basis': 0.0}
            position = portfolio[ticker]
            if txn.transaction_type == 'buy':
                total_cost = position['cost_basis'] * position['quantity']
                total_cost += txn.price * txn.quantity
                position['quantity'] += txn.quantity
                position['cost_basis'] = total_cost / position['quantity']
            elif txn.transaction_type == 'sell':
                total_cost = position['cost_basis'] * position['quantity']
                total_cost -= position['cost_basis'] * txn.quantity
                position['quantity'] -= txn.quantity
                position['cost_basis'] = total_cost / \
                    position['quantity'] if position['quantity'] > 0 else 0.0
        # Remove positions with zero quantity
        portfolio = {k: v for k, v in portfolio.items() if v['quantity'] > 0}

        # Get current prices
        tickers = list(portfolio.keys())
        stocks = yf.Tickers(' '.join(tickers))
        prices = {
            ticker: stocks.tickers[ticker].info['regularMarketPrice'] for ticker in tickers}

        # Prepare portfolio details
        portfolio_details = []
        for ticker, position in portfolio.items():
            quantity = position['quantity']
            cost_basis = position['cost_basis']
            current_price = prices.get(ticker, 0.0)
            total_value = current_price * quantity
            total_cost = cost_basis * quantity
            unrealized_pl = total_value - total_cost
            portfolio_details.append({
                'ticker': ticker,
                'quantity': quantity,
                'cost_basis': cost_basis,
                'current_price': current_price,
                'total_value': total_value,
                'unrealized_pl': unrealized_pl
            })
        return jsonify(portfolio_details), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio_history', methods=['GET'])
def get_portfolio_history():
    try:
        # Get current holdings
        transactions = Transaction.query.all()
        holdings = {}
        for txn in transactions:
            qty = holdings.get(txn.ticker.upper(), 0)
            if txn.transaction_type == 'buy':
                qty += txn.quantity
            elif txn.transaction_type == 'sell':
                qty -= txn.quantity
            holdings[txn.ticker.upper()] = qty
        # Remove holdings with zero quantity
        holdings = {k: v for k, v in holdings.items() if v != 0}

        tickers = list(holdings.keys())
        quantities = holdings

        # Get historical prices
        period = '1y'  # You can adjust the period as needed
        data = yf.download(tickers=tickers, period=period,
                           interval='1d', group_by='ticker', auto_adjust=False)

        # Build portfolio value over time
        portfolio_values = []
        dates = data.index
        for date in dates:
            total_value = 0.0
            for ticker in tickers:
                try:
                    close_price = data[ticker]['Close'].loc[date]
                    quantity = quantities[ticker]
                    total_value += close_price * quantity
                except KeyError:
                    pass
            portfolio_values.append({
                'date': date.strftime('%Y-%m-%d'),
                'total_value': total_value
            })
        return jsonify(portfolio_values), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stock_history/<ticker>', methods=['GET'])
def get_stock_history(ticker):
    try:
        time_range = request.args.get('range', '1mo')  # Default to 1 month
        stock = yf.Ticker(ticker)
        history = stock.history(period=time_range, interval='1d')

        # Downsample to a fixed number of points (e.g., 60)
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


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"An error occurred: {e}")
    response = {
        "error": str(e),
        "type": type(e).__name__
    }
    return jsonify(response), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
