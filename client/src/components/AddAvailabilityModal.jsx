import { useState, useEffect } from 'react';
import { X, Plus, Copy, Trash2, Globe } from 'lucide-react';
import apiClient from '../config/axios';

function AddAvailabilityModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = name input, 2 = daily configuration
  const [scheduleName, setScheduleName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);
  
  // Day configuration: each day can have multiple time slots
  const [days, setDays] = useState([
    { dayOfWeek: 0, name: 'Sunday', enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 1, name: 'Monday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 2, name: 'Tuesday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 3, name: 'Wednesday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 4, name: 'Thursday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 5, name: 'Friday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 6, name: 'Saturday', enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
  ]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStep(1);
      setScheduleName('');
      setIsDefault(false);
      setTimezone('Asia/Kolkata');
      setDays([
        { dayOfWeek: 0, name: 'Sunday', enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 1, name: 'Monday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, name: 'Tuesday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, name: 'Wednesday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, name: 'Thursday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 5, name: 'Friday', enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 6, name: 'Saturday', enabled: false, slots: [{ start: '09:00', end: '17:00' }] },
      ]);
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinue = () => {
    if (scheduleName.trim()) {
      setStep(2);
    }
  };

  const toggleDay = (dayIndex) => {
    setDays(prev => prev.map((day, idx) => 
      idx === dayIndex ? { ...day, enabled: !day.enabled } : day
    ));
  };

  const addTimeSlot = (dayIndex) => {
    setDays(prev => prev.map((day, idx) => 
      idx === dayIndex 
        ? { ...day, slots: [...day.slots, { start: '09:00', end: '17:00' }] }
        : day
    ));
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    setDays(prev => prev.map((day, idx) => 
      idx === dayIndex 
        ? { ...day, slots: day.slots.filter((_, sIdx) => sIdx !== slotIndex) }
        : day
    ));
  };

  const duplicateTimeSlot = (dayIndex, slotIndex) => {
    setDays(prev => prev.map((day, idx) => 
      idx === dayIndex 
        ? { ...day, slots: [...day.slots, { ...day.slots[slotIndex] }] }
        : day
    ));
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    setDays(prev => prev.map((day, idx) => 
      idx === dayIndex 
        ? { 
            ...day, 
            slots: day.slots.map((slot, sIdx) => 
              sIdx === slotIndex ? { ...slot, [field]: value } : slot
            )
          }
        : day
    ));
  };

  const formatTimeForDB = (time) => {
    // Convert "09:00" to "09:00:00"
    return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
  };

  const handleSave = async () => {
    if (!scheduleName.trim()) return;

    setSaving(true);
    try {
      // Get existing availability
      const existingResponse = await apiClient.get('/api/availability');
      const existingAvailability = existingResponse.data;

      // Build new availability array
      const newAvailability = [];
      
      // Add existing availability (excluding entries with the same schedule name)
      existingAvailability.forEach(avail => {
        if (avail.name !== scheduleName) {
          newAvailability.push({
            name: avail.name,
            day_of_week: avail.day_of_week,
            start_time: avail.start_time,
            end_time: avail.end_time,
            is_default: isDefault ? false : avail.is_default // Unset if new one is default
          });
        }
      });

      // Add new availability entries for enabled days
      days.forEach(day => {
        if (day.enabled) {
          day.slots.forEach(slot => {
            newAvailability.push({
              name: scheduleName,
              day_of_week: day.dayOfWeek,
              start_time: formatTimeForDB(slot.start),
              end_time: formatTimeForDB(slot.end),
              is_default: isDefault
            });
          });
        }
      });

      // Save all availability (backend will delete all and insert new)
      await apiClient.put('/api/availability', { availability: newAvailability });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeDisplay = (time) => {
    // Convert "09:00" to "9:00am" format
    if (!time) return '9:00am';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const formatTimeForInput = (time) => {
    // Convert "09:00" to display format for input
    return time || '09:00';
  };

  const getSummaryText = () => {
    const enabledDays = days.filter(d => d.enabled);
    if (enabledDays.length === 0) return 'No days selected';
    
    const dayNames = enabledDays.map(d => d.name.substring(0, 3)).join(', ');
    const firstSlot = enabledDays[0]?.slots[0];
    if (firstSlot) {
      return `${dayNames}, ${formatTimeDisplay(firstSlot.start)} - ${formatTimeDisplay(firstSlot.end)}`;
    }
    return dayNames;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-xl mx-4 overflow-hidden ${
          step === 1 ? 'w-full max-w-md' : 'w-full max-w-5xl'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif', maxHeight: '95vh' }}
      >
        {step === 1 ? (
          // Step 1: Name Input Dialog
          <>
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Add a new schedule
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && scheduleName.trim()) {
                      handleContinue();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black text-base"
                  placeholder="Surya hours"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-8 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:text-black transition-colors font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!scheduleName.trim()}
                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          // Step 2: Daily Availability Configuration
          <div className="flex flex-col" style={{ maxHeight: '95vh' }}>
            {/* Header */}
            <div className="px-8 pt-6 pb-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {scheduleName}
                </h2>
                <p className="text-sm text-gray-500">
                  {getSummaryText()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Daily Hours Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Set your weekly hours</h3>
                <div className="space-y-4">
                  {days.map((day, dayIndex) => (
                    <div key={day.dayOfWeek} className="flex items-start gap-4 py-2">
                      {/* Day Toggle */}
                      <div className="w-40 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDay(dayIndex)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                            day.enabled ? 'bg-black' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              day.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                          {day.name}
                        </span>
                      </div>

                      {/* Time Slots */}
                      {day.enabled && (
                        <div className="flex-1 space-y-2">
                          {day.slots.map((slot, slotIndex) => (
                            <div key={slotIndex} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={formatTimeForInput(slot.start)}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-28"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={formatTimeForInput(slot.end)}
                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-28"
                              />
                              {day.slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1.5"
                                  title="Remove time slot"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => duplicateTimeSlot(dayIndex, slotIndex)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5"
                                title="Duplicate time slot"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {slotIndex === day.slots.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => addTimeSlot(dayIndex)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5"
                                  title="Add another time slot"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Overrides Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Date overrides</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add dates when your availability changes from your daily hours.
                </p>
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  + Add an override
                </button>
              </div>

              {/* Right Panel Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                      </select>
                    </div>
                  </div>

                  {/* Troubleshooter */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Something doesn't look right?
                    </h4>
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      Launch troubleshooter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <span className="text-sm font-medium text-gray-700">Set as default</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !scheduleName.trim()}
                  className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddAvailabilityModal;

