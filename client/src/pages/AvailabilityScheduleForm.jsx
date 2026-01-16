import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Copy,
  X,
  Trash2,
  Globe,
  Edit2,
  Info,
} from "lucide-react";
import apiClient from "../config/axios";
import TimePicker from "../components/TimePicker";

function AvailabilityScheduleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = !id || id === "new" || id === "undefined";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [scheduleName, setScheduleName] = useState(
    location.state?.scheduleName || ""
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  // Day configuration: each day can have multiple time slots
  const [days, setDays] = useState([
    {
      dayOfWeek: 0,
      name: "Sunday",
      enabled: false,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 1,
      name: "Monday",
      enabled: true,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 2,
      name: "Tuesday",
      enabled: true,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 3,
      name: "Wednesday",
      enabled: true,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 4,
      name: "Thursday",
      enabled: true,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 5,
      name: "Friday",
      enabled: true,
      slots: [{ start: "09:00", end: "17:00" }],
    },
    {
      dayOfWeek: 6,
      name: "Saturday",
      enabled: false,
      slots: [{ start: "09:00", end: "17:00" }],
    },
  ]);

  useEffect(() => {
    if (!isNew && id && id !== "undefined") {
      fetchSchedule();
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  const fetchSchedule = async () => {
    if (!id || id === "undefined" || id === "new") {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/api/availability/schedules/${id}`);
      const schedule = response.data;

      setScheduleName(schedule.name);
      setIsDefault(schedule.is_default);
      setTimezone(schedule.timezone || "Asia/Kolkata");

      // Convert slots to days format
      const daysMap = {
        0: { dayOfWeek: 0, name: "Sunday", enabled: false, slots: [] },
        1: { dayOfWeek: 1, name: "Monday", enabled: false, slots: [] },
        2: { dayOfWeek: 2, name: "Tuesday", enabled: false, slots: [] },
        3: { dayOfWeek: 3, name: "Wednesday", enabled: false, slots: [] },
        4: { dayOfWeek: 4, name: "Thursday", enabled: false, slots: [] },
        5: { dayOfWeek: 5, name: "Friday", enabled: false, slots: [] },
        6: { dayOfWeek: 6, name: "Saturday", enabled: false, slots: [] },
      };

      // Process all slots from the schedule
      schedule.slots.forEach((slot) => {
        const day = daysMap[slot.day_of_week];
        if (day) {
          day.enabled = true;
          // Add slot to the day (supports multiple slots per day)
          day.slots.push({
            start: slot.start_time.substring(0, 5), // Remove seconds
            end: slot.end_time.substring(0, 5),
          });
        }
      });

      // Ensure all enabled days have at least one slot
      Object.values(daysMap).forEach((day) => {
        if (day.enabled && day.slots.length === 0) {
          day.slots = [{ start: "09:00", end: "17:00" }];
        }
      });

      setDays(Object.values(daysMap));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const newEnabled = !day.enabled;
          // If enabling and no slots exist, add a default slot
          if (newEnabled && day.slots.length === 0) {
            return {
              ...day,
              enabled: newEnabled,
              slots: [{ start: "09:00", end: "17:00" }],
            };
          }
          return { ...day, enabled: newEnabled };
        }
        return day;
      })
    );
  };

  const addTimeSlot = (dayIndex) => {
    setDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, slots: [...day.slots, { start: "09:00", end: "17:00" }] }
          : day
      )
    );
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    setDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, slots: day.slots.filter((_, sIdx) => sIdx !== slotIndex) }
          : day
      )
    );
  };

  const duplicateTimeSlot = (dayIndex, slotIndex) => {
    setDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, slots: [...day.slots, { ...day.slots[slotIndex] }] }
          : day
      )
    );
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    setDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              slots: day.slots.map((slot, sIdx) =>
                sIdx === slotIndex ? { ...slot, [field]: value } : slot
              ),
            }
          : day
      )
    );
  };

  const formatTimeForDB = (time) => {
    return time.includes(":") && time.split(":").length === 2
      ? `${time}:00`
      : time;
  };

  const formatTimeDisplay = (time) => {
    if (!time) return "9:00 AM";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSummaryText = () => {
    const enabledDays = days.filter((d) => d.enabled);
    if (enabledDays.length === 0) return "No days selected";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const sortedDays = enabledDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    if (sortedDays.length === 0) return "No days selected";

    // Create a function to get a unique key for a day's schedule
    const getScheduleKey = (day) => {
      if (day.slots.length === 0) return "";
      return day.slots.map((slot) => `${slot.start}-${slot.end}`).join(",");
    };

    // Group days by their schedule
    const groups = [];
    let currentGroup = {
      days: [sortedDays[0]],
      scheduleKey: getScheduleKey(sortedDays[0]),
    };

    for (let i = 1; i < sortedDays.length; i++) {
      const day = sortedDays[i];
      const scheduleKey = getScheduleKey(day);

      // Check if this day has the same schedule and is consecutive
      const isConsecutive =
        day.dayOfWeek ===
        currentGroup.days[currentGroup.days.length - 1].dayOfWeek + 1;
      const hasSameSchedule = scheduleKey === currentGroup.scheduleKey;

      if (isConsecutive && hasSameSchedule) {
        // Add to current group
        currentGroup.days.push(day);
      } else {
        // Start a new group
        groups.push(currentGroup);
        currentGroup = {
          days: [day],
          scheduleKey: scheduleKey,
        };
      }
    }
    groups.push(currentGroup);

    // Format each group
    const formattedGroups = groups.map((group) => {
      const firstDay = group.days[0];
      const lastDay = group.days[group.days.length - 1];

      let dayRange;
      if (group.days.length === 1) {
        dayRange = dayNames[firstDay.dayOfWeek];
      } else {
        dayRange = `${dayNames[firstDay.dayOfWeek]} - ${
          dayNames[lastDay.dayOfWeek]
        }`;
      }

      // Get the time range (assuming single slot for summary)
      const firstSlot = firstDay.slots[0];
      if (firstSlot) {
        const startTime = formatTimeDisplay(firstSlot.start);
        const endTime = formatTimeDisplay(firstSlot.end);
        return `${dayRange}: ${startTime} - ${endTime}`;
      }
      return dayRange;
    });

    return formattedGroups.join(", ");
  };

  const handleSave = async () => {
    if (!scheduleName.trim()) {
      alert("Please enter a schedule name");
      return;
    }

    setSaving(true);
    try {
      const slots = [];
      days.forEach((day) => {
        if (day.enabled) {
          day.slots.forEach((slot) => {
            slots.push({
              day_of_week: day.dayOfWeek,
              start_time: formatTimeForDB(slot.start),
              end_time: formatTimeForDB(slot.end),
            });
          });
        }
      });

      // Check if this is a new schedule
      if (isNew || !id || id === "undefined" || id === "new") {
        // Create new schedule
        const response = await apiClient.post("/api/availability/schedules", {
          name: scheduleName,
          timezone,
          is_default: isDefault,
          slots,
        });

        if (response.data && response.data.id) {
          navigate(`/availability/${response.data.id}`);
        } else {
          navigate("/availability");
        }
        return;
      } else {
        // Update existing schedule - validate ID is a number
        const scheduleId = parseInt(id);
        if (isNaN(scheduleId)) {
          alert("Invalid schedule ID. Please try again.");
          setSaving(false);
          return;
        }

        await apiClient.put(`/api/availability/schedules/${scheduleId}`, {
          name: scheduleName,
          timezone,
          is_default: isDefault,
          slots,
        });

        navigate("/availability");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to save schedule. Please try again.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    if (!id || id === "undefined") {
      alert("Invalid schedule ID. Cannot delete.");
      return;
    }

    try {
      await apiClient.delete(`/api/availability/schedules/${id}`);
      navigate("/availability");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-white p-8 mt-4 ml-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Link
              to="/availability"
              className="text-gray-600 hover:text-gray-900 transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingName(false);
                    }
                  }}
                  className="text-3xl font-semibold text-gray-900 border-b-2 border-gray-300 focus:outline-none focus:border-black bg-transparent"
                  autoFocus
                />
              ) : (
                <>
                  <h1 className="text-3xl font-semibold text-gray-900">
                    {scheduleName || "New Schedule"}
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditingName(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                Set as default
              </span>
            </label>
            {!isNew && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                title="Delete schedule"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              disabled={saving || !scheduleName.trim()}
              className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <p className="text-base text-gray-500 ml-11">{getSummaryText()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-8">
          {/* Set your weekly hours */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              Set your weekly hours
            </h2>
            <div className="space-y-4">
              {days.map((day, dayIndex) => (
                <div
                  key={day.dayOfWeek}
                  className="flex items-center gap-6 py-2"
                >
                  {/* Day Toggle */}
                  <div className="w-36 flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDay(dayIndex);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
                        day.enabled ? "bg-black" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          day.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-base font-medium text-gray-700">
                      {day.name}
                    </span>
                  </div>

                  {/* Time Slots */}
                  {day.enabled && (
                    <div className="flex-1 space-y-2">
                      {day.slots.length > 0 ? (
                        day.slots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className="flex items-center gap-3"
                          >
                            <TimePicker
                              value={slot.start}
                              onChange={(timeValue) =>
                                updateTimeSlot(
                                  dayIndex,
                                  slotIndex,
                                  "start",
                                  timeValue
                                )
                              }
                              className="w-40"
                            />
                            <span className="text-gray-500 text-base">-</span>
                            <TimePicker
                              value={slot.end}
                              onChange={(timeValue) =>
                                updateTimeSlot(
                                  dayIndex,
                                  slotIndex,
                                  "end",
                                  timeValue
                                )
                              }
                              className="w-40"
                            />
                            <div className="flex items-center gap-2 ml-2">
                              {day.slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeTimeSlot(dayIndex, slotIndex);
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                  title="Remove time slot"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  duplicateTimeSlot(dayIndex, slotIndex);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                title="Duplicate time slot"
                              >
                                <Copy className="w-5 h-5" />
                              </button>
                              {slotIndex === day.slots.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    addTimeSlot(dayIndex);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                  title="Add another time slot"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback: if somehow slots array is empty, show default
                        <div className="flex items-center gap-3">
                          <TimePicker
                            value="09:00"
                            onChange={(timeValue) => {
                              // Initialize slot if empty
                              if (day.slots.length === 0) {
                                addTimeSlot(dayIndex);
                              }
                              updateTimeSlot(dayIndex, 0, "start", timeValue);
                            }}
                            className="w-40"
                          />
                          <span className="text-gray-500 text-base">-</span>
                          <TimePicker
                            value="17:00"
                            onChange={(timeValue) => {
                              if (day.slots.length === 0) {
                                addTimeSlot(dayIndex);
                              }
                              updateTimeSlot(dayIndex, 0, "end", timeValue);
                            }}
                            className="w-40"
                          />
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                duplicateTimeSlot(dayIndex, 0);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                              title="Duplicate time slot"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                addTimeSlot(dayIndex);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                              title="Add another time slot"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Date Overrides */}
          <div className="border border-gray-200 rounded-lg bg-white p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Date overrides
              </h2>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-base text-gray-500 mb-4">
              Add dates when your availability changes from your daily hours.
            </p>
            <button
              type="button"
              className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-base text-gray-900 hover:bg-gray-50 font-medium transition-colors bg-white"
            >
              <Plus className="w-4 h-4" />
              Add an override
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Timezone */}
            <div className="border border-gray-200 rounded-lg bg-white p-6">
              <label className="block text-base font-medium text-gray-700 mb-3">
                Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200"></div>

            {/* Troubleshooter */}
            <div className="border border-gray-200 rounded-lg bg-gray-50 p-6">
              <h4 className="text-base font-medium text-gray-900 mb-2">
                Something doesn't look right?
              </h4>
              <button
                type="button"
                className="text-base text-gray-600 hover:text-gray-900 font-medium"
              >
                Launch troubleshooter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityScheduleForm;
