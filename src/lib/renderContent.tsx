import React from 'react';

// @mention ve #hashtag'leri renkli/tıklanabilir render eder
export function renderContent(text: string): React.ReactNode {
  const parts = text.split(/(@\w+|#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span key={i} className="font-semibold" style={{ color: '#ff6b2b' }}>
          {part}
        </span>
      );
    }
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span key={i} className="font-semibold" style={{ color: '#a855f7' }}>
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
