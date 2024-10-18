# models.py

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(
        db.String(10), nullable=False)  # 'buy' or 'sell'
    price = db.Column(db.Float, nullable=False)  # Add this field
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Change this
