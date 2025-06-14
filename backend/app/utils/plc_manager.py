from .mock_plc import MockPLC
from pymodbus.client import ModbusTcpClient
import threading
import time

class PLCManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PLCManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.plcs = {}  # Dictionary to store PLC instances
        self.mock_mode = True  # Set to False when using real PLCs
        self._initialized = True
    
    def add_plc(self, plc_id, ip_address, port=502, use_mock=True):
        """Add a new PLC to the manager"""
        if plc_id in self.plcs:
            return False
            
        if use_mock or self.mock_mode:
            plc = MockPLC(ip_address, port)
        else:
            plc = ModbusTcpClient(ip_address, port=port)
            
        self.plcs[plc_id] = {
            'instance': plc,
            'ip_address': ip_address,
            'port': port,
            'is_mock': use_mock or self.mock_mode
        }
        
        if use_mock or self.mock_mode:
            plc.start()
            
        return True
    
    def remove_plc(self, plc_id):
        """Remove a PLC from the manager"""
        if plc_id not in self.plcs:
            return False
            
        plc = self.plcs[plc_id]
        if plc['is_mock']:
            plc['instance'].stop()
        else:
            plc['instance'].close()
            
        del self.plcs[plc_id]
        return True
    
    def read_register(self, plc_id, address, count=1):
        """Read a register from a PLC"""
        if plc_id not in self.plcs:
            return None
            
        plc = self.plcs[plc_id]
        if plc['is_mock']:
            return plc['instance'].read_register(address, count)
        else:
            try:
                if not plc['instance'].connected:
                    plc['instance'].connect()
                result = plc['instance'].read_holding_registers(address, count)
                if result.isError():
                    return None
                return result.registers[0] if count == 1 else result.registers
            except Exception as e:
                print(f"Error reading register: {str(e)}")
                return None
    
    def write_register(self, plc_id, address, value):
        """Write a value to a PLC register"""
        if plc_id not in self.plcs:
            return False
            
        plc = self.plcs[plc_id]
        if plc['is_mock']:
            return plc['instance'].write_register(address, value)
        else:
            try:
                if not plc['instance'].connected:
                    plc['instance'].connect()
                result = plc['instance'].write_register(address, value)
                return not result.isError()
            except Exception as e:
                print(f"Error writing register: {str(e)}")
                return False
    
    def get_plc_status(self, plc_id):
        """Get the status of a PLC"""
        if plc_id not in self.plcs:
            return None
            
        plc = self.plcs[plc_id]
        if plc['is_mock']:
            return {
                'connected': True,
                'is_mock': True,
                'ip_address': plc['ip_address'],
                'port': plc['port']
            }
        else:
            try:
                connected = plc['instance'].connected
                if not connected:
                    plc['instance'].connect()
                    connected = plc['instance'].connected
                return {
                    'connected': connected,
                    'is_mock': False,
                    'ip_address': plc['ip_address'],
                    'port': plc['port']
                }
            except Exception as e:
                print(f"Error getting PLC status: {str(e)}")
                return {
                    'connected': False,
                    'is_mock': False,
                    'ip_address': plc['ip_address'],
                    'port': plc['port']
                }
    
    def set_mock_mode(self, enabled):
        """Enable or disable mock mode"""
        self.mock_mode = enabled 