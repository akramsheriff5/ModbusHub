from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..models.plc import PLC
from app import db
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ConnectionException
from datetime import datetime

plc_bp = Blueprint('plc', __name__)

@plc_bp.route('/plcs', methods=['GET'])
@login_required
def get_plcs():
    plcs = PLC.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected,
        'module_type': plc.module_type
    } for plc in plcs])

@plc_bp.route('/plcs/<int:plc_id>', methods=['GET'])
@login_required
def get_plc_id(plc_id):
    plc = PLC.query.filter_by(id=plc_id, user_id=current_user.id).first_or_404()
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected,
        'description': getattr(plc, 'description', ''),
        'last_seen': getattr(plc, 'last_seen', None),
        'module_type': plc.module_type
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
        user_id=current_user.id,
        module_type=data.get('module_type')
    )
    
    db.session.add(plc)
    db.session.commit()
    
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected,
        'module_type': plc.module_type
    }), 201

@plc_bp.route('/plcs/<int:plc_id>', methods=['PUT'])
@login_required
def update_plc(plc_id):
    plc = PLC.query.filter_by(id=plc_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    plc.name = data.get('name', plc.name)
    plc.ip_address = data.get('ip_address', plc.ip_address)
    plc.port = data.get('port', plc.port)
    plc.unit_id = data.get('unit_id', plc.unit_id)
    plc.description = data.get('description', plc.description)
    plc.module_type = data.get('module_type', plc.module_type)
    
    db.session.commit()
    
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'unit_id': plc.unit_id,
        'is_connected': plc.is_connected,
        'description': plc.description,
        'module_type': plc.module_type
    })

@plc_bp.route('/plcs/<int:plc_id>', methods=['DELETE'])
@login_required
def delete_plc(plc_id):
    plc = PLC.query.filter_by(id=plc_id, user_id=current_user.id).first_or_404()
    
    db.session.delete(plc)
    db.session.commit()
    
    return '', 204

@plc_bp.route('/plcs/<int:plc_id>/test-connection', methods=['GET'])
@login_required
def test_plc_connection(plc_id):
    plc = PLC.query.filter_by(id=plc_id, user_id=current_user.id).first_or_404()
    
    try:
        client = ModbusTcpClient(plc.ip_address, port=plc.port)
        connection = client.connect()
        if connection:
            plc.is_connected = True
            plc.last_seen = datetime.utcnow()
            db.session.commit()
            client.close()
            return jsonify({'message': 'Connection successful', 'status': True})
        else:
            plc.is_connected = False
            db.session.commit()
            return jsonify({'message': 'Connection failed', 'status': False}), 500
    except ConnectionException as e:
        plc.is_connected = False
        db.session.commit()
        return jsonify({'message': f'Connection error: {str(e)}', 'status': False}), 500
    except Exception as e:
        plc.is_connected = False
        db.session.commit()
        return jsonify({'message': f'An unexpected error occurred: {str(e)}', 'status': False}), 500 