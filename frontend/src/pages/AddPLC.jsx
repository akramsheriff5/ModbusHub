import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

export default function AddPLC() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: 502,
    unit_id: 1,
  });

  const mutation = useMutation(
    (newPLC) => axios.post('/api/plcs', newPLC),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('plcs');
        navigate('/devices');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add New Device</h2>
        <p className="text-gray-500 mb-6">Enter the details for your new Modbus device.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter device name"
            />
          </div>

          <div>
            <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700 mb-1">
              IP Address
            </label>
            <input
              type="text"
              id="ip_address"
              name="ip_address"
              value={formData.ip_address}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter IP address"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="502"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700 mb-1">
                Unit ID
              </label>
              <input
                type="number"
                id="unit_id"
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 mt-2 transition"
          >
            {mutation.isLoading ? 'Adding...' : 'Add Device'}
          </button>
        </form>
      </div>
    </div>
  );
} 