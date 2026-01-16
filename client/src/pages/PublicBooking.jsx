import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Clock, User } from 'lucide-react';
import apiClient from '../config/axios';
import dayjs from 'dayjs';
import BookingForm from '../components/BookingForm';

function PublicBooking() {
  const { slug } = useParams();
  const [eventType, setEventType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchEventType();
  }, [slug]);

  useEffect(() => {
    if (selectedDate && eventType) {
      fetchSlots();
    }
  }, [selectedDate, eventType]);

  const fetchEventType = async () => {
    try {
      // First try to get by slug directly
      const response = await apiClient.get(`/api/event-types/slug/${slug}`);
      setEventType(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event type:', error);
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedDate || !eventType) return;

    setLoadingSlots(true);
    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const response = await apiClient.get(`/api/slots?eventTypeId=${eventType.id}&date=${dateStr}`);
      setSlots(response.data);
      setLoadingSlots(false);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
          <p className="text-gray-500">This event type does not exist or is not available.</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('dddd, MMMM D');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="bg-white shadow-xl rounded-2xl max-w-5xl mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* Left Column - Calendar */}
        <div className="w-full md:w-1/2 p-8 border-r border-gray-200">
          {/* Host Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-white font-medium text-lg">
                {eventType.user_slug ? eventType.user_slug.charAt(0).toUpperCase() : 'H'}
              </div>
              <div>
                <p className="text-gray-500 text-sm">
                  {eventType.user_slug || 'Host'}
                </p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{eventType.title}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{eventType.duration} min</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="mt-6">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
              className="border-0 w-full"
              tileClassName={({ date, view }) => {
                if (view === 'month') {
                  return 'hover:bg-gray-100 rounded-full transition-colors';
                }
              }}
              formatShortWeekday={(locale, date) => {
                return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
              }}
            />
            <style>{`
              .react-calendar {
                border: none;
                width: 100%;
              }
              .react-calendar__tile {
                padding: 1em 0.5em;
                border-radius: 50%;
                color: #374151;
              }
              .react-calendar__tile--active {
                background: #000 !important;
                color: white !important;
                border-radius: 50%;
              }
              .react-calendar__tile:enabled:hover {
                background: #f3f4f6;
                border-radius: 50%;
              }
              .react-calendar__tile--now {
                background: transparent;
                color: #000;
                font-weight: 600;
              }
              .react-calendar__tile--active.react-calendar__tile--now {
                background: #000 !important;
                color: white !important;
              }
              .react-calendar__navigation {
                margin-bottom: 1em;
              }
              .react-calendar__navigation button {
                color: #374151;
                font-weight: 600;
              }
              .react-calendar__month-view__weekdays {
                font-weight: 600;
                color: #6b7280;
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 0.5em;
              }
            `}</style>
          </div>
        </div>

        {/* Right Column - Slots or Form */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto max-h-[600px] bg-white">
          {!selectedDate ? (
            <div className="text-center py-12 text-gray-500">
              <p>Select a date to see available time slots</p>
            </div>
          ) : selectedSlot ? (
            <BookingForm
              slot={selectedSlot}
              eventType={eventType}
              date={selectedDate}
              onBack={() => setSelectedSlot(null)}
              onSuccess={() => {
                setSelectedSlot(null);
                setSelectedDate(null);
                setSlots([]);
              }}
            />
          ) : (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">{formatDate(selectedDate)}</h2>
              {loadingSlots ? (
                <div className="text-center py-8 text-gray-500">Loading slots...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available slots for this date
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot)}
                      className="w-full py-2 mb-2 border border-gray-200 rounded-md text-gray-900 font-medium hover:border-black hover:bg-gray-50 transition-colors"
                    >
                      {slot.formatted || dayjs(slot.start).format('h:mm A')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicBooking;
