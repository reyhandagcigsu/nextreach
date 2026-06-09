// ---------------------------------------------------------------------------
// chatMachine — the generic finite-state-machine ENGINE.
//
// This is a pure reducer: (state, event) -> newState. It has no knowledge of
// React, the DOM, or Supabase. Side effects (the actual lead insert) live in
// the hook layer; the machine only signals *when* a submit should happen via
// state.status === 'submitting' on the SUBMIT state.
//
// Because it's pure and data-driven (flowConfig.js), the whole conversation
// can be exercised in unit tests without rendering anything.
// ---------------------------------------------------------------------------

import { flow, INITIAL_STATE } from './flowConfig.js'
import { validate } from './validators.js'

// Replace ${key} tokens in bot copy with collected answers.
function interpolate(text, answers) {
  return text.replace(/\$\{(\w+)\}/g, (_, key) => answers[key] ?? '')
}

function makeMessages(stateId, answers, startId) {
  const def = flow[stateId]
  if (!def?.botMessages) return []
  return def.botMessages.map((text, i) => ({
    id: startId + i,
    role: 'bot',
    text: interpolate(text, answers),
  }))
}

// Status derived from the state we're entering.
function statusFor(def) {
  if (def.isSubmit) return 'submitting'
  if (def.isTerminal) return 'done'
  return 'active'
}

// Enter `nextId`: append its bot messages and update bookkeeping.
function enterState(state, nextId) {
  const def = flow[nextId]
  const botMsgs = makeMessages(nextId, state.answers, state.msgCounter)
  return {
    ...state,
    currentStateId: nextId,
    messages: [...state.messages, ...botMsgs],
    msgCounter: state.msgCounter + botMsgs.length,
    status: statusFor(def),
    error: null,
    submitError: null,
  }
}

export function createInitialState() {
  const base = {
    currentStateId: INITIAL_STATE,
    answers: {},
    messages: [],
    msgCounter: 0,
    status: 'active',
    error: null,
    submitError: null,
  }
  // Seed the greeting messages.
  return enterState({ ...base, currentStateId: null }, INITIAL_STATE)
}

// Skip an optional step: echo a friendly note, store null, advance.
function skipStep(state, def) {
  let next = pushUserMessage({ ...state, error: null }, 'Şimdilik geçmek istiyorum')
  if (def.saveAs) {
    next = { ...next, answers: { ...next.answers, [def.saveAs]: null } }
  }
  return enterState(next, def.next)
}

function pushUserMessage(state, text) {
  return {
    ...state,
    messages: [...state.messages, { id: state.msgCounter, role: 'user', text }],
    msgCounter: state.msgCounter + 1,
  }
}

export function chatReducer(state, event) {
  const current = flow[state.currentStateId]

  switch (event.type) {
    case 'SELECT_OPTION': {
      if (current.inputType !== 'options') return state
      const option = current.options?.find((o) => o.value === event.value)
      if (!option) return state

      let next = pushUserMessage(state, option.label)
      if (current.saveAs) {
        next = { ...next, answers: { ...next.answers, [current.saveAs]: option.value } }
      }
      const nextId = option.next ?? current.next
      return enterState(next, nextId)
    }

    case 'SUBMIT_TEXT': {
      if (current.inputType !== 'text') return state
      const value = (event.value ?? '').trim()
      // An empty submit on an optional step behaves like a skip.
      if (!value && current.optional) {
        return skipStep(state, current)
      }
      const result = validate(current.validate, value)
      if (!result.valid) {
        return { ...state, error: result.error }
      }
      let next = pushUserMessage({ ...state, error: null }, value)
      if (current.saveAs) {
        next = { ...next, answers: { ...next.answers, [current.saveAs]: value } }
      }
      return enterState(next, current.next)
    }

    // Visitor chose not to answer an optional question. We don't trap them:
    // record null and move on.
    case 'SKIP_STEP': {
      if (!current.optional) return state
      return skipStep(state, current)
    }

    // Dispatched by the hook once the Supabase insert resolves.
    case 'SUBMIT_SUCCESS':
      return enterState(state, 'THANK_YOU')

    case 'SUBMIT_ERROR':
      return {
        ...state,
        status: 'submit_error',
        submitError:
          event.error ?? 'Talebiniz gönderilemedi. Lütfen tekrar deneyin.',
      }

    // User pressed "retry" after a failed submit.
    case 'RETRY_SUBMIT':
      return { ...state, status: 'submitting', submitError: null }

    case 'RESTART':
      return createInitialState()

    default:
      return state
  }
}

// Convenience selector for the UI / hook.
export function getCurrentDef(state) {
  return flow[state.currentStateId]
}
