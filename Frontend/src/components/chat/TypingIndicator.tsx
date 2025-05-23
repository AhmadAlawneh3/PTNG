
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;
  
  const displayText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  
  return (
    <div className="flex items-center gap-2 text-warm-100/70 text-xs italic pl-2 h-6">
      <Loader2 className="animate-spin h-3 w-3" />
      {displayText}
    </div>
  );
};

export default TypingIndicator;
