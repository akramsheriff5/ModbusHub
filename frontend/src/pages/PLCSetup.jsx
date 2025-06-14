import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { CpuChipIcon } from '@heroicons/react/24/outline';

export default function PLCSetup() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: plcs, isLoading } = useQuery('plcs', async () => {
    const response = await axios.get('/api/plcs');
    return response.data;
  });

  const filteredPlcs = plcs?.filter(
    (plc) =>
      plc.name.toLowerCase().includes(search.toLowerCase()) ||
      plc.ip_address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <button
          onClick={() => navigate('/add-plc')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-5 py-2 flex items-center gap-2 shadow transition"
        >
          <span className="text-xl">+</span> Add Device
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Device Management</h2>
        <p className="text-gray-500 mb-4">Manage your Modbus compatible devices</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search devices..."
          className="w-full rounded-lg border border-gray-200 px-4 py-2 mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        <div className="space-y-4">
          {isLoading ? (
            <div>Loading...</div>
          ) : filteredPlcs && filteredPlcs.length > 0 ? (
            filteredPlcs.map((plc) => (
              <div key={plc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <CpuChipIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {plc.name}
                      <span className={`ml-2 h-2 w-2 rounded-full ${plc.is_connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-xs font-normal text-gray-500">{plc.is_connected ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="text-sm text-gray-500">{plc.ip_address}:{plc.port} &bull; {plc.description || 'No description'}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/plc/${plc.id}/registers`)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">No devices found.</div>
          )}
        </div>
      </div>
    </div>
  );
} 