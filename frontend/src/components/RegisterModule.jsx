import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
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
import { Switch } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon, ChartBarIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const VIEW_MODES = {
  CARD: 'card',
  SWITCH: 'switch',
  CHART: 'chart'
};

export default function RegisterModule({ plcId }) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.CARD);
  const [selectedRegisters, setSelectedRegisters] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');
  const queryClient = useQueryClient();

  // Fetch registers
  const { data: registers, isLoading } = useQuery(
    ['registers', plcId],
    async () => {
      const response = await axios.get(`/api/plcs/${plcId}/registers`);
      return response.data;
    },
    {
      enabled: !!plcId,
    }
  );

  // Fetch register values
  const { data: registerValues } = useQuery(
    ['registerValues', plcId, selectedRegisters, timeRange],
    async () => {
      if (!selectedRegisters.length) return [];
      const response = await axios.get(`/api/plcs/${plcId}/registers/values`, {
        params: {
          registers: selectedRegisters.join(','),
          timeRange
        }
      });
      return response.data;
    },
    {
      enabled: !!plcId && selectedRegisters.length > 0,
      refetchInterval: 5000,
    }
  );

  // Update register monitoring status
  const updateMonitoringMutation = useMutation(
    async ({ registerId, isMonitored }) => {
      const response = await axios.put(`/api/plcs/${plcId}/registers/${registerId}`, {
        is_monitored: isMonitored
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', plcId]);
      },
    }
  );

  // Update register value
  const updateValueMutation = useMutation(
    async ({ registerId, value }) => {
      const response = await axios.put(`/api/plcs/${plcId}/registers/${registerId}/value`, {
        value
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registerValues', plcId]);
      },
    }
  );

  // Prepare chart data
  const chartData = {
    labels: registerValues?.map(v => new Date(v.timestamp).toLocaleTimeString()) || [],
    datasets: selectedRegisters.map(registerId => {
      const register = registers?.find(r => r.id === registerId);
      return {
        label: register?.name || 'Unknown',
        data: registerValues?.map(v => v.values[registerId] || 0) || [],
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.4,
      };
    }),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return <div>Loading registers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(VIEW_MODES.CARD)}
            className={`p-2 rounded-lg ${
              viewMode === VIEW_MODES.CARD
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ViewColumnsIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.SWITCH)}
            className={`p-2 rounded-lg ${
              viewMode === VIEW_MODES.SWITCH
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Switch className="h-6 w-6" />
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.CHART)}
            className={`p-2 rounded-lg ${
              viewMode === VIEW_MODES.CHART
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChartBarIcon className="h-6 w-6" />
          </button>
        </div>

        {viewMode === VIEW_MODES.CHART && (
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select bg-white border-gray-300 rounded-lg"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        )}
      </div>

      {/* Register Display */}
      <div className="grid gap-6">
        {viewMode === VIEW_MODES.CARD && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registers?.map((register) => (
              <div
                key={register.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {register.name}
                    </h3>
                    <p className="text-sm text-gray-500">{register.description}</p>
                  </div>
                  <Switch
                    checked={register.is_monitored}
                    onChange={(checked) => {
                      updateMonitoringMutation.mutate({
                        registerId: register.id,
                        isMonitored: checked
                      });
                      if (checked) {
                        setSelectedRegisters(prev => [...prev, register.id]);
                      } else {
                        setSelectedRegisters(prev => prev.filter(id => id !== register.id));
                      }
                    }}
                    className={`${
                      register.is_monitored ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span
                      className={`${
                        register.is_monitored ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {registerValues?.find(v => v.values[register.id])?.values[register.id]?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500">{register.unit || 'No unit'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === VIEW_MODES.SWITCH && (
          <div className="bg-white rounded-lg shadow divide-y">
            {registers?.map((register) => (
              <div key={register.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {register.name}
                  </h3>
                  <p className="text-sm text-gray-500">{register.description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {registerValues?.find(v => v.values[register.id])?.values[register.id]?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">{register.unit || 'No unit'}</div>
                  </div>
                  <Switch
                    checked={register.is_monitored}
                    onChange={(checked) => {
                      updateMonitoringMutation.mutate({
                        registerId: register.id,
                        isMonitored: checked
                      });
                      if (checked) {
                        setSelectedRegisters(prev => [...prev, register.id]);
                      } else {
                        setSelectedRegisters(prev => prev.filter(id => id !== register.id));
                      }
                    }}
                    className={`${
                      register.is_monitored ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span
                      className={`${
                        register.is_monitored ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === VIEW_MODES.CHART && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-[400px]">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {registers?.map((register) => (
                <div
                  key={register.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <Switch
                    checked={selectedRegisters.includes(register.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedRegisters(prev => [...prev, register.id]);
                      } else {
                        setSelectedRegisters(prev => prev.filter(id => id !== register.id));
                      }
                    }}
                    className={`${
                      selectedRegisters.includes(register.id) ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-4 w-8 items-center rounded-full transition-colors`}
                  >
                    <span
                      className={`${
                        selectedRegisters.includes(register.id) ? 'translate-x-4' : 'translate-x-1'
                      } inline-block h-2 w-2 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span className="text-sm font-medium text-gray-900">
                    {register.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 