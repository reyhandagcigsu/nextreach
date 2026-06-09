export default function Hero({ onContact }) {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          B2B Lead Generation
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Doğru müşterilere <span className="text-indigo-600">daha hızlı</span> ulaşın
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          NextReach, satış ekibinizin nitelikli potansiyel müşterileri saniyeler
          içinde yakalamasını sağlar. Soğuk listelerle değil, gerçek taleplerle
          çalışın.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onContact}
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Bize Ulaşın
          </button>
          <a
            href="#features"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Nasıl çalışır?
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Form yok — asistanımız birkaç saniyede sizi doğru kişiye yönlendirir.
        </p>
      </div>
    </section>
  )
}
