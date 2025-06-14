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
    is_monitored: true,
    min_value: '',
    max_value: '',
  });
  const [editingRegisterId, setEditingRegisterId] = useState(null);
  const [currentEditData, setCurrentEditData] = useState(null);

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
          is_monitored: true,
          min_value: '',
          max_value: '',
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
        setEditingRegisterId(null);
        setCurrentEditData(null);
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

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    addRegisterMutation.mutate(newRegister);
  };

  const handleEditClick = (register) => {
    setEditingRegisterId(register.id);
    setCurrentEditData({
      name: register.name,
      address: register.address,
      data_type: register.data_type,
      scaling_factor: register.scaling_factor,
      unit: register.unit,
      description: register.description,
      is_monitored: register.is_monitored,
      min_value: register.min_value ?? '',
      max_value: register.max_value ?? '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    updateRegisterMutation.mutate({ registerId: editingRegisterId, data: currentEditData });
  };

  // Modal close on outside click or Escape
  useEffect(() => {
    if (!isAddingRegister && !editingRegisterId) return;
    const handleKey = (e) => { if (e.key === 'Escape') { setIsAddingRegister(false); setEditingRegisterId(null); } };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isAddingRegister, editingRegisterId]);

  if (isLoading || isPlcLoading) {
    return <div>Loading...</div>;
  }

  const showEmptyState = !isAddingRegister && !editingRegisterId && (!registers || registers.length === 0);

  // Filtered registers
  const filteredRegisters = registers?.filter((reg) =>
    reg.name.toLowerCase().includes(search.toLowerCase()) ||
    reg.address.toString().includes(search) ||
    (reg.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Show empty state if not adding and filteredRegisters is empty
  const showFilteredEmptyState = !isAddingRegister && !editingRegisterId && (!filteredRegisters || filteredRegisters.length === 0);

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

      {/* Register Management Section */}
      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Registers</h2>
          <button
            onClick={() => {
              setIsAddingRegister(true);
              setEditingRegisterId(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2 flex items-center gap-2 shadow transition"
          >
            <span className="text-xl">+</span> Add Register
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search registers..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2 mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />

        {(isAddingRegister || editingRegisterId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30"
              onClick={() => { setIsAddingRegister(false); setEditingRegisterId(null); setCurrentEditData(null); }}
            />
            {/* Modal content */}
            <div
              className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative z-10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-blue-800 mb-4">
                {isAddingRegister ? 'Add New Register' : `Edit Register: ${currentEditData?.name}`}
              </h3>
              <form onSubmit={isAddingRegister ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={isAddingRegister ? newRegister.name : currentEditData?.name || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, name: e.target.value }) : handleEditChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="number"
                    id="address"
                    name="address"
                    value={isAddingRegister ? newRegister.address : currentEditData?.address || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, address: parseInt(e.target.value) }) : handleEditChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="dataType" className="block text-sm font-medium text-gray-700">Data Type</label>
                  <select
                    id="dataType"
                    name="data_type"
                    value={isAddingRegister ? newRegister.data_type : currentEditData?.data_type || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, data_type: e.target.value }) : handleEditChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="int16">Int16</option>
                    <option value="int32">Int32</option>
                    <option value="float">Float</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="scalingFactor" className="block text-sm font-medium text-gray-700">Scaling Factor</label>
                  <input
                    type="number"
                    id="scalingFactor"
                    name="scaling_factor"
                    value={isAddingRegister ? newRegister.scaling_factor : currentEditData?.scaling_factor || 1.0}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, scaling_factor: parseFloat(e.target.value) }) : handleEditChange}
                    step="any"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={isAddingRegister ? newRegister.unit : currentEditData?.unit || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, unit: e.target.value }) : handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="minValue" className="block text-sm font-medium text-gray-700">Minimum Value</label>
                  <input
                    type="number"
                    id="minValue"
                    name="min_value"
                    value={isAddingRegister ? newRegister.min_value : currentEditData?.min_value || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, min_value: parseFloat(e.target.value) }) : handleEditChange}
                    step="any"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="maxValue" className="block text-sm font-medium text-gray-700">Maximum Value</label>
                  <input
                    type="number"
                    id="maxValue"
                    name="max_value"
                    value={isAddingRegister ? newRegister.max_value : currentEditData?.max_value || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, max_value: parseFloat(e.target.value) }) : handleEditChange}
                    step="any"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={isAddingRegister ? newRegister.description : currentEditData?.description || ''}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, description: e.target.value }) : handleEditChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div className="flex items-center mt-4">
                  <input
                    id="isMonitored"
                    name="is_monitored"
                    type="checkbox"
                    checked={isAddingRegister ? newRegister.is_monitored : currentEditData?.is_monitored || false}
                    onChange={isAddingRegister ? (e) => setNewRegister({ ...newRegister, is_monitored: e.target.checked }) : handleEditChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isMonitored" className="ml-2 block text-sm text-gray-900">
                    Monitor this register
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsAddingRegister(false); setEditingRegisterId(null); setCurrentEditData(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={addRegisterMutation.isLoading || updateRegisterMutation.isLoading}
                  >
                    {isAddingRegister ? (addRegisterMutation.isLoading ? 'Adding...' : 'Add Register') : (updateRegisterMutation.isLoading ? 'Updating...' : 'Update Register')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmptyState ? (
          <div className="text-center py-12 text-gray-500">
            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No registers defined</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first register.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setIsAddingRegister(true);
                  setEditingRegisterId(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="text-xl mr-2">+</span> Add Register
              </button>
            </div>
          </div>
        ) : showFilteredEmptyState ? (
          <div className="text-center py-12 text-gray-500">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No matching registers found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegisters?.map((register) => (
              <div key={register.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{register.name}</div>
                  <div className="text-sm text-gray-500 mb-1">
                    Address: {register.address} &bull; Data Type: {register.data_type} &bull; Scaling: {register.scaling_factor} &bull; Unit: {register.unit || '-'}
                    {register.min_value !== null && register.min_value !== undefined && register.min_value !== '' && ` • Min: ${register.min_value}`}
                    {register.max_value !== null && register.max_value !== undefined && register.max_value !== '' && ` • Max: ${register.max_value}`}
                  </div>
                  <div className="text-sm text-gray-500">{register.description}</div>
                  <div className="text-xs text-gray-400 mt-1">Monitoring: {register.is_monitored ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <button
                    title="Edit Register"
                    onClick={() => handleEditClick(register)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 border border-gray-200 shadow-sm hover:bg-gray-100 focus:outline-none transition text-sm font-medium text-gray-700"
                  >
                    Edit
                  </button>
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
    </div>
  );
} 