import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { ComputerDesktopIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function RegisterSetup() {
  const { plcId } = useParams();
  const [isAddingRegister, setIsAddingRegister] = useState(false);
  const [search, setSearch] = useState('');
  const [newRegister, setNewRegister] = useState({
    name: '',
    address: 0,
    data_type: 'int16',
    scaling_factor: 1.0,
    unit: '',
    description: '',
  });
  const queryClient = useQueryClient();

  // Fetch PLC details
  const { data: plc, isLoading: isPlcLoading } = useQuery(['plc', plcId], async () => {
    const response = await axios.get(`/api/plcs/${plcId}`);
    return response.data;
  });

  const { data: registers, isLoading } = useQuery(['registers', plcId], async () => {
    const response = await axios.get(`/api/plcs/${plcId}/registers`);
    return response.data;
  });

  const addRegisterMutation = useMutation(
    async (register) => {
      const response = await axios.post(`/api/plcs/${plcId}/registers`, register);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
        setIsAddingRegister(false);
        setNewRegister({
          name: '',
          address: 0,
          data_type: 'int16',
          scaling_factor: 1.0,
          unit: '',
          description: '',
        });
      },
    }
  );

  const deleteRegisterMutation = useMutation(
    async (registerId) => {
      await axios.delete(`/api/plcs/${plcId}/registers/${registerId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
      },
    }
  );

  const updateRegisterMutation = useMutation(
    async ({ registerId, data }) => {
      const response = await axios.put(`/api/plcs/${plcId}/registers/${registerId}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
      },
    }
  );

  const startMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${plcId}/start-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
      },
    }
  );

  const stopMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${plcId}/stop-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    addRegisterMutation.mutate(newRegister);
  };

  // Modal close on outside click or Escape
  useEffect(() => {
    if (!isAddingRegister) return;
    const handleKey = (e) => { if (e.key === 'Escape') setIsAddingRegister(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isAddingRegister]);

  if (isLoading || isPlcLoading) {
    return <div>Loading...</div>;
  }

  const showEmptyState = !isAddingRegister && (!registers || registers.length === 0);

  // Filtered registers
  const filteredRegisters = registers?.filter((reg) =>
    reg.name.toLowerCase().includes(search.toLowerCase()) ||
    reg.address.toString().includes(search) ||
    (reg.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Show empty state if not adding and filteredRegisters is empty
  const showFilteredEmptyState = !isAddingRegister && (!filteredRegisters || filteredRegisters.length === 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Device Information Card */}
      {plc && (
        <div className="bg-white rounded-2xl shadow p-8 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Device Information</h2>
          <p className="text-gray-500 mb-6">Connection and status details</p>
          <div className="flex flex-wrap gap-8 mb-2">
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${plc.is_connected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                <span className={`h-2 w-2 rounded-full mr-2 ${plc.is_connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {plc.is_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">IP Address</div>
              <div className="text-gray-900 font-medium">{plc.ip_address}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Port</div>
              <div className="text-gray-900 font-medium">{plc.port}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Last Seen</div>
              <div className="text-gray-900 font-medium">{plc.last_seen ? new Date(plc.last_seen).toLocaleString() : '-'}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">Description</div>
            <div className="text-gray-900 font-medium">{plc.description || 'No description'}</div>
          </div>
        </div>
      )}

      {/* Register List Header, Search, and Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Registers</h2>
        <button
          onClick={() => setIsAddingRegister(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2 flex items-center gap-2 shadow transition"
        >
          <span className="text-xl">+</span> Add Register
        </button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search registers..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>

      {/* Add Register Modal */}
      {isAddingRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30"
            onClick={() => setIsAddingRegister(false)}
          />
          {/* Modal content */}
          <div
            className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative z-10"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New Register</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  value={newRegister.name}
                  onChange={(e) => setNewRegister({ ...newRegister, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="number"
                  id="address"
                  value={newRegister.address}
                  onChange={(e) => setNewRegister({ ...newRegister, address: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="data_type" className="block text-sm font-medium text-gray-700">Data Type</label>
                <select
                  id="data_type"
                  value={newRegister.data_type}
                  onChange={(e) => setNewRegister({ ...newRegister, data_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="int16">Int16</option>
                  <option value="int32">Int32</option>
                  <option value="float">Float</option>
                </select>
              </div>
              <div>
                <label htmlFor="scaling_factor" className="block text-sm font-medium text-gray-700">Scaling Factor</label>
                <input
                  type="number"
                  step="0.1"
                  id="scaling_factor"
                  value={newRegister.scaling_factor}
                  onChange={(e) => setNewRegister({ ...newRegister, scaling_factor: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  id="unit"
                  value={newRegister.unit}
                  onChange={(e) => setNewRegister({ ...newRegister, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  value={newRegister.description}
                  onChange={(e) => setNewRegister({ ...newRegister, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingRegister(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State or Register List */}
      {showFilteredEmptyState ? (
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-1 w-full">Registers</h2>
          <p className="text-gray-500 mb-6 w-full">Modbus register values and controls</p>
          <ComputerDesktopIcon className="h-16 w-16 text-gray-300 mb-4" />
          <div className="text-lg font-semibold text-gray-700 mb-1">No registers found</div>
          <div className="text-gray-500 mb-6">{search ? 'No registers match your search.' : 'Add registers to this device to start monitoring'}</div>
          <button
            onClick={() => setIsAddingRegister(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-3 text-lg mt-2 shadow transition"
          >
            <ComputerDesktopIcon className="h-5 w-5" /> Add Register
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegisters?.map((register) => (
            <div key={register.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div>
                <div className="font-semibold text-gray-900 text-lg">{register.name}</div>
                <div className="text-sm text-gray-500 mb-1">Address: {register.address} &bull; Data Type: {register.data_type} &bull; Scaling: {register.scaling_factor} &bull; Unit: {register.unit || '-'} </div>
                <div className="text-sm text-gray-500">{register.description}</div>
                <div className="text-xs text-gray-400 mt-1">Monitoring: {register.is_monitored ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <button
                  title={register.is_monitored ? 'Disable Monitoring' : 'Enable Monitoring'}
                  onClick={() => updateRegisterMutation.mutate({ registerId: register.id, data: { is_monitored: !register.is_monitored } })}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-2 border border-gray-200 shadow-sm hover:bg-gray-100 focus:outline-none transition text-sm font-medium ${register.is_monitored ? 'text-red-600' : 'text-green-600'}`}
                >
                  {register.is_monitored ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  {register.is_monitored ? 'Disable Monitoring' : 'Enable Monitoring'}
                </button>
                <button
                  title="Delete Register"
                  onClick={() => deleteRegisterMutation.mutate(register.id)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 border border-gray-200 shadow-sm hover:bg-red-50 text-red-600 focus:outline-none transition text-sm font-medium"
                >
                  <TrashIcon className="h-5 w-5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 