import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, EyeOff, ExternalLink, Link2, MoreVertical, Clock, Edit, Copy, Code, Trash2 } from 'lucide-react';
import apiClient from '../config/axios';
import AddEventTypeModal from '../components/AddEventTypeModal';
import ConfirmModal from '../components/ConfirmModal';

function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null });
  const dropdownRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await apiClient.get('/api/event-types');
      setEventTypes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event types:', error);
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id, currentVisibility) => {
    try {
      const response = await apiClient.put(`/api/event-types/${id}`, {
        is_visible: !currentVisibility,
      });
      setEventTypes(eventTypes.map(et => et.id === id ? response.data : et));
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const filteredEventTypes = eventTypes.filter(et =>
    et.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    et.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFullUrl = (slug, userSlug) => {
    const baseUrl = window.location.origin;
    const userSegment = userSlug || 'user';
    return `${baseUrl}/${userSegment}/${slug}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleEventTypeCreated = () => {
    fetchEventTypes(); // Refresh the list
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && dropdownRefs.current[openDropdownId]) {
        if (!dropdownRefs.current[openDropdownId].contains(event.target)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/event-types/${id}`);
      fetchEventTypes(); // Refresh the list
      setOpenDropdownId(null);
      setDeleteModalState({ isOpen: false, id: null });
    } catch (error) {
      console.error('Error deleting event type:', error);
      alert('Failed to delete event type');
    }
  };

  const handleDuplicate = async (eventType) => {
    try {
      const duplicateData = {
        ...eventType,
        title: `${eventType.title} (Copy)`,
        slug: `${eventType.slug}-copy`,
      };
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      await apiClient.post('/api/event-types', duplicateData);
      fetchEventTypes(); // Refresh the list
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error duplicating event type:', error);
      alert(error.response?.data?.error || 'Failed to duplicate event type');
    }
  };

  const handleEmbed = (eventType) => {
    const embedCode = `<iframe src="${getFullUrl(eventType.slug, eventType.user_slug)}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
    setOpenDropdownId(null);
  };

  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Event types</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure different events for people to book on your calendar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Event Types List */}
      <div className="space-y-3">
        {filteredEventTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No event types found' : 'No event types yet. Create your first one!'}
          </div>
        ) : (
          filteredEventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Left Side - Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{eventType.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {getFullUrl(eventType.slug, eventType.user_slug)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {eventType.duration}m
                    </span>
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {!eventType.is_visible && (
                      <span className="text-xs text-gray-500">Hidden</span>
                    )}
                    <button
                      onClick={() => handleToggleVisibility(eventType.id, eventType.is_visible)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        eventType.is_visible ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          eventType.is_visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getFullUrl(eventType.slug, eventType.user_slug))}
                    className="text-gray-500 hover:text-black transition-colors"
                    title="Copy link"
                  >
                    <Link2 className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/event-types/${eventType.id}/edit`}
                    className="text-gray-500 hover:text-black transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <div className="relative" ref={(el) => (dropdownRefs.current[eventType.id] = el)}>
                    <button
                      onClick={() => toggleDropdown(eventType.id)}
                      className={`text-gray-500 hover:text-black transition-colors ${
                        openDropdownId === eventType.id ? 'text-black' : ''
                      }`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openDropdownId === eventType.id && (
                      <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                        <button
                          onClick={() => {
                            navigate(`/event-types/${eventType.id}/edit`);
                            setOpenDropdownId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(eventType)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleEmbed(eventType)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Code className="w-4 h-4" />
                          Embed
                        </button>
                        <button
                          onClick={() => {
                            setDeleteModalState({ isOpen: true, id: eventType.id });
                            setOpenDropdownId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Type Modal */}
      <AddEventTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEventTypeCreated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(deleteModalState.id)}
        title="Delete event type?"
        description="Anyone who you've shared this link with will no longer be able to book using it."
        confirmText="Delete event type"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default Dashboard;
