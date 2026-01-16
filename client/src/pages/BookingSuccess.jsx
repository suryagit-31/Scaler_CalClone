import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, User, Mail } from 'lucide-react';
import dayjs from 'dayjs';

function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    if (location.state) {
      setBookingData(location.state);
    } else {
      // If no state, redirect to home
      navigate('/');
    }
  }, [location, navigate]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const { booking, eventType, date, slot } = bookingData;

  const generateCalendarLink = () => {
    const start = dayjs(slot.start).format('YYYYMMDDTHHmmss[Z]');
    const end = dayjs(slot.end).format('YYYYMMDDTHHmmss[Z]');
    const title = encodeURIComponent(eventType.title);
    const details = encodeURIComponent(`Meeting with ${booking.attendee_name}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${start}/${end}&text=${title}&details=${details}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-4">
      <div className="bg-white shadow-xl rounded-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            This meeting is scheduled
          </h1>
        </div>

        <div className="border-t border-b border-gray-200 py-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Date</span>
              </div>
              <p className="text-gray-900 font-medium">
                {dayjs(date).format('dddd, MMMM D, YYYY')}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span>Time</span>
              </div>
              <p className="text-gray-900 font-medium">
                {dayjs(slot.start).format('h:mm A')} - {dayjs(slot.end).format('h:mm A')}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span>Attendee</span>
              </div>
              <p className="text-gray-900 font-medium">{booking.attendee_name}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-gray-900 font-medium">{booking.attendee_email}</p>
            </div>

            <div className="col-span-2">
              <div className="text-gray-500 mb-1">Event Type</div>
              <p className="text-gray-900 font-medium">{eventType.title}</p>
            </div>

            {booking.notes && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Notes</div>
                <p className="text-gray-900 font-medium">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <a
            href={generateCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Add to Calendar
          </a>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccess;
