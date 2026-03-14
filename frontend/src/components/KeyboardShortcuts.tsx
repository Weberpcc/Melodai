import React, { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onGenerate,
  onDownload,
  isGenerating
}) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Ctrl+Enter or Cmd+Enter to generate
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isGenerating) {
        onGenerate();
      }
    }

    // Ctrl+D or Cmd+D to download
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      onDownload();
    }

    // Escape to close modals/overlays
    if (event.key === 'Escape') {
      const activeModal = document.querySelector('[data-modal]');
      if (activeModal) {
        const closeButton = activeModal.querySelector('[data-close]') as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }, [onGenerate, onDownload, isGenerating]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;