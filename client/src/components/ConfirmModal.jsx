import { AlertCircle } from "lucide-react";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif' }}
      >
        {/* Modal Content */}
        <div className="p-12">
          <div className="flex items-start gap-5">
            {type === "danger" && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {title}
              </h3>
              {description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-12 py-5 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
            style={{
              fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-3 text-base font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
            style={{
              fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
