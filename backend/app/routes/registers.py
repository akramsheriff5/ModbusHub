from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from flask_socketio import emit
from ..models.plc import PLC, Register
from .. import db, socketio
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ConnectionException
import threading
import time
import struct

registers_bp = Blueprint('registers', __name__)

# Store active PLC connections
active_connections = {}

def read_register(client, register):
    try:
        if register.data_type == 'int16':
            result = client.read_holding_registers(register.address, 1)
            value = result.registers[0] * register.scaling_factor
        elif register.data_type == 'int32':
            result = client.read_holding_registers(register.address, 2)
            value = (result.registers[0] << 16 | result.registers[1]) * register.scaling_factor
        elif register.data_type == 'float':
            result = client.read_holding_registers(register.address, 2)
            value = struct.unpack('>f', struct.pack('>HH', result.registers[0], result.registers[1]))[0] * register.scaling_factor
        return value
    except Exception as e:
        print(f"Error reading register {register.name}: {str(e)}")
        return None

def monitor_plc(app, plc_id):
    with app.app_context():
        plc = PLC.query.get(plc_id)
        if not plc:
            return
        
        client = ModbusTcpClient(plc.ip_address, port=plc.port)
        
        while plc_id in active_connections:
            try:
                if not client.connected:
                    client.connect()
                
                registers = Register.query.filter_by(plc_id=plc_id, is_monitored=True).all()
                data = {}
                
                for register in registers:
                    value = read_register(client, register)
                    if value is not None:
                        data[register.id] = {
                            'name': register.name,
                            'value': value,
                            'unit': register.unit,
                            'min_value':register.min_value,
                            'max_value':register.max_value
                        }
                
                socketio.emit('register_update', {
                    'plc_id': plc_id,
                    'data': data,
                    'og':1
                })
                
                time.sleep(1)  # Update every second
                
            except Exception as e:
                print(f"Error monitoring PLC {plc_id}: {str(e)}")
                time.sleep(5)  # Wait before retrying
        
        client.close()

@registers_bp.route('/plcs/<int:plc_id>/registers', methods=['GET'])
@login_required
def get_registers(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    registers = Register.query.filter_by(plc_id=plc_id).all()
    return jsonify([{
        'id': reg.id,
        'name': reg.name,
        'address': reg.address,
        'data_type': reg.data_type,
        'scaling_factor': reg.scaling_factor,
        'unit': reg.unit,
        'description': reg.description,
        'is_monitored': reg.is_monitored,
        'min_value': reg.min_value,
        'max_value': reg.max_value
    } for reg in registers])

@registers_bp.route('/plcs/<int:plc_id>/registers', methods=['POST'])
@login_required
def create_register(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    data = request.get_json()
    
    register = Register(
        name=data['name'],
        address=data['address'],
        data_type=data['data_type'],
        scaling_factor=data.get('scaling_factor', 1.0),
        unit=data.get('unit'),
        description=data.get('description'),
        is_monitored=data.get('is_monitored', True),
        min_value=data.get('min_value'),
        max_value=data.get('max_value'),
        plc_id=plc_id
    )
    
    db.session.add(register)
    db.session.commit()
    
    return jsonify({
        'id': register.id,
        'name': register.name,
        'address': register.address,
        'data_type': register.data_type,
        'scaling_factor': register.scaling_factor,
        'unit': register.unit,
        'description': register.description,
        'is_monitored': register.is_monitored,
        'min_value': register.min_value,
        'max_value': register.max_value
    }), 201

@registers_bp.route('/plcs/<int:plc_id>/registers/<int:register_id>', methods=['PUT'])
@login_required
def update_register(plc_id, register_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    register = Register.query.filter_by(id=register_id, plc_id=plc_id).first_or_404()
    data = request.get_json()
    
    register.name = data.get('name', register.name)
    register.address = data.get('address', register.address)
    register.data_type = data.get('data_type', register.data_type)
    register.scaling_factor = data.get('scaling_factor', register.scaling_factor)
    register.unit = data.get('unit', register.unit)
    register.description = data.get('description', register.description)
    register.is_monitored = data.get('is_monitored', register.is_monitored)
    register.min_value = data.get('min_value', register.min_value)
    register.max_value = data.get('max_value', register.max_value)
    
    db.session.commit()
    
    return jsonify({
        'id': register.id,
        'name': register.name,
        'address': register.address,
        'data_type': register.data_type,
        'scaling_factor': register.scaling_factor,
        'unit': register.unit,
        'description': register.description,
        'is_monitored': register.is_monitored,
        'min_value': register.min_value,
        'max_value': register.max_value
    })

@registers_bp.route('/plcs/<int:plc_id>/registers/<int:register_id>', methods=['DELETE'])
@login_required
def delete_register(plc_id, register_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    register = Register.query.filter_by(id=register_id, plc_id=plc_id).first_or_404()
    db.session.delete(register)
    db.session.commit()
    return '', 204

@registers_bp.route('/plcs/<int:plc_id>/start-monitoring', methods=['POST'])
@login_required
def start_monitoring(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    
    if plc_id not in active_connections:
        active_connections[plc_id] = True
        thread = threading.Thread(
            target=monitor_plc,
            args=(current_app._get_current_object(), plc_id)
        )
        thread.daemon = True
        thread.start()
        return jsonify({'message': 'Monitoring started'})
    
    return jsonify({'message': 'Monitoring already active'})

@registers_bp.route('/plcs/<int:plc_id>/stop-monitoring', methods=['POST'])
@login_required
def stop_monitoring(plc_id):
    plc = PLC.query.filter_by(id=plc_id).first_or_404()
    
    if plc_id in active_connections:
        active_connections.pop(plc_id)
        return jsonify({'message': 'Monitoring stopped'})
    
    return jsonify({'message': 'Monitoring not active'}) 