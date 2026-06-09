import ChatWindow from './ChatWindow.jsx'
import { useViewport } from '../../hooks/useViewport.js'

// Floating launcher in the bottom-right corner. Controlled by the parent so
// that other CTAs on the page (e.g. the hero "Bize Ulaşın" button) can open
// the same chat. ChatWindow mounts only when open, so each open starts fresh.
export default function ChatWidget({ open, onToggle }) {
  const { height, offsetBottom } = useViewport()

  // `height` is already the *visible* area (above the keyboard). Since we also
  // lift the whole widget by offsetBottom (below), the space the window can use
  // is that visible height minus the launcher + gaps + a little top breathing
  // room. On desktop height = full window, so this stays large (→ 32rem cap).
  const availableHeight = height - 96

  return (
    <div
      className="fixed right-5 z-50 flex flex-col items-end gap-3"
      // Lift the whole widget above the on-screen keyboard when it's open.
      style={{ bottom: `calc(1.25rem + ${offsetBottom}px)` }}
    >
      {open && <ChatWindow maxHeight={availableHeight} />}

      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Sohbeti kapat' : 'Sohbeti aç'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
