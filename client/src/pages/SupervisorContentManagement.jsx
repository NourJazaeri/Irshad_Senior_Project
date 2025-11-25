import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, BookOpen } from 'lucide-react';
import AddContentModal from '../components/AddContentModal';
import ContentCard from '../components/ContentCard';
import '../styles/supervisor.css';
// Use the same UI as admin content management

const SupervisorContentManagement = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchContent();
  }, []);

  // Clear content when component unmounts (e.g., when supervisor logs out)
  useEffect(() => {
    return () => {
      setContentList([]);
    };
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch content - backend will automatically filter by supervisor role
      const response = await fetch(`${API_BASE}/api/content/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContentList(data);
      } else {
        console.error('Error fetching content:', response.status);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentAdded = (newContent) => {
    // Refresh the content list after adding new content
    fetchContent();
  };

  const handleContentClick = (content) => {
    navigate(`/supervisor/content/${content._id}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>All Content</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover shadow-soft text-base font-semibold px-6 py-3 relative overflow-hidden group"
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
          }}
        >
          <Plus className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
          Add New Content
        </Button>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="sv-card sv-card-muted sv-loading-state" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="sv-spinner"></div>
          <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '15px' }}>Loading content...</div>
        </div>
      ) : contentList.length === 0 ? (
        <div className="sv-card sv-card-muted sv-empty-state" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="sv-empty-icon">
            <BookOpen size={48} />
          </div>
          <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>No content yet</div>
          <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
            Get started by adding your first piece of content.
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover shadow-soft text-base font-semibold px-6 py-3">
            <Plus className="w-5 h-5 mr-2" />
            Add Content
          </Button>
        </div>
      ) : (
        <div className="sv-groups-grid">
          {contentList.map((content, index) => (
            <div
              key={content._id}
              className="sv-group-card-enhanced"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animation: 'fadeInUp 0.5s ease-out forwards',
                opacity: 0,
                border: 'none',
                borderRadius: '14px',
                overflow: 'hidden'
              }}
            >
              <ContentCard
                content={content}
                onClick={handleContentClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContentAdded={handleContentAdded}
      />
    </div>
  );
};

export default SupervisorContentManagement;
