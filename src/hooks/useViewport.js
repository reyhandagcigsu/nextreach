import { useState, useEffect } from 'react'

// Tracks the *visual* viewport (what's actually visible) so the chat widget can
// stay above the on-screen keyboard on mobile. The mobile keyboard shrinks the
// visual viewport but NOT the layout viewport, so `vh`/`fixed bottom` anchor
// behind the keyboard. visualViewport gives us the real visible area + how much
// the keyboard is covering (offsetBottom).
function read() {
  if (typeof window === 'undefined') return { height: 800, offsetBottom: 0 }
  const vv = window.visualViewport
  if (vv) {
    return {
      height: vv.height,
      offsetBottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
    }
  }
  return { height: window.innerHeight, offsetBottom: 0 }
}

export function useViewport() {
  // Lazy initializer (no synchronous setState in the effect → no cascade).
  const [vp, setVp] = useState(read)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onChange = () => setVp(read())
    vv.addEventListener('resize', onChange)
    vv.addEventListener('scroll', onChange)
    return () => {
      vv.removeEventListener('resize', onChange)
      vv.removeEventListener('scroll', onChange)
    }
  }, [])

  return vp
}
