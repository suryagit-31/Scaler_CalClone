import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../config/axios';
import dayjs from 'dayjs';

function BookingForm({ slot, eventType, date, onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        event_type_id: eventType.id,
        attendee_name: formData.name,
        attendee_email: formData.email,
        start_time: slot.start,
        end_time: slot.end,
        notes: formData.notes || null,
      };

      const response = await apiClient.post('/api/bookings', bookingData);

      // Store booking data for success page
      const bookingId = response.data.id;
      navigate(`/booking/success?bookingId=${bookingId}`, {
        state: {
          booking: response.data,
          eventType,
          date,
          slot,
        },
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.error || 'Failed to create booking');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-gray-500 hover:text-black mb-4 flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="font-semibold text-gray-900 mb-4">
        {dayjs(date).format('dddd, MMMM D')} at {dayjs(slot.start).format('h:mm A')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Add any additional details..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Confirming...' : 'Confirm'}
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
