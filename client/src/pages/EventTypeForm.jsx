import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Code,
  Trash2,
  Check,
  Video,
} from "lucide-react";
import {
  FiCalendar,
  FiClock,
  FiSettings,
  FiRepeat,
  FiGrid,
  FiZap,
  FiLink,
} from "react-icons/fi";
import apiClient from "../config/axios";
import ConfirmModal from "../components/ConfirmModal";

function EventTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    duration: 30,
    description: "",
    is_visible: true,
    location: "Cal Video",
    allow_multiple_durations: false,
    user_slug: "Surya-dammalapa-vfsnch",
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchEventType();
    }
  }, [id]);

  const fetchEventType = async () => {
    try {
      const response = await apiClient.get(`/api/event-types/${id}`);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching event type:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.slug || !formData.duration) {
        alert("Please fill in all required fields (Title, URL, and Duration)");
        setSaving(false);
        return;
      }

      if (isEditing) {
        await apiClient.put(`/api/event-types/${id}`, formData);
      } else {
        await apiClient.post("/api/event-types", formData);
      }
      navigate("/");
    } catch (error) {
      console.error("Error saving event type:", error);
      const errorMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to save event type";
      alert(errorMessage);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/event-types/${id}`);
      navigate("/");
    } catch (error) {
      console.error("Error deleting event type:", error);
      alert("Failed to delete event type");
    }
  };

  const handleSlugChange = (value) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, slug });
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const sidebarItems = [
    {
      id: "basics",
      label: "Basics",
      subtext: `${formData.duration} mins`,
      icon: Link2,
    },
    {
      id: "availability",
      label: "Availability",
      subtext: "Working hours",
      icon: FiCalendar,
    },
    {
      id: "limits",
      label: "Limits",
      subtext: "How often you can be booked",
      icon: FiClock,
    },
    {
      id: "advanced",
      label: "Advanced",
      subtext: "Calendar settings & more...",
      icon: FiSettings,
    },
    {
      id: "recurring",
      label: "Recurring",
      subtext: "Set up a repeating schedule",
      icon: FiRepeat,
    },
    { id: "apps", label: "Apps", subtext: "0 apps, 0 active", icon: FiGrid },
    { id: "workflows", label: "Workflows", subtext: "0 active", icon: FiZap },
    { id: "webhooks", label: "Webhooks", subtext: "0 active", icon: FiLink },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Top Header Bar */}
      <div className="fixed top-0 left-80 right-0 bg-white border-b border-gray-200 px-8 py-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            {formData.title || "New Event Type"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {!formData.is_visible && (
              <span className="text-sm text-gray-600">Hidden</span>
            )}
            <button
              onClick={() =>
                setFormData({ ...formData, is_visible: !formData.is_visible })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_visible ? "bg-black" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_visible ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/${formData.user_slug}/${formData.slug}`;
              window.open(url, "_blank");
            }}
            className="text-gray-500 hover:text-black"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/${formData.user_slug}/${formData.slug}`;
              navigator.clipboard.writeText(url);
            }}
            className="text-gray-500 hover:text-black"
            title="Copy link"
          >
            <Link2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const embedCode = `<iframe src="${window.location.origin}/${formData.user_slug}/${formData.slug}" width="100%" height="600" frameborder="0"></iframe>`;
              navigator.clipboard.writeText(embedCode);
              alert("Embed code copied to clipboard!");
            }}
            className="text-gray-500 hover:text-black"
            title="Copy embed code"
          >
            <Code className="w-5 h-5" />
          </button>
          {isEditing && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-500 hover:text-red-600"
              title="Delete event type"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector("form");
              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save"}
            {!saving && <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex w-full mt-16">
        {/* Sidebar Navigation */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-6 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-gray-200 text-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.subtext}</div>
                  </div>
                </div>
                {activeTab === item.id && (
                  <span className="text-gray-400 text-lg">&gt;</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Form Content */}
        <div className="flex-1 p-10 bg-white min-h-[calc(100vh-4rem)] border-l border-gray-200">
          {activeTab === "basics" && (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-5xl ml-8 space-y-7"
            >
              {/* Title */}
              <div className="border border-gray-200 rounded-lg p-7 bg-white">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="30 min meeting"
                />
              </div>

              {/* Description */}
              <div className="border border-gray-200 rounded-lg p-7 bg-white">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Description
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="border-b border-gray-300 px-5 py-4 bg-gray-50 flex gap-3">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-black font-bold text-lg"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-black italic text-lg"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-black"
                    >
                      <Link2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-5 py-4 text-lg focus:outline-none resize-none"
                    placeholder="A quick video meeting."
                  />
                </div>
              </div>

              {/* URL */}
              <div className="border border-gray-200 rounded-lg p-7 bg-white">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  URL
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <span className="px-5 py-4 bg-gray-50 text-gray-600 text-lg border-r border-gray-300">
                    cal.com/{formData.user_slug}/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="flex-1 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="30min"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="border border-gray-200 rounded-lg p-7 bg-gray-50">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Duration
                </label>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
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
                      className="w-24 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-black border-0"
                      placeholder="15"
                    />
                    <span className="px-5 py-4 text-lg text-gray-600 border-l border-gray-300 bg-gray-50">
                      Minutes
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        allow_multiple_durations:
                          !formData.allow_multiple_durations,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.allow_multiple_durations
                        ? "bg-black"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.allow_multiple_durations
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-lg text-gray-700">
                    Allow multiple durations
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="border border-gray-200 rounded-lg p-7 bg-white">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Location
                </label>
                <div className="relative mb-4">
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg pl-14 pr-12 py-4 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="Cal Video">Cal Video (Default)</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="In-person">In-person</option>
                  </select>
                  <Video className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500 pointer-events-none" />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <a
                  href="#"
                  className="text-lg text-gray-500 hover:text-black inline-flex items-center gap-2"
                >
                  Show advanced settings
                  <span className="text-gray-400">▼</span>
                </a>
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-lg text-gray-700 hover:text-black inline-flex items-center gap-2"
                  >
                    <span>+</span> Add a location
                  </button>
                </div>
                <p className="text-base text-gray-500 mt-5">
                  Can't find the right conferencing app? Visit our{" "}
                  <a href="#" className="text-blue-600 underline">
                    App Store
                  </a>
                  .
                </p>
              </div>
            </form>
          )}

          {activeTab !== "basics" && (
            <div className="max-w-2xl py-12 text-center text-gray-500">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings
              coming soon
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDelete();
        }}
        title="Delete event type?"
        description="Anyone who you've shared this link with will no longer be able to book using it."
        confirmText="Delete event type"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default EventTypeForm;
