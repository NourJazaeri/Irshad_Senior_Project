import {
  FileText,
  Calendar,
  LayoutTemplate,
  Link
} from 'lucide-react';
import CategoryBadge from './CategoryBadge';

const ContentCard = ({ content, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  return (
    <div
      className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-elevated transition-smooth cursor-pointer h-64 flex flex-col"
      onClick={() => onClick?.(content)}
    >
      {/* Header with Icon and Badge */}
      <div className="flex items-start justify-between mb-4">
        {getContentIcon(content.contentType || content.type)}
        <CategoryBadge category={content.category || content.contentType || content.type || 'General'} />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-foreground mb-4 line-clamp-2 leading-tight">
        {content.title}
      </h3>

      {/* Description */}
      <p className="text-base text-muted-foreground mb-5 line-clamp-3 flex-1 leading-relaxed">
        {content.description || 'No description provided'}
      </p>

      {/* Due Date */}
      <div className="flex items-center gap-2 text-base text-muted-foreground font-medium">
        <Calendar className="w-5 h-5" />
        <span>Due: {formatDate(content.deadline)}</span>
      </div>
    </div>
  );
};

export default ContentCard;
