// ---------------------------------------------------------------------------
// flowConfig — the rule-based chat flow as DATA.
//
// The conversation is a finite state machine. Each state describes:
//   - what the bot says on entry (botMessages)
//   - how the user responds (inputType: 'options' | 'text' | 'none')
//   - where their answer is stored (saveAs) and how it's validated (validate)
//   - which state comes next (per-option `next`, or the state's `next`)
//
// Changing the conversation = editing this file. The engine (chatMachine.js)
// is generic and never needs to change.
// ---------------------------------------------------------------------------

export const INITIAL_STATE = 'GREETING'

// States that end the conversation (no further input expected).
export const TERMINAL_STATES = ['THANK_YOU', 'END_BROWSE']

export const flow = {
  GREETING: {
    id: 'GREETING',
    botMessages: [
      'Merhaba! 👋 Ben NextReach asistanı.',
      'Size en uygun planı bulmak için birkaç kısa soru sorabilir miyim?',
    ],
    inputType: 'options',
    options: [
      { label: 'Evet, başlayalım', value: 'start', next: 'ASK_NAME' },
      { label: 'Sadece bakıyorum', value: 'browsing', next: 'JUST_LOOKING' },
    ],
  },

  JUST_LOOKING: {
    id: 'JUST_LOOKING',
    botMessages: [
      'Tabii, keşfetmekten çekinmeyin! 🙂',
      'Hazır olduğunuzda, ekibimizin sizinle iletişime geçmesi için bilgilerinizi bırakabilirsiniz.',
    ],
    inputType: 'options',
    options: [
      { label: 'Bilgilerimi bırakayım', value: 'optin', next: 'ASK_NAME' },
      { label: 'Şimdilik kapat', value: 'close', next: 'END_BROWSE' },
    ],
  },

  ASK_NAME: {
    id: 'ASK_NAME',
    botMessages: ['Harika! Önce adınızı öğrenebilir miyim?'],
    inputType: 'text',
    placeholder: 'Adınız',
    saveAs: 'name',
    validate: 'required',
    next: 'ASK_EMAIL',
  },

  ASK_EMAIL: {
    id: 'ASK_EMAIL',
    // ${name} is interpolated by the engine from collected answers.
    botMessages: ['Memnun oldum ${name}! Size nasıl ulaşabiliriz? (iş e-postanız)'],
    inputType: 'text',
    placeholder: 'ad@sirket.com',
    saveAs: 'email',
    validate: 'email',
    next: 'ASK_COMPANY',
  },

  ASK_COMPANY: {
    id: 'ASK_COMPANY',
    botMessages: ['Hangi şirkette çalışıyorsunuz?'],
    inputType: 'text',
    placeholder: 'Şirket adı',
    saveAs: 'company',
    validate: 'none',
    optional: true,
    next: 'ASK_COMPANY_SIZE',
  },

  ASK_COMPANY_SIZE: {
    id: 'ASK_COMPANY_SIZE',
    botMessages: ['Ekibiniz yaklaşık kaç kişi?'],
    inputType: 'options',
    saveAs: 'company_size',
    optional: true,
    next: 'ASK_INTEREST',
    options: [
      { label: '1–10', value: '1-10' },
      { label: '11–50', value: '11-50' },
      { label: '51–200', value: '51-200' },
      { label: '200+', value: '200+' },
    ],
  },

  ASK_INTEREST: {
    id: 'ASK_INTEREST',
    botMessages: ['NextReach’i en çok hangi alanda kullanmayı düşünüyorsunuz?'],
    inputType: 'options',
    saveAs: 'interest',
    optional: true,
    next: 'ASK_URGENCY',
    options: [
      { label: 'Satış', value: 'sales' },
      { label: 'Pazarlama', value: 'marketing' },
      { label: 'Müşteri Desteği', value: 'support' },
      { label: 'Diğer', value: 'other' },
    ],
  },

  // "acil mi?" — the single most useful signal for sales to prioritize a lead.
  ASK_URGENCY: {
    id: 'ASK_URGENCY',
    botMessages: ['Bu konuda ne kadar acelesi var?'],
    inputType: 'options',
    saveAs: 'urgency',
    optional: true,
    next: 'ASK_MESSAGE',
    options: [
      { label: 'Acil — bu hafta', value: 'high' },
      { label: 'Bu çeyrek içinde', value: 'medium' },
      { label: 'Sadece araştırıyorum', value: 'low' },
    ],
  },

  // Free-text: lets the visitor say what they actually want (e.g. "fiyat?"),
  // which is exactly the "neden ulaşmış" context sales was missing. Optional —
  // the visitor can skip if they'd rather not type.
  ASK_MESSAGE: {
    id: 'ASK_MESSAGE',
    botMessages: [
      'Son olarak, sormak istediğiniz bir şey veya kısa bir not eklemek ister misiniz? (isteğe bağlı)',
    ],
    inputType: 'text',
    placeholder: 'Örn. fiyatlandırma hakkında bilgi almak istiyorum…',
    saveAs: 'message',
    validate: 'none',
    optional: true,
    next: 'SUBMIT',
  },

  // Side-effect state: the hook performs the Supabase insert when it sees this
  // state, then dispatches SUBMIT_SUCCESS or SUBMIT_ERROR.
  SUBMIT: {
    id: 'SUBMIT',
    botMessages: ['Teşekkürler, bilgilerinizi kaydediyorum… ⏳'],
    inputType: 'none',
    isSubmit: true,
  },

  THANK_YOU: {
    id: 'THANK_YOU',
    botMessages: [
      'Hepsi bu kadar! 🎉 Talebiniz bize ulaştı.',
      'Ekibimiz en kısa sürede ${name} olarak sizinle iletişime geçecek. İyi günler!',
    ],
    inputType: 'none',
    isTerminal: true,
  },

  END_BROWSE: {
    id: 'END_BROWSE',
    botMessages: ['Görüşmek üzere! İhtiyacınız olduğunda buradayım. 👋'],
    inputType: 'none',
    isTerminal: true,
  },
}
