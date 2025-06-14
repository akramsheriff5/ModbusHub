import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

export default function AddRegisters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPLC, setSelectedPLC] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    data_type: 'uint16',
    scaling_factor: 1,
    unit: '',
    description: '',
    min_value: '',
    max_value: '',
    read_write: 'read_write',
  });
  const [error, setError] = useState('');

  const { data: plcs } = useQuery('plcs', async () => {
    const response = await axios.get('/api/plcs');
    return response.data;
  });

  const mutation = useMutation(
    (newRegister) => axios.post(`/api/plcs/${selectedPLC}/registers`, newRegister),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['registers', selectedPLC]);
        navigate(`/devices/${selectedPLC}`);
      },
      onError: (err) => {
        setError(err?.response?.data?.message || 'Failed to add register.');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Register</h2>
        <p className="text-gray-500 mb-6">Enter the details for the new register.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="plc" className="block text-sm font-medium text-gray-700 mb-1">
              Select Device
            </label>
            <select
              id="plc"
              value={selectedPLC}
              onChange={(e) => setSelectedPLC(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a device</option>
              {plcs?.map((plc) => (
                <option key={plc.id} value={plc.id}>
                  {plc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Register Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter register name"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Register Address
            </label>
            <input
              type="number"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter register address"
            />
          </div>
          <div>
            <label htmlFor="data_type" className="block text-sm font-medium text-gray-700 mb-1">
              Data Type
            </label>
            <select
              id="data_type"
              name="data_type"
              value={formData.data_type}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="uint16">uint16</option>
              <option value="int16">int16</option>
              <option value="uint32">uint32</option>
              <option value="int32">int32</option>
              <option value="float32">float32</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="scaling_factor" className="block text-sm font-medium text-gray-700 mb-1">
                Scaling Factor
              </label>
              <input
                type="number"
                id="scaling_factor"
                name="scaling_factor"
                value={formData.scaling_factor}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="1"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="e.g., °C, V, A"
              />
            </div>
          </div>
          <div>
            <label htmlFor="min_value" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Value
            </label>
            <input
              type="number"
              id="min_value"
              name="min_value"
              value={formData.min_value}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter minimum value"
            />
          </div>
          <div>
            <label htmlFor="max_value" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Value
            </label>
            <input
              type="number"
              id="max_value"
              name="max_value"
              value={formData.max_value}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter maximum value"
            />
          </div>
          <div>
            <label htmlFor="read_write" className="block text-sm font-medium text-gray-700 mb-1">
              Read/Write Access
            </label>
            <select
              id="read_write"
              name="read_write"
              value={formData.read_write}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="read_write">Read & Write</option>
              <option value="read_only">Read Only</option>
              <option value="write_only">Write Only</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enter register description"
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 mt-2 transition"
          >
            {mutation.isLoading ? 'Adding...' : 'Add Register'}
          </button>
        </form>
      </div>
    </div>
  );
} 