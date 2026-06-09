// Map the machine's collected answers + transcript into a row for the
// `leads` table. Keeping this separate means the insert payload is defined in
// one place and is easy to keep in sync with schema.sql.

export function buildLead(state) {
  const { answers, messages } = state
  return {
    name: answers.name ?? null,
    email: answers.email ?? null,
    company: answers.company ?? null,
    company_size: answers.company_size ?? null,
    interest: answers.interest ?? null,
    urgency: answers.urgency ?? null,
    message: answers.message ?? null,
    // Store the full conversation for context in /admin.
    transcript: messages.map(({ role, text }) => ({ role, text })),
    source: 'chatbot',
  }
}
