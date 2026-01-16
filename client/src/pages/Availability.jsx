import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, MoreVertical } from 'lucide-react';
import apiClient from '../config/axios';
import dayjs from 'dayjs';
import AddScheduleNameModal from '../components/AddScheduleNameModal';

function Availability() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState([]);
  const [activeTab, setActiveTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await apiClient.get('/api/availability');
      setAvailability(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setLoading(false);
    }
  };

  // Group availability by schedule_id (or name for backward compatibility)
  const groupedAvailability = availability.reduce((acc, avail) => {
    const key = avail.schedule_id || avail.name;
    if (!acc[key]) {
      acc[key] = {
        schedule_id: avail.schedule_id,
        name: avail.name,
        timezone: avail.timezone,
        is_default: avail.is_default,
        slots: [],
      };
    }
    acc[key].slots.push(avail);
    return acc;
  }, {});

  // Format time ranges for display
  const formatTimeRange = (slots) => {
    if (slots.length === 0) return '';

    // Group consecutive days with same times
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Sort by day_of_week
    const sorted = [...slots].sort((a, b) => a.day_of_week - b.day_of_week);
    
    // Group by time ranges
    const groups = [];
    let currentGroup = {
      days: [sorted[0].day_of_week],
      start: sorted[0].start_time,
      end: sorted[0].end_time,
    };

    for (let i = 1; i < sorted.length; i++) {
      const slot = sorted[i];
      if (slot.start_time === currentGroup.start && slot.end_time === currentGroup.end) {
        currentGroup.days.push(slot.day_of_week);
      } else {
        groups.push(currentGroup);
        currentGroup = {
          days: [slot.day_of_week],
          start: slot.start_time,
          end: slot.end_time,
        };
      }
    }
    groups.push(currentGroup);

    // Format groups
    return groups.map(group => {
      const dayStr = group.days.length === 1
        ? dayNames[group.days[0]]
        : group.days.length === 7
        ? 'Mon - Sun'
        : `${dayNames[group.days[0]]} - ${dayNames[group.days[group.days.length - 1]]}`;
      
      const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      return `${dayStr}, ${formatTime(group.start)} - ${formatTime(group.end)}`;
    }).join(', ');
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const availabilityCards = Object.values(groupedAvailability);

  return (
    <div className="max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Availability</h1>
            <p className="text-sm text-gray-500">
              Configure times when you are available for bookings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'my'
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My availability
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'team'
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Team availability
              </button>
            </div>
            <button 
              onClick={() => setShowNameModal(true)}
              className="bg-black text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Availability Cards */}
      <div className="space-y-4">
        {availabilityCards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No availability configured yet.
          </div>
        ) : (
          availabilityCards.map((card, index) => (
            <div
              key={card.schedule_id || card.name || index}
              onClick={() => card.schedule_id && navigate(`/availability/${card.schedule_id}`)}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{card.name}</h3>
                    {card.is_default && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mb-3">
                    {formatTimeRange(card.slots).split(', ').map((range, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        {range}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span>{card.timezone || 'Asia/Kolkata'}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card.schedule_id) {
                      navigate(`/availability/${card.schedule_id}`);
                    }
                  }}
                  className="text-gray-500 hover:text-black transition-colors ml-4"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Temporarily out-of-office?{' '}
          <a href="#" className="text-black hover:underline">
            Add a redirect
          </a>
        </p>
      </div>

      {/* Add Schedule Name Modal */}
      <AddScheduleNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onContinue={(name) => {
          setShowNameModal(false);
          navigate('/availability/new', { state: { scheduleName: name } });
        }}
      />
    </div>
  );
}

export default Availability;
