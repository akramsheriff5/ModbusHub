from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..models.plc import PLC
from .. import db
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ConnectionException

plc_bp = Blueprint('plc', __name__)

@plc_bp.route('/plcs', methods=['GET'])
@login_required
def get_plcs():
    plcs = PLC.query.all()
    return jsonify([{
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected
    } for plc in plcs])

@plc_bp.route('/plcs/<int:plc_id>', methods=['GET'])
@login_required
def get_plc_id(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected,
        'description': getattr(plc, 'description', ''),
        'last_seen': getattr(plc, 'last_seen', None)
    })

@plc_bp.route('/plcs', methods=['POST'])
@login_required
def create_plc():
    data = request.get_json()
    
    plc = PLC(
        name=data['name'],
        ip_address=data['ip_address'],
        port=data.get('port', 502),
        unit_id=data.get('unit_id', 1),
        user_id=current_user.id
    )
    
    db.session.add(plc)
    db.session.commit()
    
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected
    }), 201

@plc_bp.route('/plcs/<int:plc_id>', methods=['PUT'])
@login_required
def update_plc(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    data = request.get_json()
    
    plc.name = data.get('name', plc.name)
    plc.ip_address = data.get('ip_address', plc.ip_address)
    plc.port = data.get('port', plc.port)
    plc.unit_id = data.get('unit_id', plc.unit_id)
    
    db.session.commit()
    
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected
    })

@plc_bp.route('/plcs/<int:plc_id>', methods=['DELETE'])
@login_required
def delete_plc(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    db.session.delete(plc)
    db.session.commit()
    return '', 204

@plc_bp.route('/plcs/<int:plc_id>/test-connection', methods=['POST'])
@login_required
def test_connection(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    
    try:
        client = ModbusTcpClient(plc.ip_address, port=plc.port)
        if client.connect():
            plc.is_connected = True
            db.session.commit()
            client.close()
            return jsonify({'message': 'Connection successful'})
        else:
            plc.is_connected = False
            db.session.commit()
            return jsonify({'error': 'Connection failed'}), 400
    except ConnectionException:
        plc.is_connected = False
        db.session.commit()
        return jsonify({'error': 'Connection failed'}), 400 