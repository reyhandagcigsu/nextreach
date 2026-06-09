export default function MessageBubble({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap',
          isBot
            ? 'bg-slate-100 text-slate-800 rounded-bl-sm'
            : 'bg-indigo-600 text-white rounded-br-sm',
        ].join(' ')}
      >
        {text}
      </div>
    </div>
  )
}
