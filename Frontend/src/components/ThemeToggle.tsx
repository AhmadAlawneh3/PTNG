
import React from 'react';

export function ThemeToggle() {
  // Initialize theme on component mount
  React.useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return null; // No toggle button to render
}
