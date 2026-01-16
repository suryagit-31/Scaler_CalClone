import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

function TimePicker({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Generate times in 15-minute increments
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? "am" : "pm";
        const time12 = `${hour12}:${String(minute).padStart(2, "0")}${ampm}`;
        times.push({ value: time24, display: time12 });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Convert 24-hour format to 12-hour display format
  const formatTimeDisplay = (time24) => {
    if (!time24) return "9:00am";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "am" : "pm";
    return `${hour12}:${minutes}${ampm}`;
  };

  // Find current selected index
  const selectedIndex = timeOptions.findIndex((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Scroll to selected item when dropdown opens
  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current?.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isOpen, selectedIndex]);

  const handleSelect = (timeValue) => {
    onChange(timeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Time Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-black cursor-pointer hover:border-gray-400 transition-colors bg-white flex items-center justify-between ${className}`}
        style={{
          fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
        }}
      >
        <span>{formatTimeDisplay(value)}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto w-full">
          <div className="py-1">
            {timeOptions.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-index={index}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    isSelected
                      ? "bg-gray-50 text-gray-900 font-medium"
                      : "text-gray-700"
                  }`}
                  style={{
                    fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                  }}
                >
                  {option.display}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimePicker;

