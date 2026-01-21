import React, { useRef, useState, useEffect } from 'react';
import MusicChat from './MusicChat';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <div>
      {}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 pointer-events-auto">
        {open && (
          <div className="mb-2 w-80 max-w-[90vw] sm:w-96">
            <div className="bg-zinc-900/80 text-white rounded-lg shadow-lg p-2 backdrop-blur-sm">
              <MusicChat ref={inputRef} />
            </div>
          </div>
        )}

        <button
          aria-label="Open music chat"
          onClick={() => setOpen(s => !s)}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-lg flex items-center justify-center text-white focus:outline-none"
        >
          {}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.886L3 20l1.22-3.66A7.966 7.966 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
