import { useState, useEffect } from 'react';
import { Filter, ChevronDown, Video, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../config/axios';
import dayjs from 'dayjs';
import ConfirmModal from '../components/ConfirmModal';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelModalState, setCancelModalState] = useState({ isOpen: false, bookingId: null });

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/bookings?filter=${filter}`);
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await apiClient.put(`/api/bookings/${bookingId}/cancel`);
      fetchBookings(); // Refresh list
      setCancelModalState({ isOpen: false, bookingId: null });
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  // Group bookings by date
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = dayjs(booking.start_time);
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');

    let dateKey;
    if (date.isSame(today, 'day')) {
      dateKey = 'TODAY';
    } else if (date.isSame(tomorrow, 'day')) {
      dateKey = 'TOMORROW';
    } else {
      dateKey = date.format('YYYY-MM-DD');
    }

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(booking);
    return acc;
  }, {});

  // Sort date groups
  const sortedDateKeys = Object.keys(groupedBookings).sort((a, b) => {
    if (a === 'TODAY') return -1;
    if (b === 'TODAY') return 1;
    if (a === 'TOMORROW') return -1;
    if (b === 'TOMORROW') return 1;
    return dayjs(a).diff(dayjs(b));
  });

  // Format date for display
  const formatDate = (dateKey) => {
    if (dateKey === 'TODAY') return 'TODAY';
    if (dateKey === 'TOMORROW') return 'TOMORROW';
    return dayjs(dateKey).format('MMMM D, YYYY');
  };

  // Pagination
  const totalRows = bookings.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedKeys = sortedDateKeys.slice(startIndex, endIndex);

  const totalPages = Math.ceil(sortedDateKeys.length / rowsPerPage);

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Bookings</h1>
          <p className="text-sm text-gray-500">
            See upcoming and past events booked through your event type links.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('unconfirmed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unconfirmed'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Unconfirmed
            </button>
            <button
              onClick={() => setFilter('recurring')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'recurring'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Recurring
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter('canceled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'canceled'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Canceled
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Saved filters
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bookings found
          </div>
        ) : (
          <div>
            {paginatedKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">
                    {formatDate(dateKey)}
                  </h3>
                </div>
                {groupedBookings[dateKey].map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border-b border-gray-100 flex justify-between items-start hover:bg-gray-50 transition-colors last:border-b-0"
                  >
                    {/* Left Column */}
                    <div className="flex-1">
                      <div className="mb-2">
                        <p className="font-bold text-gray-900">
                          {dayjs(booking.start_time).format('ddd, D MMM')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {dayjs(booking.start_time).format('h:mm A')} - {dayjs(booking.end_time).format('h:mm A')}
                        </p>
                      </div>
                      {booking.event_type_location === 'Cal Video' || booking.event_type_location !== 'In-person' ? (
                        <a
                          href="#"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Video className="w-4 h-4" />
                          Join Cal Video
                        </a>
                      ) : null}
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 ml-4">
                      <p className="text-gray-900 mb-1 font-medium">
                        {booking.event_type_title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.attendee_name} ({booking.attendee_email})
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-gray-400 mt-1 italic">
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex items-start">
                      {filter !== 'canceled' && (
                        <button
                          onClick={() => setCancelModalState({ isOpen: true, bookingId: booking.id })}
                          className="text-red-600 border border-gray-200 px-3 py-1 rounded text-sm hover:bg-red-50 transition-colors mr-2"
                        >
                          Cancel
                        </button>
                      )}
                      <button className="text-gray-500 hover:text-black">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {bookings.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModalState.isOpen}
        onClose={() => setCancelModalState({ isOpen: false, bookingId: null })}
        onConfirm={() => handleCancel(cancelModalState.bookingId)}
        title="Cancel booking?"
        description="This booking will be canceled and the attendee will be notified."
        confirmText="Cancel booking"
        cancelText="Keep booking"
        type="danger"
      />
    </div>
  );
}

export default Bookings;
