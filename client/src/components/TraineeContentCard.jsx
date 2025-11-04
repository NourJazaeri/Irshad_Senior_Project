import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, LayoutTemplate, Link } from 'lucide-react';
import CategoryBadge from './CategoryBadge';

const TraineeContentCard = ({ content, onContentSelect, traineeInfo }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Determine content status based on progress and deadline
  const getContentStatus = () => {
    // Check if already completed (highest priority)
    if (content.progress?.status === 'completed') {
      return { status: 'Completed', color: 'bg-green-100 text-green-700 border border-green-200' };
    }

    // Check deadline-based statuses (priority over in-progress)
    if (content.deadline) {
      const dueDate = new Date(content.deadline);
      const currentDate = new Date();
      const daysDiff = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));

      // Check if overdue (urgent - highest priority after completed)
      if (daysDiff < 0) {
        return { status: 'Overdue', color: 'bg-red-100 text-red-700 border border-red-200' };
      }

      // Check if due soon (urgent - high priority)
      if (daysDiff <= 3 && daysDiff >= 0) {
        return { status: 'Due Soon', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
      }
    }

    // Check if in progress (lower priority than deadline statuses)
    if (content.progress?.status === 'in progress') {
      return { status: 'In Progress', color: 'bg-blue-100 text-blue-700 border border-blue-200' };
    }

    // Default status
    return { status: 'Not Started', color: 'bg-gray-100 text-gray-700 border border-gray-200' };
  };

  // Get icon based on content type - using more appropriate icons
  const getContentIcon = (contentType) => {
    // Template types
    if (contentType === 'template' || ['Template', 'Form'].includes(contentType)) {
      return <LayoutTemplate className="w-8 h-8 text-blue-600" />;
    }
    
    // Link types (including YouTube and external links)
    if (contentType === 'link' || ['Link', 'Resource', 'Reference'].includes(contentType)) {
      return <Link className="w-8 h-8 text-blue-600" />;
    }
    
    // File types (everything else: pdf, doc, images, etc.)
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  // Get the trainee's department name - standardized
  const getTraineeDepartmentName = () => {
    // For consistency, always return the same department name
    // In a real system, this would properly resolve the trainee's actual department
    return 'Human Resources';
  };

  const handleContentClick = () => {
    if (onContentSelect) {
      // Use callback for inline viewing
      onContentSelect(content);
    } else {
      // Fallback to navigation (for other uses of this component)
      navigate(`/trainee/content/${content._id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer min-h-64 flex flex-col hover:border-blue-300"
      onClick={handleContentClick}
    >
      {/* Header with Icon and Badge */}
      <div className="flex items-start justify-between mb-4">
        {getContentIcon(content.contentType || content.type)}
        <CategoryBadge category={content.category || content.contentType || content.type || 'General'} />
      </div>

      {/* Title */}
      <h3 
        className="text-xl font-bold text-gray-900 mb-3 leading-tight hover:text-blue-600 transition-colors"
        title={content.title}
      >
        {content.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1 leading-relaxed">
        {content.description || 'Complete guide to company policies, benefits, and workplace culture'}
      </p>

      {/* Due Date and Assignment Info */}
      <div className="mt-auto">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Calendar className="w-4 h-4" />
          <span>Due: {formatDate(content.deadline)}</span>
        </div>
      </div>

      {/* End of assignment info */}
    </div>
  );
};

export default TraineeContentCard;