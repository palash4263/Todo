import { Search } from 'lucide-react';

// Shared by Home and Search: 47px box, #E6E6E6 border, 12px #666 text 20px in, 18px search icon 16px from the right.
export default function SearchBox({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag {...props} className={`flex h-[47px] items-center rounded border border-field bg-white pr-3.5 pl-[19px] text-xs text-hint ${className}`}>
      {children}
      <Search aria-hidden size={22} strokeWidth={1.8} className="ml-auto shrink-0 text-ink" />
    </Tag>
  );
}
