import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Building, 
  FileText,
  LayoutTemplate,
  X,
  Link,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import AddContentModal from '../components/AddContentModal';

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/api/content/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContent(data && data.content ? data.content : data);
          
          // Fetch departments if content has assigned departments
          if ((data && data.content ? data.content : data).assignedTo_depID && (data && data.content ? data.content : data).assignedTo_depID.length > 0) {
            fetchDepartments();
          }
        } else {
          console.error('Failed to fetch content');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id]);

  // Fetch departments
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Get department names for assigned departments
  const getAssignedDepartmentNames = () => {
    if (!content.assignedTo_depID || content.assignedTo_depID.length === 0) {
      return [];
    }
    
    return content.assignedTo_depID.map(depId => {
      // Handle ObjectId conversion more robustly
      let depIdStr;
      if (typeof depId === 'object' && depId._id) {
        depIdStr = depId._id.toString();
      } else if (typeof depId === 'object' && depId.$oid) {
        depIdStr = depId.$oid;
      } else {
        depIdStr = depId.toString();
      }
      
      const department = departments.find(dept => {
        const deptIdStr = dept._id.toString();
        return deptIdStr === depIdStr;
      });
      
      return department ? department.departmentName : `Department ${depIdStr}`;
    });
  };

  // Get icon based on content type - 3 types only
  const getContentIcon = (contentType) => {
    // Template types
    if (contentType === 'template' || ['Template', 'Form'].includes(contentType)) {
      return <LayoutTemplate className="w-8 h-8 text-primary" />;
    }
    
    // Link types (including YouTube and external links)
    if (contentType === 'link' || ['Link', 'Resource', 'Reference'].includes(contentType)) {
      return <Link className="w-8 h-8 text-primary" />;
    }
    
    // File types (everything else: pdf, doc, images, etc.)
    return <FileText className="w-8 h-8 text-primary" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewContent = () => {
    navigate(`/admin/content/${id}/view`);
  };

  const handleEditContent = () => {
    console.log('🔄 Opening edit modal for content:', content);
    console.log('🔄 Content ID:', content?._id);
    console.log('🔄 Content title:', content?.title);
    setShowEditModal(true);
  };

  const handleDeleteContent = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Content deleted successfully!');
        navigate('/admin/content');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert(`Error: ${error.message || 'Failed to delete content. Please try again.'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleContentUpdated = (updatedContent) => {
    console.log('🔄 Content updated, refreshing details:', updatedContent);
    setContent(updatedContent);
    setShowEditModal(false);
    
    // Refresh the content details to get the latest data
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/api/content/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContent(data && data.content ? data.content : data);
        }
      } catch (error) {
        console.error('Error refreshing content:', error);
      }
    };

    fetchContent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Content not found</p>
        <Button onClick={() => navigate('/admin/content')} className="mt-4">
          Back to Content Library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/content')}
          className="flex items-center gap-2 text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Content Library
        </Button>
      </div>

      {/* Content Header */}
      <div className="bg-card rounded-xl border border-border p-12 mb-8 shadow-card">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-5xl font-bold text-foreground leading-tight">
              {content.title}
            </h1>
            <CategoryBadge category={content.category || content.contentType || content.type || 'General'} />
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleViewContent}
              className="bg-primary hover:bg-primary-hover shadow-soft text-lg px-6 py-3"
            >
              <FileText className="w-5 h-5 mr-2" />
              View Content
            </Button>
            <Button
              onClick={handleEditContent}
              variant="outline"
              className="text-lg px-6 py-3 border-2 hover:bg-gray-50"
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="text-lg px-6 py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        {content.description && (
          <p className="text-2xl text-muted-foreground leading-relaxed">
            {content.description}
          </p>
        )}
      </div>

      {/* Content Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category and Type */}
        <div className="bg-card rounded-xl border border-border p-10 shadow-card hover:shadow-elevated transition-smooth">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            Category & Type
          </h3>
          <div className="ml-18 space-y-6">
            <div>
              <p className="text-lg font-medium text-muted-foreground mb-3">Category</p>
              <CategoryBadge category={content.category || content.contentType || content.type || 'General'} />
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground mb-3">Content Type</p>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-secondary text-secondary-foreground">
                {content.contentType || content.type || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="bg-card rounded-xl border border-border p-10 shadow-card hover:shadow-elevated transition-smooth">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            Deadline
          </h3>
          <div className="ml-18">
            <p className="text-2xl font-semibold text-foreground">
              {formatDate(content.deadline)}
            </p>
          </div>
        </div>

        {/* Acknowledgment Required */}
        <div className="bg-card rounded-xl border border-border p-10 shadow-card hover:shadow-elevated transition-smooth">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            Acknowledgment Required
          </h3>
          <div className="ml-18">
            <div className="flex items-center gap-6">
              {content.ackRequired ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-2xl font-semibold text-green-700">Yes, Required</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <X className="w-8 h-8 text-gray-500" />
                  </div>
                  <span className="text-2xl font-semibold text-muted-foreground">Not Required</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Departments */}
        <div className="bg-card rounded-xl border border-border p-10 shadow-card hover:shadow-elevated transition-smooth">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            Assigned To
          </h3>
          <div className="ml-18">
            {loadingDepartments ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-muted-foreground">Loading departments...</span>
              </div>
            ) : content.assignedTo_depID && content.assignedTo_depID.length > 0 ? (
              <div>
                <p className="text-2xl font-semibold text-foreground mb-4">
                  {getAssignedDepartmentNames().length} Department(s)
                </p>
                <div className="space-y-3">
                  {getAssignedDepartmentNames().map((deptName, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-lg text-foreground font-medium">{deptName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-muted-foreground">
                Not Assigned
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AddContentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onContentAdded={handleContentUpdated}
        editMode={true}
        editContent={content}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-elevated">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Delete Content</h3>
                <p className="text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-lg text-foreground mb-2">
                Are you sure you want to delete <strong>"{content.title}"</strong>?
              </p>
              <p className="text-muted-foreground">
                This will permanently remove the content and all associated data.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 text-lg py-3"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteContent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;