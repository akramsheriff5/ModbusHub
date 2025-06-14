import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { io } from 'socket.io-client';

// --- Socket.IO instance (adjust URL if needed) ---
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  path: '/socket.io',
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function Dashboard() {
  const [selectedPLC, setSelectedPLC] = useState('');
  const [registerValues, setRegisterValues] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  // --- Fetch PLCs ---
  const { data: plcs, isLoading: isPlcsLoading } = useQuery('plcs', async () => {
    const response = await axios.get('/api/plcs');
    return response.data;
  });

  // --- Fetch Registers for selected PLC ---
  const { data: registers, refetch: refetchRegisters } = useQuery(
    ['registers', selectedPLC],
    async () => {
      if (!selectedPLC) return [];
      const response = await axios.get(`/api/plcs/${selectedPLC}/registers`);
      return response.data;
    },
    { enabled: !!selectedPLC }
  );

  // --- Start/Stop Monitoring Mutations ---
  const startMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${selectedPLC}/start-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => setIsMonitoring(true),
    }
  );
  const stopMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${selectedPLC}/stop-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => setIsMonitoring(false),
    }
  );

  // --- Handle PLC Change ---
  useEffect(() => {
    if (selectedPLC) {
      setRegisterValues({});
      setIsMonitoring(false);
      startMonitoringMutation.mutate();
      refetchRegisters();
    }
    // Stop monitoring previous PLC when PLC changes
    return () => {
      if (isMonitoring && selectedPLC) stopMonitoringMutation.mutate();
    };
    // eslint-disable-next-line
  }, [selectedPLC]);

  // --- WebSocket: Listen for register updates ---
  useEffect(() => {
    function handleRegisterUpdate(data) {
      if (data.plc_id === parseInt(selectedPLC)) {
        setRegisterValues(prev => ({ ...prev, ...data.data }));
      }
    }
    socket.on('register_update', handleRegisterUpdate);
    return () => {
      socket.off('register_update', handleRegisterUpdate);
    };
  }, [selectedPLC]);

  // --- UI ---
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* PLC Filter */}
      <div className="mb-6">
        <label className="block mb-2 text-lg font-semibold">Select PLC:</label>
        <select
          className="form-select border rounded-lg px-4 py-2"
          value={selectedPLC}
          onChange={e => setSelectedPLC(e.target.value)}
        >
          <option value="">-- Select a PLC --</option>
          {plcs?.map(plc => (
            <option key={plc.id} value={plc.id}>
              {plc.name} ({plc.ip_address}:{plc.port})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {selectedPLC && registers && (
        <div className="flex flex-wrap gap-6">
          {registers.map((register, idx) => (
            <div
              key={register.id}
              className="bg-white rounded-2xl shadow p-6 min-w-[220px] flex-1 flex flex-col justify-between border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">{register.name}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {registerValues[register.id]?.value?.toFixed(2) ?? '--'}
                    <span className="text-base font-normal ml-1">{register.unit}</span>
                  </div>
                </div>
                {/* Example icon */}
                <div className={`rounded-full p-3 bg-opacity-10 ${idx === 0 ? 'bg-pink-500' : idx === 1 ? 'bg-violet-500' : idx === 2 ? 'bg-cyan-500' : 'bg-orange-500'}`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8M8 16h8M8 8h8" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading/Empty States */}
      {isPlcsLoading && <div>Loading PLCs...</div>}
      {selectedPLC && registers?.length === 0 && <div className="mt-8 text-gray-500">No registers found for this PLC.</div>}
    </div>
  );
}
