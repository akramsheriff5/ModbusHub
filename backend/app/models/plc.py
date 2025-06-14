from datetime import datetime
from .. import db


class PLC(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(15), nullable=False)
    port = db.Column(db.Integer, default=502)
    unit_id = db.Column(db.Integer, default=1)
    is_connected = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    registers = db.relationship('Register', backref='plc', lazy=True, cascade='all, delete-orphan')

class Register(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Integer, nullable=False)
    data_type = db.Column(db.String(20), nullable=False)  # 'int16', 'int32', 'float', etc.
    scaling_factor = db.Column(db.Float, default=1.0)
    unit = db.Column(db.String(20))
    description = db.Column(db.String(200))
    is_monitored = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    plc_id = db.Column(db.Integer, db.ForeignKey('plc.id'), nullable=False) 