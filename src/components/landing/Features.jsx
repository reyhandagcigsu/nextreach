const FEATURES = [
  {
    title: 'Akıllı Lead Yakalama',
    body: 'Kural tabanlı asistan ziyaretçileri nitelikli birer talebe dönüştürür — form doldurma yorgunluğu olmadan.',
    icon: '🎯',
  },
  {
    title: 'Anında Segmentasyon',
    body: 'Şirket büyüklüğü ve ilgi alanına göre gelen talepleri otomatik sınıflandırın.',
    icon: '🧩',
  },
  {
    title: 'Tek Panelden Yönetim',
    body: 'Tüm talepleri /admin panelinde, sohbet dökümleriyle birlikte tek yerde görün.',
    icon: '📊',
  },
]

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold text-slate-900">
        Neden NextReach?
      </h2>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
