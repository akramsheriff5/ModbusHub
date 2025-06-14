from datetime import datetime
from .. import db


class PLC(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    ip_address = db.Column(db.String(120), unique=True, nullable=False)
    port = db.Column(db.Integer, default=502)
    unit_id = db.Column(db.Integer, default=1)
    description = db.Column(db.String(255))
    last_seen = db.Column(db.DateTime, nullable=True)
    is_connected = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    registers = db.relationship('Register', backref='plc', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<PLC {self.name}>'

class Register(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    address = db.Column(db.Integer, nullable=False)
    data_type = db.Column(db.String(50), nullable=False)
    scaling_factor = db.Column(db.Float, default=1.0)
    unit = db.Column(db.String(20))
    description = db.Column(db.String(255))
    is_monitored = db.Column(db.Boolean, default=True)
    min_value = db.Column(db.Float, nullable=True)
    max_value = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    plc_id = db.Column(db.Integer, db.ForeignKey('plc.id'), nullable=False)

    def __repr__(self):
        return f'<Register {self.name} (PLC: {self.plc_id})>' 