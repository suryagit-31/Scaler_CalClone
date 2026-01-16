import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Availability from './pages/Availability';
import AvailabilityScheduleForm from './pages/AvailabilityScheduleForm';
import EventTypeForm from './pages/EventTypeForm';
import PublicBooking from './pages/PublicBooking';
import BookingSuccess from './pages/BookingSuccess';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes - must be before public slug route */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="availability" element={<Availability />} />
          <Route path="availability/new" element={<AvailabilityScheduleForm />} />
          <Route path="availability/:id" element={<AvailabilityScheduleForm />} />
          <Route path="event-types/new" element={<EventTypeForm />} />
          <Route path="event-types/:id/edit" element={<EventTypeForm />} />
        </Route>
        
        {/* Public routes */}
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/:slug" element={<PublicBooking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
