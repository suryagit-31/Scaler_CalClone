import { useState, useEffect } from "react";

function AddScheduleNameModal({ isOpen, onClose, onContinue }) {
  const [scheduleName, setScheduleName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setScheduleName("");
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinue = () => {
    if (scheduleName.trim()) {
      onContinue(scheduleName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif' }}
      >
        {/* Modal Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add a new schedule
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && scheduleName.trim()) {
                  handleContinue();
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-base"
              placeholder="Working hours"
              autoFocus
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!scheduleName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddScheduleNameModal;

