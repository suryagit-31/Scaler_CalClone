import { useState, useRef } from "react";
import { X, Bold, Italic } from "lucide-react";
import apiClient from "../config/axios";

function AddEventTypeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    duration: 15,
    description: "",
    is_visible: true,
    location: "Cal Video",
    allow_multiple_durations: false,
    user_slug: "Surya-dammalapa-vfsnch",
  });
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const descriptionRef = useRef(null);

  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (value) => {
    const newTitle = value;
    setFormData((prev) => {
      const newSlug = slugManuallyEdited ? prev.slug : generateSlug(newTitle);
      return {
        ...prev,
        title: newTitle,
        slug: newSlug,
      };
    });
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    const slug = generateSlug(value);
    setFormData({ ...formData, slug });
  };

  const handleBoldClick = () => {
    if (!descriptionRef.current) return;

    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    const beforeText = formData.description.substring(0, start);
    const afterText = formData.description.substring(end);

    let newText;
    if (selectedText) {
      // If text is selected, wrap it with **
      if (selectedText.startsWith("**") && selectedText.endsWith("**")) {
        // Remove bold if already bold
        newText = beforeText + selectedText.slice(2, -2) + afterText;
        textarea.setSelectionRange(start, end - 4);
      } else {
        // Add bold
        newText = beforeText + "**" + selectedText + "**" + afterText;
        textarea.setSelectionRange(start + 2, end + 2);
      }
    } else {
      // Insert ** at cursor position
      newText = beforeText + "****" + afterText;
      textarea.setSelectionRange(start + 2, start + 2);
    }

    setFormData({ ...formData, description: newText });
    setTimeout(() => textarea.focus(), 0);
  };

  const handleItalicClick = () => {
    if (!descriptionRef.current) return;

    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    const beforeText = formData.description.substring(0, start);
    const afterText = formData.description.substring(end);

    let newText;
    if (selectedText) {
      // If text is selected, wrap it with *
      if (
        selectedText.startsWith("*") &&
        selectedText.endsWith("*") &&
        !selectedText.startsWith("**")
      ) {
        // Remove italic if already italic (but not bold)
        newText = beforeText + selectedText.slice(1, -1) + afterText;
        textarea.setSelectionRange(start, end - 2);
      } else {
        // Add italic
        newText = beforeText + "*" + selectedText + "*" + afterText;
        textarea.setSelectionRange(start + 1, end + 1);
      }
    } else {
      // Insert * at cursor position
      newText = beforeText + "**" + afterText;
      textarea.setSelectionRange(start + 1, start + 1);
    }

    setFormData({ ...formData, description: newText });
    setTimeout(() => textarea.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.duration) {
      alert("Please fill in all required fields (Title and Duration)");
      return;
    }

    // Ensure slug is not empty - generate from title if needed
    let finalSlug = formData.slug.trim();
    if (!finalSlug) {
      finalSlug = generateSlug(formData.title);
      if (!finalSlug) {
        alert("Please enter a valid title");
        return;
      }
    }

    setSaving(true);

    try {
      await apiClient.post("/api/event-types", {
        ...formData,
        slug: finalSlug,
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: "",
        slug: "",
        duration: 15,
        description: "",
        is_visible: true,
        location: "Cal Video",
        allow_multiple_durations: false,
        user_slug: "Surya-dammalapa-vfsnch",
      });
      setSlugManuallyEdited(false);
    } catch (error) {
      console.error("Error creating event type:", error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to create event type";
      alert(errorMessage);
      setSaving(false);
    }
  };

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
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif' }}
      >
        {/* Modal Header */}
        <div className="px-8 pt-6 pb-4">
          <h2
            className="text-3xl font-semibold text-gray-900 mb-2"
            style={{
              fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
            }}
          >
            Add a new event type
          </h2>
          <p
            className="text-lg font-normal text-gray-500"
            style={{
              fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
            }}
          >
            Set up event types to offer different types of meetings.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-4">
          {/* Title */}
          <div>
            <label
              className="block text-lg font-medium text-gray-900 mb-2"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-black text-lg"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                fontWeight: 400,
              }}
              placeholder="30 min meeting"
            />
          </div>

          {/* URL */}
          <div>
            <label
              className="block text-lg font-medium text-gray-900 mb-2"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              URL
            </label>
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <span
                className="px-5 py-3 bg-gray-50 text-gray-600 text-base border-r border-gray-300 font-normal truncate max-w-[250px]"
                style={{
                  fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                }}
                title={`https://cal.com/${formData.user_slug}/`}
              >
                https://cal.com/{formData.user_slug}/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                className="flex-1 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-black text-lg"
                style={{
                  fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                  fontWeight: 400,
                }}
                placeholder="30min"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-lg font-medium text-gray-900 mb-2"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              Description
            </label>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <div className="border-b border-gray-300 px-5 py-3 bg-gray-50 flex gap-2">
                <button
                  type="button"
                  onClick={handleBoldClick}
                  className="text-gray-500 hover:text-black font-semibold transition-colors p-1"
                  style={{
                    fontFamily:
                      'Inter, "Inter Fallback", system-ui, sans-serif',
                  }}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleItalicClick}
                  className="text-gray-500 hover:text-black italic transition-colors font-normal p-1"
                  style={{
                    fontFamily:
                      'Inter, "Inter Fallback", system-ui, sans-serif',
                  }}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
              <textarea
                ref={descriptionRef}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-5 py-3 focus:outline-none resize-none text-lg"
                style={{
                  fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                  fontWeight: 400,
                }}
                placeholder="A quick video meeting."
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label
              className="block text-lg font-medium text-gray-900 mb-2"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              Duration
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                required
                min="1"
                className="w-28 border border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-black text-lg"
                style={{
                  fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                  fontWeight: 400,
                }}
              />
              <span
                className="text-gray-700 font-normal text-lg"
                style={{
                  fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
                }}
              >
                minutes
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:text-black transition-colors font-medium text-lg"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-lg"
              style={{
                fontFamily: 'Inter, "Inter Fallback", system-ui, sans-serif',
              }}
            >
              {saving ? "Creating..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEventTypeModal;
