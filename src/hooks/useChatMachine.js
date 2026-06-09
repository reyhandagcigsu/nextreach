import { useReducer, useEffect, useCallback, useRef } from 'react'
import {
  chatReducer,
  createInitialState,
  getCurrentDef,
} from '../chatbot/chatMachine.js'
import { buildLead } from '../chatbot/leadBuilder.js'
import { supabase } from '../lib/supabaseClient.js'

// Bridges the pure FSM to React and owns the one impure step: writing the
// lead to Supabase. The machine stays side-effect-free; this hook watches for
// status === 'submitting' on the SUBMIT state and performs the insert.
export function useChatMachine({ isSpam } = {}) {
  const [state, dispatch] = useReducer(chatReducer, undefined, createInitialState)

  // Guard so React StrictMode's double-invoke (or a re-render) can't fire the
  // insert twice for the same submit attempt.
  const submittingRef = useRef(false)

  useEffect(() => {
    if (state.status !== 'submitting' || submittingRef.current) return
    submittingRef.current = true

    // Honeypot: if a hidden field was filled, it's almost certainly a bot.
    // Silently pretend success and drop the data — don't tip the bot off.
    if (isSpam?.()) {
      submittingRef.current = false
      dispatch({ type: 'SUBMIT_SUCCESS' })
      return
    }

    let cancelled = false
    ;(async () => {
      const { error } = await supabase.from('leads').insert(buildLead(state))
      if (cancelled) return
      submittingRef.current = false
      if (error) {
        dispatch({ type: 'SUBMIT_ERROR', error: error.message })
      } else {
        dispatch({ type: 'SUBMIT_SUCCESS' })
      }
    })()

    return () => {
      cancelled = true
    }
    // We intentionally key only on status: the insert payload is captured at
    // the moment we enter 'submitting'.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const selectOption = useCallback(
    (value) => dispatch({ type: 'SELECT_OPTION', value }),
    []
  )
  const submitText = useCallback(
    (value) => dispatch({ type: 'SUBMIT_TEXT', value }),
    []
  )
  const skip = useCallback(() => dispatch({ type: 'SKIP_STEP' }), [])
  const retry = useCallback(() => dispatch({ type: 'RETRY_SUBMIT' }), [])
  const restart = useCallback(() => dispatch({ type: 'RESTART' }), [])

  const def = getCurrentDef(state)

  return {
    messages: state.messages,
    answers: state.answers,
    error: state.error,
    submitError: state.submitError,
    status: state.status, // 'active' | 'submitting' | 'submit_error' | 'done'
    def, // current state definition (inputType, options, placeholder...)
    selectOption,
    submitText,
    skip,
    retry,
    restart,
  }
}
