import { cn } from '@/lib/utils';

const categoryColors = {
  'Policy': 'bg-blue-500 text-white',
  'Procedure': 'bg-blue-500 text-white',
  'Compliance': 'bg-pink-500 text-white',
  'Code of Conduct': 'bg-blue-500 text-white',
  'Training': 'bg-green-500 text-white',
  'Template': 'bg-purple-500 text-white',
  'Handbook': 'bg-orange-500 text-white',
  'Form': 'bg-purple-500 text-white',
  'Tool': 'bg-gray-500 text-white',
  'Reference': 'bg-gray-500 text-white',
  'Resource': 'bg-gray-500 text-white',
  'Announcement': 'bg-orange-500 text-white',
  'Vision & Mission': 'bg-indigo-500 text-white',
  'About Us': 'bg-indigo-500 text-white',
  'Event': 'bg-yellow-500 text-white',
  'General': 'bg-gray-500 text-white',
  // Content type fallbacks
  'link': 'bg-indigo-500 text-white',
  'file': 'bg-blue-500 text-white',
  'pdf': 'bg-red-500 text-white',
  'doc': 'bg-blue-600 text-white',
  'png': 'bg-green-500 text-white',
  'jpg': 'bg-green-500 text-white',
};

export const CategoryBadge = ({ category, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-base font-semibold',
        categoryColors[category] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {category}
    </span>
  );
};

export default CategoryBadge;

