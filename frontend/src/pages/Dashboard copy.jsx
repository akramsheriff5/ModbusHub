import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Create Socket.IO instance with proper configuration
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
  const [timeRange, setTimeRange] = useState('1h');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [registerValues, setRegisterValues] = useState({});

  // Initialize WebSocket connection
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    socket.on('register_update', (data) => {
      if (data.plc_id === parseInt(selectedPLC)) {
        setRegisterValues(prev => ({
          ...prev,
          ...data.data
        }));
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('register_update');
    };
  }, [selectedPLC]);

  // Fetch PLCs
  const { data: plcs } = useQuery('plcs', async () => {
    const response = await axios.get('/api/plcs');
    return response.data;
  });

  // Fetch registers for selected PLC
  const { data: registers } = useQuery(
    ['registers', selectedPLC],
    async () => {
      if (!selectedPLC) return [];
      const response = await axios.get(`/api/plcs/${selectedPLC}/registers`);
      return response.data;
    },
    {
      enabled: !!selectedPLC,
    }
  );

  // Start/Stop monitoring mutations
  const startMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${selectedPLC}/start-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => {
        setIsMonitoring(true);
      },
    }
  );

  const stopMonitoringMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/plcs/${selectedPLC}/stop-monitoring`);
      return response.data;
    },
    {
      onSuccess: () => {
        setIsMonitoring(false);
      },
    }
  );

  // Handle PLC selection change
  const handlePLCChange = (e) => {
    const newPLC = e.target.value;
    setSelectedPLC(newPLC);
    setRegisterValues({});
    setIsMonitoring(false);
  };

  // Prepare chart data
  const chartData = {
    labels: Object.keys(registerValues).map(key => 
      new Date().toLocaleTimeString()
    ),
    datasets: registers?.filter(reg => reg.is_monitored).map(register => ({
      label: register.name,
      data: [registerValues[register.id]?.value || 0],
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      tension: 0.4,
    })) || [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-primary)',
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'var(--text-primary)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'var(--text-primary)',
        },
      },
    },
  };

  // Example icon SVGs for cards
  const cardIcons = [
    <svg className="w-7 h-7 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M8 16h8M8 8h8" /></svg>,
    <svg className="w-7 h-7 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
    <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9 12h6" /></svg>,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedPLC}
          onChange={handlePLCChange}
          className="form-select bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] rounded-lg"
        >
          <option value="">Select a PLC</option>
          {plcs?.map((plc) => (
            <option key={plc.id} value={plc.id}>
              {plc.name} {plc.is_connected ? '(Connected)' : '(Disconnected)'}
            </option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="form-select bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] rounded-lg"
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>

        {selectedPLC && (
          <button
            onClick={() => isMonitoring ? stopMonitoringMutation.mutate() : startMonitoringMutation.mutate()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? (
              <>
                <StopIcon className="h-5 w-5" />
                Stop Monitoring
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Start Monitoring
              </>
            )}
          </button>
        )}
      </div>

      {/* Summary Cards: Only show when monitoring is active */}
      {isMonitoring && registers?.filter(reg => reg.is_monitored).length > 0 && (
        <div className="flex gap-6 mb-4">
          {registers.filter(reg => reg.is_monitored).map((register, idx) => (
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
                <div className={`rounded-full p-3 bg-opacity-10 ${idx === 0 ? 'bg-pink-500' : idx === 1 ? 'bg-violet-500' : idx === 2 ? 'bg-cyan-500' : 'bg-orange-500'}`}>
                  {cardIcons[idx % cardIcons.length]}
                </div>
              </div>
              {/* Optional: Add change indicator here if you have historical data */}
            </div>
          ))}
        </div>
      )}

      {selectedPLC ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register Cards (detailed, below summary cards) */}
          <div className="space-y-4">
            {registers?.filter(reg => reg.is_monitored).map((register) => (
              <div
                key={register.id}
                className="card p-4 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {register.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {register.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {registerValues[register.id]?.value?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {register.unit || 'No unit'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <div className="card p-4 h-[500px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)]">
            Please select a PLC to view its registers
          </p>
        </div>
      )}
    </div>
  );
} 