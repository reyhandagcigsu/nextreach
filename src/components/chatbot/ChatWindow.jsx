import { useEffect, useRef } from 'react'
import { useChatMachine } from '../../hooks/useChatMachine.js'
import MessageBubble from './MessageBubble.jsx'
import OptionButtons from './OptionButtons.jsx'
import TextInput from './TextInput.jsx'

export default function ChatWindow({ maxHeight }) {
  // Honeypot field: hidden from real users, irresistible to dumb bots. If it
  // ends up filled, useChatMachine drops the submit.
  const honeypotRef = useRef(null)

  const {
    messages,
    error,
    submitError,
    status,
    def,
    selectOption,
    submitText,
    skip,
    retry,
    restart,
  } = useChatMachine({ isSpam: () => !!honeypotRef.current?.value })

  // Keep the conversation pinned to the latest message. We scroll the list
  // container's own scrollTop (not scrollIntoView) so we never jump the whole
  // page on mobile. `maxHeight` is in the deps so that when the keyboard opens
  // or closes and the window resizes, we re-pin to the bottom instead of
  // leaving the user stranded mid-thread.
  const listRef = useRef(null)
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, status, maxHeight])

  const isBusy = status === 'submitting'

  function renderInput() {
    if (status === 'submitting') {
      return <p className="text-center text-xs text-slate-400">Gönderiliyor…</p>
    }
    if (status === 'submit_error') {
      return (
        <div className="space-y-2 text-center">
          <p className="text-xs text-red-500">{submitError}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Tekrar dene
          </button>
        </div>
      )
    }
    if (status === 'done') {
      return (
        <button
          type="button"
          onClick={restart}
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Yeniden başla
        </button>
      )
    }
    // active
    if (def.inputType === 'options') {
      return (
        <div className="space-y-2">
          <OptionButtons options={def.options} onSelect={selectOption} disabled={isBusy} />
          {def.optional && (
            <button
              type="button"
              onClick={skip}
              disabled={isBusy}
              className="px-1 text-xs text-slate-400 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Belirtmek istemiyorum
            </button>
          )}
        </div>
      )
    }
    if (def.inputType === 'text') {
      return (
        <TextInput
          placeholder={def.placeholder}
          error={error}
          optional={def.optional}
          onSubmit={submitText}
          onSkip={skip}
          disabled={isBusy}
        />
      )
    }
    return null
  }

  return (
    <div
      // Height follows the visible viewport so the input never hides behind the
      // mobile keyboard; capped at 32rem (512px) on roomy/desktop screens.
      style={{ height: Math.max(240, Math.min(512, maxHeight ?? 512)) }}
      className="flex w-[calc(100vw-2.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 bg-indigo-600 px-4 py-3 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
          NR
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">NextReach Asistanı</p>
          <p className="text-xs text-indigo-100">Genellikle anında yanıt verir</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} />
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white px-3 py-3">{renderInput()}</div>

      {/* Honeypot — visually hidden, off the tab order, not announced to AT. */}
      <input
        ref={honeypotRef}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
    </div>
  )
}
