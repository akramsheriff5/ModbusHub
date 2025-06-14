import random
import time
import threading
from datetime import datetime

class MockPLC:
    def __init__(self, ip_address="127.0.0.1", port=502):
        self.ip_address = ip_address
        self.port = port
        self.registers = {}
        self.running = False
        self.thread = None
        self._initialize_registers()
        
    def _initialize_registers(self):
        # Initialize some sample registers with different data types
        self.registers = {
            # Temperature sensor (float)
            0: {"value": 25.0, "type": "float", "min": 0.0, "max": 100.0, "change_rate": 0.5},
            # Pressure sensor (float)
            2: {"value": 1013.25, "type": "float", "min": 900.0, "max": 1100.0, "change_rate": 2.0},
            # Flow rate (float)
            4: {"value": 50.0, "type": "float", "min": 0.0, "max": 200.0, "change_rate": 5.0},
            # Status register (int16)
            6: {"value": 1, "type": "int16", "min": 0, "max": 3, "change_rate": 0},
            # Counter (int32)
            7: {"value": 0, "type": "int32", "min": 0, "max": 1000000, "change_rate": 1},
            # Energy consumption (float)
            9: {"value": 0.0, "type": "float", "min": 0.0, "max": 1000.0, "change_rate": 0.1}
        }
    
    def _update_registers(self):
        while self.running:
            for addr, reg in self.registers.items():
                if reg["change_rate"] > 0:
                    # Add some randomness to the change
                    change = random.uniform(-reg["change_rate"], reg["change_rate"])
                    new_value = reg["value"] + change
                    
                    # Keep within bounds
                    new_value = max(reg["min"], min(reg["max"], new_value))
                    reg["value"] = new_value
                    
                    # For int32, update both registers
                    if reg["type"] == "int32":
                        self.registers[addr + 1]["value"] = int(new_value >> 16)
                        reg["value"] = int(new_value & 0xFFFF)
            
            time.sleep(1)  # Update every second
    
    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._update_registers)
            self.thread.daemon = True
            self.thread.start()
    
    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
    
    def read_register(self, address, count=1):
        if address not in self.registers:
            return None
            
        reg = self.registers[address]
        if reg["type"] == "int32" and count >= 2:
            # Combine two registers for int32
            high = self.registers[address + 1]["value"]
            low = reg["value"]
            return (high << 16) | low
        elif reg["type"] == "float" and count >= 2:
            return reg["value"]
        else:
            return reg["value"]
    
    def write_register(self, address, value):
        if address not in self.registers:
            return False
            
        reg = self.registers[address]
        if reg["type"] == "int32":
            # Split value into two registers
            self.registers[address + 1]["value"] = int(value >> 16)
            reg["value"] = int(value & 0xFFFF)
        else:
            reg["value"] = value
        return True 