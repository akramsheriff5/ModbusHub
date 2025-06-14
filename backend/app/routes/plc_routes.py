from flask import Blueprint, request, jsonify
from flask_socketio import emit
from ..utils.plc_manager import PLCManager
from ..models.plc import PLC, Register
from .. import db, socketio
import threading
import time

mock_plc_bp = Blueprint('mock_plc', __name__)
plc_manager = PLCManager()

# Store active monitoring threads
monitoring_threads = {}

def monitor_registers(plc_id):
    """Background thread to monitor registers and emit updates"""
    while plc_id in monitoring_threads:
        try:
            plc = PLC.query.get(plc_id)
            if not plc:
                break
                
            registers = Register.query.filter_by(plc_id=plc_id, is_monitored=True).all()
            data = {}
            
            for register in registers:
                value = plc_manager.read_register(plc_id, register.address, 
                                                count=2 if register.data_type in ['int32', 'float'] else 1)
                if value is not None:
                    data[register.id] = {
                        'name': register.name,
                        'value': value * register.scaling_factor,
                        'unit': register.unit
                    }
            
            socketio.emit('register_update', {
                'plc_id': plc_id,
                'data': data,
                'og':3
            })
            
            time.sleep(1)  # Update every second
            
        except Exception as e:
            print(f"Error monitoring PLC {plc_id}: {str(e)}")
            time.sleep(5)  # Wait before retrying

@mock_plc_bp.route('/mock/plcs', methods=['GET'])
def get_mock_plcs():
    """Get all mock PLCs"""
    plcs = PLC.query.all()
    return jsonify([{
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'status': plc_manager.get_plc_status(plc.id)
    } for plc in plcs])

@mock_plc_bp.route('/mock/plcs', methods=['POST'])
def add_mock_plc():
    """Add a new mock PLC"""
    data = request.get_json()
    
    plc = PLC(
        name=data['name'],
        ip_address=data['ip_address'],
        port=data.get('port', 502)
    )
    
    db.session.add(plc)
    db.session.commit()
    
    # Add to PLC manager
    plc_manager.add_plc(plc.id, plc.ip_address, plc.port)
    
    return jsonify({
        'id': plc.id,
        'name': plc.name,
        'ip_address': plc.ip_address,
        'port': plc.port,
        'status': plc_manager.get_plc_status(plc.id)
    }), 201

@mock_plc_bp.route('/mock/plcs/<int:plc_id>', methods=['DELETE'])
def remove_mock_plc(plc_id):
    """Remove a mock PLC"""
    plc = PLC.query.get_or_404(plc_id)
    
    # Stop monitoring
    if plc_id in monitoring_threads:
        monitoring_threads[plc_id] = False
        del monitoring_threads[plc_id]
    
    # Remove from PLC manager
    plc_manager.remove_plc(plc_id)
    
    # Remove from database
    db.session.delete(plc)
    db.session.commit()
    
    return '', 204

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers', methods=['GET'])
def get_mock_registers(plc_id):
    """Get all registers for a mock PLC"""
    registers = Register.query.filter_by(plc_id=plc_id).all()
    return jsonify([{
        'id': reg.id,
        'name': reg.name,
        'address': reg.address,
        'data_type': reg.data_type,
        'scaling_factor': reg.scaling_factor,
        'unit': reg.unit,
        'description': reg.description,
        'is_monitored': reg.is_monitored
    } for reg in registers])

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers', methods=['POST'])
def add_mock_register(plc_id):
    """Add a new register to a mock PLC"""
    data = request.get_json()
    
    register = Register(
        name=data['name'],
        address=data['address'],
        data_type=data['data_type'],
        scaling_factor=data.get('scaling_factor', 1.0),
        unit=data.get('unit'),
        description=data.get('description'),
        is_monitored=data.get('is_monitored', True),
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
        'is_monitored': register.is_monitored
    }), 201

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers/<int:register_id>', methods=['PUT'])
def update_mock_register(plc_id, register_id):
    """Update a mock register"""
    register = Register.query.filter_by(plc_id=plc_id, id=register_id).first_or_404()
    data = request.get_json()
    
    register.name = data.get('name', register.name)
    register.address = data.get('address', register.address)
    register.data_type = data.get('data_type', register.data_type)
    register.scaling_factor = data.get('scaling_factor', register.scaling_factor)
    register.unit = data.get('unit', register.unit)
    register.description = data.get('description', register.description)
    register.is_monitored = data.get('is_monitored', register.is_monitored)
    
    db.session.commit()
    
    return jsonify({
        'id': register.id,
        'name': register.name,
        'address': register.address,
        'data_type': register.data_type,
        'scaling_factor': register.scaling_factor,
        'unit': register.unit,
        'description': register.description,
        'is_monitored': register.is_monitored
    })

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers/<int:register_id>', methods=['DELETE'])
def remove_mock_register(plc_id, register_id):
    """Remove a mock register"""
    register = Register.query.filter_by(plc_id=plc_id, id=register_id).first_or_404()
    
    db.session.delete(register)
    db.session.commit()
    
    return '', 204

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers/<int:register_id>/value', methods=['GET'])
def get_mock_register_value(plc_id, register_id):
    """Get the current value of a mock register"""
    register = Register.query.filter_by(plc_id=plc_id, id=register_id).first_or_404()
    
    value = plc_manager.read_register(plc_id, register.address,
                                    count=2 if register.data_type in ['int32', 'float'] else 1)
    
    if value is None:
        return jsonify({'error': 'Failed to read register value'}), 500
        
    return jsonify({
        'value': value * register.scaling_factor,
        'unit': register.unit
    })

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/registers/<int:register_id>/value', methods=['PUT'])
def set_mock_register_value(plc_id, register_id):
    """Set the value of a mock register"""
    register = Register.query.filter_by(plc_id=plc_id, id=register_id).first_or_404()
    data = request.get_json()
    
    value = data['value'] / register.scaling_factor
    
    success = plc_manager.write_register(plc_id, register.address, value)
    
    if not success:
        return jsonify({'error': 'Failed to write register value'}), 500
        
    return jsonify({
        'value': value * register.scaling_factor,
        'unit': register.unit
    })

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/monitor', methods=['POST'])
def start_mock_monitoring(plc_id):
    """Start monitoring registers for a mock PLC"""
    if plc_id in monitoring_threads:
        return jsonify({'error': 'Monitoring already started'}), 400
        
    monitoring_threads[plc_id] = True
    thread = threading.Thread(target=monitor_registers, args=(plc_id,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'message': 'Monitoring started'})

@mock_plc_bp.route('/mock/plcs/<int:plc_id>/monitor', methods=['DELETE'])
def stop_mock_monitoring(plc_id):
    """Stop monitoring registers for a mock PLC"""
    if plc_id not in monitoring_threads:
        return jsonify({'error': 'Monitoring not started'}), 400
        
    monitoring_threads[plc_id] = False
    del monitoring_threads[plc_id]
    
    return jsonify({'message': 'Monitoring stopped'}) 