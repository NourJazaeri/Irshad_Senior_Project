import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddContentModal from '../components/AddContentModal';
import ContentCard from '../components/ContentCard';
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
    <div className="p-8">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">All Content</h2>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-hover shadow-soft text-base font-semibold px-6 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Content
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-lg text-muted-foreground font-medium">Loading content...</p>
        </div>
      ) : contentList.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed border-border">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No content yet</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Get started by adding your first piece of content.
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="text-base font-semibold px-6 py-3">
            <Plus className="w-5 h-5 mr-2" />
            Add Content
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentList.map(content => (
            <ContentCard
              key={content._id}
              content={content}
              onClick={handleContentClick}
            />
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
