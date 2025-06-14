import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import GaugeComponent from 'react-gauge-component';
import { Line } from 'react-chartjs-2';

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [chartDataHistory, setChartDataHistory] = useState({}); // Stores historical values for chart

  // --- Fetch PLCs ---
  const { data: plcs, isLoading: isPlcsLoading } = useQuery('plcs', async () => {
    const response = await axios.get('/api/plcs');
    return response.data;
  });

  // --- Fetch Registers for selected PLC ---
  const { data: registers, isLoading: isRegistersLoading, refetch: refetchRegisters } = useQuery(
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

  // --- Handle PLC Change --- (Starts monitoring automatically)
  useEffect(() => {
    // Cleanup previous monitoring if PLC changes
    if (isMonitoring && selectedPLC) {
      stopMonitoringMutation.mutate();
    }

    if (selectedPLC) {
      setRegisterValues({});
      setChartDataHistory({}); // Clear historical data for new PLC
      setIsMonitoring(false); // Reset monitoring state
      startMonitoringMutation.mutate(); // Start monitoring new PLC automatically
      refetchRegisters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPLC]);

  // --- WebSocket: Listen for register updates ---
  useEffect(() => {
    function handleRegisterUpdate(data) {
      if (data.plc_id === parseInt(selectedPLC)) {
        setRegisterValues(prev => ({
          ...prev,
          ...data.data
        }));

        // Update chart historical data
        setChartDataHistory(prevHistory => {
          const newHistory = { ...prevHistory };
          const currentTime = new Date().toLocaleTimeString();

          for (const regId in data.data) {
            if (!newHistory[regId]) {
              newHistory[regId] = { labels: [], values: [] };
            }
            newHistory[regId].labels.push(currentTime);
            newHistory[regId].values.push(data.data[regId].value);
            // Keep history limited (e.g., last 20 points)
            if (newHistory[regId].labels.length > 20) {
              newHistory[regId].labels.shift();
              newHistory[regId].values.shift();
            }
          }
          return newHistory;
        });
      }
    }
    socket.on('register_update', handleRegisterUpdate);
    return () => {
      socket.off('register_update', handleRegisterUpdate);
    };
  }, [selectedPLC]);

  // --- Chart Data Preparation ---
  // const getChartDatasets = () => {
  //   if (!registers) return [];
  //   return registers.filter(reg => reg.is_monitored).map(register =>{ 
  //     console.log( chartDataHistory[register.id]?.values ,";;;;;;;;;;;;;;;;",register.id)

  //     return ({
  //     label: register.name,
  //     data: chartDataHistory[register.id]?.values || [],
  //     borderColor: '#3B82F6', // Make sure color is visible
  //     backgroundColor: 'rgba(59, 130, 246, 0.1)',
  //     // borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
  //     // backgroundColor: 'rgba(255, 255, 255, 0.1)',
  //     tension: 0.4,
  //     fill: false,
  //   })});
  // };

  const getChartDatasets = () => {
    if (!registers || !chartDataHistory) return [];
    
    // Get the register with the most data points to use as reference
    let maxDataPoints = 0;
    let referenceLabels = [];
    
    for (const regId in chartDataHistory) {
      if (chartDataHistory[regId]?.labels && chartDataHistory[regId].labels.length > maxDataPoints) {
        maxDataPoints = chartDataHistory[regId].labels.length;
        referenceLabels = chartDataHistory[regId].labels;
      }
    }
    
    return registers
      .filter(reg => reg.is_monitored)
      .map((register, index) => {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
        const registerData = chartDataHistory[register.id]?.values || [];
        
        // Pad data array to match reference length if needed
        const paddedData = [...registerData];
        while (paddedData.length < referenceLabels.length) {
          paddedData.unshift(null);
        }
        
        return {
          label: register.name,
          data: paddedData,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '40',
          tension: 0.4,
          fill: false,
          spanGaps: true, // Important: this connects points across null values
        };
      });
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
        min: 0,
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

  // --- UI ---
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* PLC Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="plc-select" className="block text-lg font-semibold whitespace-nowrap">Select PLC:</label>
        <select
          id="plc-select"
          className="form-select border rounded-lg px-4 py-2 w-full"
          value={selectedPLC}
          onChange={e => setSelectedPLC(e.target.value)}
          disabled={isPlcsLoading}
        >
          <option value="">-- Select a PLC --</option>
          {isPlcsLoading ? (
            <option>Loading PLCs...</option>
          ) : (
            plcs?.map(plc => (
              <option key={plc.id} value={plc.id}>
                {plc.name} ({plc.ip_address}:{plc.port}) {plc.is_connected ? '(Connected)' : '(Disconnected)'}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Content based on PLC selection */}
      {selectedPLC ? (
        <>
          {/* Live Gauges Section (Top) */}
          {(registers && registers.filter(reg => reg.is_monitored).length > 0) && (
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Gauges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {registers.filter(reg => reg.is_monitored).map(register => (
                  <div
                    key={register.id}
                    className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col items-center justify-center text-center"
                  >
                    <div className="text-gray-600 text-sm mb-2 font-medium">{register.name}</div>
                    <GaugeComponent
                      value={registerValues[register.id]?.value ?? 0}
                      type="radial"
                      arc={{
                        padding: 0.005,
                        cornerRadius: 1,
                        width: 0.2,
                        gradient: true,
                        colorArray: ['#5BE12C', '#F5CD19', '#EA4228'], // Green, Yellow, Red
                        subArcs: [
                          // { limit: 33, color: '#5BE12C' },
                          // { limit: 66, color: '#F5CD19' },
                          // { limit: 100, color: '#EA4228' },
                        ]
                      }}
                      pointer={{ type: "blob", animationDuration: 300 }}
                      labels={{
                        valueLabel: {
                          formatTextValue: value => `${value.toFixed(2)} ${register.unit}`,
                          style: { fontSize: '24px', fill: '#333' },
                        },
                        tickLabels: {
                          type: 'outer',
                          ticks: [{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }],
                          style: { fontSize: '10px', fill: '#666' },
                        },
                      }}
                      maxValue={registerValues[register.id]?.max_value || 100} // Assuming 0-100 scale for gauges
                      minValue={registerValues[register.id]?.min_value || 0}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Addr: {register.address} | Type: {register.data_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Register View Section (Bottom) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Register Cards (Left Column) */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Monitored Registers</h2>
              {registers?.filter(reg => reg.is_monitored).length === 0 && (
                <p className="text-gray-500">No registers are currently set for monitoring. Toggle 'is_monitored' in register setup.</p>
              )}
              {registers?.filter(reg => reg.is_monitored).map((register) => (
                <div
                  key={register.id}
                  className="card p-4 hover:shadow-lg transition-shadow duration-200 bg-white rounded-xl shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {register.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {register.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Address: {register.address} | Type: {register.data_type} | Scale: {register.scaling_factor}
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

            {/* Chart (Right Column) */}
            {/* <div className="lg:col-span-2">
              <div className="card p-4 h-[700px] bg-white rounded-2xl shadow-lg ">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Trend</h2>
                {Object.keys(chartDataHistory).length > 0 ? (
                  <Line data={{ labels: Object.values(chartDataHistory)[0].labels, datasets: getChartDatasets() }} options={chartOptions} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No data to display in chart. Start monitoring a PLC with registers.
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-4">*Chart displays recent values.</p>
              </div>
            </div> */}
            <div className="lg:col-span-2">
              <div className="card p-4 h-[700px] bg-white rounded-2xl shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Trend</h2>
                {Object.keys(chartDataHistory).length > 0 ? (
                  <div className="flex-1 min-h-0">
                    <Line 
                      data={{ 
                        labels: Object.values(chartDataHistory)[0].labels, 
                        datasets: getChartDatasets() 
                      }} 
                      options={{
                        ...chartOptions,
                        responsive: true,
                        maintainAspectRatio: false, // This is crucial for react-chartjs-2
                      }} 
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    No data to display in chart. Start monitoring a PLC with registers.
                  </div>
                )}
                {/* <p className="text-sm text-gray-500 mt-4">*Chart displays recent values.</p> */}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <p className="text-2xl font-semibold mb-2">Welcome to the PLC Modbus Hub!</p>
          <p>Please select a PLC from the dropdown above to view its registers and live data.</p>
        </div>
      )}
    </div>
  );
}
