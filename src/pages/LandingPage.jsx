import { useState } from 'react'
import Hero from '../components/landing/Hero.jsx'
import Features from '../components/landing/Features.jsx'
import Footer from '../components/landing/Footer.jsx'
import ChatWidget from '../components/chatbot/ChatWidget.jsx'

export default function LandingPage() {
  // Chat open state lives here so both the floating widget and the hero
  // "Bize Ulaşın" CTA control the same conversation.
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <Hero onContact={() => setChatOpen(true)} />
      <Features />
      <Footer />

      {/* Rule-based lead-capture chatbot, embedded site-wide. */}
      <ChatWidget open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
    </div>
  )
}
