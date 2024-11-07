from flask_migrate import Migrate
from models import db, Transaction, Preference
import yfinance as yf
from flask_cors import CORS
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import os
import numpy as np
import logging
import random
import requests

DATABASE_URL = os.environ.get('DATABASE_URL')

app = Flask(__name__)
CORS(app)

# Configure the SQLAlchemy part of the app instance
DATABASE_URL = os.environ.get(
    'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = True

# Initialize the app with the extension
db.init_app(app)
migrate = Migrate(app, db)

logging.basicConfig(level=logging.ERROR)


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"An error occurred: {e}", exc_info=True)
    response = {
        "error": str(e),
        "type": type(e).__name__
    }
    return jsonify(response), 500


@app.route('/api/preference', methods=['GET', 'PUT'])
def set_pref():
    data = request.get_json() if request.method == "PUT" else request.args
    key = data.get('key')

    if not key:
        return jsonify({'error': 'Key is required'}), 400

    if request.method == "GET":
        pref = db.session.execute(
            db.select(Preference).filter_by(key=key)
        ).scalar_one_or_none()

        if pref is None:
            return jsonify({'error': 'Preference not found'}), 404
        return jsonify({'value': pref.value})

    elif request.method == "PUT":
        value = data.get('value')
        if value is None:
            return jsonify({'error': 'Value is required'}), 400

        pref = db.session.execute(
            db.select(Preference).filter_by(key=key)
        ).scalar_one_or_none()

        if pref is None:
            new_pref = Preference(key=key, value=value)
            db.session.add(new_pref)
        else:
            # Update the existing preference
            pref.value = value

        db.session.commit()
        return jsonify({'message': 'Preference saved successfully'})


@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock(ticker):
    try:
        stock = yf.Ticker(ticker)
        data = stock.info

        # Extract additional information
        additional_info = {
            'previous_close': data.get('previousClose'),
            'open': data.get('open'),
            'market_cap': data.get('marketCap'),
            'volume': data.get('volume'),
            'avg_volume': data.get('averageVolume'),
            'days_range': data.get('dayLow') and data.get('dayHigh') and f"{data.get('dayLow')} - {data.get('dayHigh')}",
            '52_week_range': data.get('fiftyTwoWeekLow') and data.get('fiftyTwoWeekHigh') and f"{data.get('fiftyTwoWeekLow')} - {data.get('fiftyTwoWeekHigh')}",
            'pe_ratio': data.get('trailingPE'),
            'eps': data.get('trailingEps'),
            'beta': data.get('beta'),
            'earnings_date': data.get('earningsDate'),
            'forward_dividend_yield': data.get('dividendYield'),
            'ex_dividend_date': data.get('exDividendDate'),
            'target_est_1y': data.get('targetMeanPrice'),
        }

        return jsonify({'info': data, 'additional_info': additional_info}), 200
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

        random_id = random.randint(100000, 999999)

        # Deduct cost from balance.
        balance_pref = db.session.execute(
            db.select(Preference).filter_by(key='portfolio_balance')
        ).scalar_one_or_none()

        balance_pref.value = str(
            float(balance_pref.value) - current_price * quantity)
        db.session.commit()

        # Proceed with buying the stock at the determined price
        new_transaction = Transaction(
            id=random_id,
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

        random_id = random.randint(100000, 999999)

        # Add gains to balance.
        balance_pref = db.session.execute(
            db.select(Preference).filter_by(key='portfolio_balance')
        ).scalar_one_or_none()

        balance_pref.value = str(
            float(balance_pref.value) + current_price * quantity)
        db.session.commit()

        # Proceed with selling the stock at the determined price
        new_transaction = Transaction(
            id=random_id,
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

        # Build portfolio based on transactions
        for txn in transactions:
            ticker = txn.ticker.upper()
            if ticker not in portfolio:
                portfolio[ticker] = {
                    'quantity': 0,
                    'cost_basis': 0.0,
                    # Initialize with the first purchase date
                    'purchase_date': txn.timestamp.strftime('%Y-%m-%d')
                }
            position = portfolio[ticker]
            if txn.transaction_type == 'buy':
                total_cost = position['cost_basis'] * position['quantity']
                total_cost += txn.price * txn.quantity
                position['quantity'] += txn.quantity
                position['cost_basis'] = total_cost / position['quantity']
                # Update purchase date to the earliest buy transaction
                if position['purchase_date'] > txn.timestamp.strftime('%Y-%m-%d'):
                    position['purchase_date'] = txn.timestamp.strftime(
                        '%Y-%m-%d')
            elif txn.transaction_type == 'sell':
                total_cost = position['cost_basis'] * position['quantity']
                total_cost -= position['cost_basis'] * txn.quantity
                position['quantity'] -= txn.quantity
                position['cost_basis'] = total_cost / \
                    position['quantity'] if position['quantity'] > 0 else 0.0

        # Remove positions with zero quantity
        portfolio = {k: v for k, v in portfolio.items() if v['quantity'] > 0}

        # Get current prices for all tickers
        tickers = list(portfolio.keys())
        stocks = yf.Tickers(' '.join(tickers))

        prices = {}
        logos = {}
        for ticker in tickers:
            stock_info = stocks.tickers[ticker].info

            # Try to get regular, post-market, or previous close price
            current_price = stock_info.get('regularMarketPrice') or \
                stock_info.get('postMarketPrice') or \
                stock_info.get('previousClose')

            logos[ticker] = stock_info.get(
                'website', 'www.apple.com')

            prices[ticker] = current_price if current_price is not None else 0.0

        # Prepare portfolio details
        portfolio_details = []
        for ticker, position in portfolio.items():
            quantity = position['quantity']
            cost_basis = position['cost_basis']
            current_price = prices.get(ticker, 0.0)
            total_value = current_price * quantity
            total_cost = cost_basis * quantity
            unrealized_pl = total_value - total_cost
            company_logo = logos.get(ticker, 'www.apple.com')
            portfolio_details.append({
                'ticker': ticker,
                'quantity': quantity,
                'cost_basis': cost_basis,
                'current_price': current_price,
                'total_value': total_value,
                'unrealized_pl': unrealized_pl,
                'purchase_date': position['purchase_date'],
                'company_logo': company_logo
            })

        return jsonify(portfolio_details), 200
    except Exception as e:
        app.logger.error(f"Error in /api/portfolio_details: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/portfolio_history', methods=['GET'])
def get_portfolio_history():
    try:
        # Get current holdings
        # This should not need to be computed manually, holdings should be stored elsewhere
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
        period = '1y'  # 1 year just for now, but should be based on earliest holding
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

        # Downsample to a fixed number of points to increase performance
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
