# NextReach

B2B SaaS landing page'ine gömülü, **kural tabanlı (rule-based) bir chatbot** ile
lead (talep) toplayan ve bunları **`/admin`** ekranında listeleyen küçük bir uygulama.

- **Frontend:** React (Vite) + Tailwind CSS v4
- **Veritabanı / API:** Supabase (özel backend yok)
- **Kapsam dışı:** kimlik doğrulama (auth) ve e-posta entegrasyonu

---

## 1. Kurulum

### a) Bağımlılıklar
```bash
npm install
```

### b) Supabase projesi & tablo
1. [supabase.com](https://supabase.com) üzerinde bir proje oluşturun.
2. **SQL Editor → New query**'de [`supabase/schema.sql`](supabase/schema.sql) içeriğini çalıştırın.
   Bu, `leads` tablosunu ve RLS (Row Level Security) politikalarını oluşturur.
   Script idempotent'tir: daha önce eski sürümle tablo oluşturduysanız tekrar çalıştırmak
   eksik kolonları (`urgency`, `message`, `status`, `owner`) ekler, anti-spam doğrulamasını
   ve rate-limit trigger'ını kurar (veriyi silmez).
3. **Project Settings → API**'den **Project URL** ve **anon public** anahtarını kopyalayın.

### c) Ortam değişkenleri
```bash
cp .env.example .env.local
```

| Değişken                  | Açıklama                                              |
| ------------------------- | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase Project URL                                  |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon public anahtarı                         |
| `VITE_ADMIN_PASSWORD`     | `/admin` parola kapısı için parola (güvenlik notuna bakın) |

### d) Çalıştırma
```bash
npm run dev      # http://localhost:5173
npm run build    # production build
npm run lint     # eslint
```

---

## 2. Kullanılan teknolojiler ve neyi nasıl yaptım

### Teknoloji seçimleri ve gerekçesi
- **React + Vite** — chatbot tamamen istemci tarafı, etkileşimli, durum-yoğun bir bileşen;
  React state yönetimi buna doğal oturuyor. Vite, hızlı dev server + sıfır-konfig build verir.
- **Tailwind CSS** — 6 saatlik sınırda ayrı CSS dosyaları yazmadan, tutarlı ve responsive bir
  arayüzü hızlıca kurmak için. Utility sınıfları landing + admin için yeterince esnek.
- **Supabase (Firebase yerine)** — backend yazmadan Postgres + otomatik REST API + RLS veriyor.
  Firebase yerine seçtim çünkü admin'in ihtiyaç duyduğu **filtreleme/sıralama/sorgulama** ilişkisel
  SQL'de çok daha rahat; ayrıca **RLS** ve **`with check` / trigger** ile anti-spam'i veritabanı
  seviyesinde kurabildim (bk. §3.5) — Firestore'da bu kadar net değil.

### Mimarinin özeti
Özel bir backend yazmamak için **Supabase** kullandım: chatbot, lead'i tarayıcıdan
doğrudan `leads` tablosuna `insert` ediyor; `/admin` aynı tablodan okuyor.
Böylece tüm proje tek bir frontend deploy'u olarak çalışıyor.

### Chatbot — Sonlu Durum Makinesi (Finite State Machine)
Kural tabanlı sohbet = "hangi durumdayım → kullanıcı ne dedi → hangi duruma geçip ne
sorarım". Bu birebir bir FSM. Onu **veri** ve **motor** olarak ikiye ayırdım; böylece
akışı değiştirmek = bir config dosyasını düzenlemek oluyor, motor hiç değişmiyor.

| Dosya                          | Görevi                                                              |
| ------------------------------ | ------------------------------------------------------------------- |
| `src/chatbot/flowConfig.js`    | Tüm sohbet **veri olarak**: state'ler, bot mesajları, seçenekler, geçişler. Akışı değiştirmek için burayı düzenleyin. |
| `src/chatbot/chatMachine.js`   | Jenerik, **saf** reducer `(state, event) → newState`. React yok, DB yok → birim testi kolay. |
| `src/chatbot/validators.js`    | Saf doğrulama (e-posta / zorunlu alan).                             |
| `src/chatbot/leadBuilder.js`   | Toplanan cevapları + transcript'i bir `leads` satırına dönüştürür.  |
| `src/hooks/useChatMachine.js`  | FSM'i React'e (`useReducer`) bağlar ve tek yan etkiyi — Supabase insert'ini — yürütür. |

Akış:
```
GREETING → ASK_NAME → ASK_EMAIL → ASK_COMPANY → ASK_COMPANY_SIZE
        → ASK_INTEREST → ASK_URGENCY → ASK_MESSAGE → SUBMIT → THANK_YOU
   └─ "Sadece bakıyorum" → JUST_LOOKING → (kabul → ASK_NAME) | END_BROWSE
```
`ASK_MESSAGE` isteğe bağlıdır — ziyaretçi "Şimdilik geçmek istiyorum" ile atlayabilir.

Motor saf kalır; "kaydetmeye hazır" sinyalini `status === 'submitting'` ile verir,
hook insert'i yapar ve `SUBMIT_SUCCESS` / `SUBMIT_ERROR` (tekrar-dene yolu) dispatch eder.

`leads` satırı şu alanları içerir: `name`, `email`, `company`, `company_size`,
`interest`, `urgency`, `message`, `transcript` (tüm sohbet), `source` ve admin'in
yönettiği `status` (pipeline durumu) + `owner` (lead'i alan kişi).

### Landing page (`/`)
Hero / Features / Footer pazarlama bölümleri. Hero'daki belirgin **"Bize Ulaşın"**
butonu (form yerine) chatbot'u açar; ayrıca sağ altta floating **ChatWidget** her
sayfada hazırdır. Sohbet penceresi mobilde viewport'a sığacak şekilde responsive'tir.

### Admin (`/admin`)
Parola korumalı bir **iş kuyruğu** (salt gösterim değil):
- **Lead skoru** (Sıcak/Ilık/Soğuk) + skora göre varsayılan sıralama
- **Durum yönetimi** — her satırda Yeni / Arandı / İletişimde / Kapandı / Çöp; **sahip**
  (kim aldı) modalde atanır. Değişiklikler Supabase'e optimistic yazılır.
- **Filtreler** — durum, skor, aciliyet + **"Bugün"** + serbest arama
- **Aksiyon** — e-postalar `mailto:` linki, filtrelenmiş listeyi **CSV indir**
- **Ölçek** — fetch en yeni `FETCH_LIMIT` (500) ile sınırlı, tablo client-side **sayfalanır** (25/sayfa)
- **Erişilebilirlik** — satır adı klavyeyle açılır buton; modal `role="dialog"`, Esc ile kapanır, basit focus-trap
- **Responsive** — masaüstünde tablo, mobilde (`sm` altı) her lead bir **kart**; yatay kaydırma derdi yok
- Satıra tıklayınca **modal**: yapılandırılmış özet + serbest mesaj + skor gerekçesi + tam sohbet dökümü

### Proje yapısı
```
src/
├─ pages/         LandingPage, AdminPage
├─ chatbot/       FSM mantığı (flowConfig, chatMachine, validators, leadBuilder)
├─ hooks/         useChatMachine, useLeads
├─ components/
│  ├─ landing/    Hero, Features, Footer
│  ├─ chatbot/    ChatWidget, ChatWindow, MessageBubble, OptionButtons, TextInput
│  └─ admin/      AdminGate, LeadsTable, LeadRow, LeadCard, TranscriptModal
└─ lib/           supabaseClient, leadScore, leadStatus, date
supabase/
└─ schema.sql     leads tablosu + RLS + anti-spam (with check) + rate-limit trigger
```

---

## 3. Tasarım kararları (PRD'de belirtilmeyen, benim çözdüğüm noktalar)

Aşağıdaki kararlar bana bırakılmıştı. Her birinde **şu an kodda ne var** ile
**bir sonraki adımda ne eklerdim**'i ayrı tuttum.

### 3.1 Chatbot ne soruyor, hangi sırayla, ne zaman "yeter" diyor?
**Sıra:** ad → iş e-postası → şirket → ekip boyutu → ilgi alanı → **aciliyet** →
**serbest mesaj (isteğe bağlı)**.
**Gerekçe:** Önce en düşük sürtünmeli alan (ad), hemen ardından **tek kritik alan olan
e-posta** (lead'in özü budur), sonra niteleme alanları. Bilgileri "kolaydan zora /
kişiselden iş bağlamına" sıraladım. Son iki soru doğrudan PRD'deki satış şikayetine cevap:
- **Aciliyet** → satışın eksik dediği "acil mi?" bilgisi; lead'i önceliklendirmenin en
  güçlü tek sinyali.
- **Serbest mesaj** → "neden ulaşmış / ne istiyor" bağlamı (ör. "sadece fiyat sorabilir
  miydim"). İsteğe bağlı tuttum ki yazmak istemeyen takılmasın.

Bütçe gibi ağır sorular bilerek **yok** — ilk temasta değil, gerçek görüşmede sorulmalı;
chatbot'ta sormak bırakma oranını yükseltir.

**"Yeter" noktası: 7 alan (biri opsiyonel).** Satış ekibinin (a) iletişime geçmesi,
(b) önceliklendirmesi ve (c) "neden ulaşmış" bağlamını görmesi için bu kadarı yeterli.
Daha fazla soru = daha çok terk.

**Bilinçli ödünleşim:** Lead'i yalnızca akış tamamlanınca (`SUBMIT`) kaydediyorum;
yarıda kalan sohbetler tabloyu kirletmesin diye yarım kayıt tutmuyorum. Bunun bedeli:
e-postayı verip akışı bırakan birini kaçırıyoruz. Alternatif olarak e-posta alındıktan
sonra kademeli (progressive) kayıt yapılabilirdi — temizlik uğruna bunu tercih etmedim.

### 3.2 Chatbot'un tonu ve kişiliği — NextReach'i nasıl temsil ediyor?
**Ton:** Samimi ama profesyonel, kısa ve net, isimle hitap eden, yer yer hafif emoji
kullanan. Satış baskısı kurmuyor; "yardımcı asistan" duruşunda.
**Neden:** Hedef kitle B2B karar vericisi — zamanı kıymetli. Aşırı resmi bir dil mesafe
koyar, laubali bir dil ciddiyetsiz görünür; ikisinin arasında, hızlı yanıt veren ve
zaman kaybettirmeyen bir marka izlenimi bıraktım. Bot kendini "NextReach asistanı"
olarak tanıtır ve "genellikle anında yanıt verir" mesajıyla markanın hız vaadini yansıtır.

### 3.3 Satış ekibi iyi lead'i kötüsünden nasıl ayıracak?
Topladığım niteleme alanları bunun için. Satış ekibi için sinyaller:
- **Aciliyet** → en güçlü sinyal: "Acil — bu hafta" diyen lead bugün aranmalı; "sadece
  araştırıyor" beklemeye alınabilir. Admin'de **renkli rozet** olarak görünür.
- **Ekip boyutu** büyüdükçe potansiyel değer artar (1–10 vs 200+).
- **İlgi alanı** ürünle örtüşüyorsa ve netse öncelik yükselir.
- **Serbest mesaj** → niyetin netliği (somut bir soru = sıcak lead).
- **Kurumsal e-posta** (gmail/hotmail değil) ciddiyet sinyalidir.
- **Transcript** — tutarlı/dolu cevaplar gerçek ilgiyi gösterir.

**Otomatik lead skoru (uygulandı):** `urgency` + `company_size` + kurumsal-e-posta +
mesaj-var-mı sinyallerinden şeffaf, toplamsal bir puan hesaplanır (`src/lib/leadScore.js`)
ve **Sıcak / Ilık / Soğuk** rozetine çevrilir. Aciliyet en ağır sinyaldir; serbest
(gmail vb.) e-postalar hem puan düşürür hem "kişisel" etiketiyle işaretlenir. Admin
**varsayılan olarak skora göre sıralanır**, böylece en iyi lead'ler en üstte. Puan
ML değil bilinçli olarak basit ve açıklanabilir; modalde puanın gerekçesi de gösterilir.

**Bu modelin dürüst sınırı:** Skor, *elimizdeki* alanlarla çalışıyor; en güçlü iki B2B
niteleyicisini hâlâ sormuyoruz — **sektör/ICP uygunluğu** (NextReach e-ticarete satıyor;
alakasız sektör, skoru yüksek olsa da kötü lead) ve **rol/yetki**. Ayrıca `company_size`
(kişi sayısı) e-ticaret için zayıf bir proxy; ideali **aylık sipariş hacmi**. Daha fazla
zamanda akışa bir ICP sorusu ekleyip skoru ona göre ağırlıklandırırdım.

### 3.4 Admin view'de neyi nasıl göstermek ekibin işini kolaylaştırır?
PRD'deki asıl şikayet "**takip zor**" olduğu için admin'i salt gösterim değil, satışın
**günlerce üzerinde çalıştığı bir iş kuyruğu** olarak tasarladım ("tek bakışta niteleme +
isteğe bağlı derinlik"):
- **Lead skoru + skora göre sıralama** → "kimi önce arayayım" en üstte.
- **Durum (Yeni/Arandı/İletişimde/Kapandı/Çöp) + sahip** → aynı lead iki kez aranmaz,
  unutulmaz. "Takip zor" sorununu doğrudan bu çözer.
- **Filtreler** (durum/skor/aciliyet/**Bugün**) → "bugün hangi talepler geldi", "sadece
  Sıcak'lar" gibi sorulara anında cevap.
- **Aciliyet rozeti** + **kişisel e-posta** uyarısı → kalite sinyalleri tek bakışta.
- **"Eksik bilgi" göstergesi** → niteleme sorularını atlayan lead'lerde "ⓘ eksik bilgi
  (n/5)" rozeti. Böylece düşük skor "ilgisiz" değil **"bilinmiyor, nitelemek için ara"**
  diye okunur — atlanan (null) ile açıkça soğuk (low) lead'i ayırır.
- **mailto + CSV** → listeden çıkıp aksiyon alınabilir / CRM'e taşınabilir.
- **Modal** → kim/neden/ne kadar acil + serbest mesaj + tam döküm tek ekranda.

**Sonraki adım:** durum değişikliği geçmişi (audit log), kayıtlı filtre görünümleri,
sunucu tarafı sayfalama (500 cap'i kaldırmak için) ve realtime güncelleme.

### 3.5 Kötü niyetli kullanım (spam, boş talep, bot trafiği) için ne yaparım?
**Önce dürüst tespit:** Supabase anon key bundle'da herkese açıktır. Yani client-side
önlemler (honeypot, validasyon, zorunlu alanlar) bir bot REST endpoint'ine **doğrudan**
`POST /rest/v1/leads` atınca **atlanır**. O yüzden savunmayı iki kata ayırdım: UX katmanı
(dürüst kullanıcı + aptal bot) ve **DB katmanı** (bypass'a dayanan tek gerçek savunma).

**UX katmanı (client-side):**
- **Honeypot** — gizli alan; dolarsa insert sessizce düşer, bot'a "başarılı" denir. (`ChatWindow` + `useChatMachine`)
- E-posta format doğrulaması + zorunlu alanlar + **yalnızca tamamlanmış akışın** kaydı.

**DB katmanı (bypass'a dayanır — `schema.sql`):**
- **RLS `with check`** → anon insert'i e-posta regex'i, alan uzunluk caplari (ad ≤120,
  mesaj ≤2000, transcript ≤100 mesaj) ve geçerli enum değerleriyle doğrular. Doğrudan
  endpoint'e atılan çöp payload bile bu kontrolden geçmek zorunda.
- **Rate-limit trigger** → aynı e-postadan 1 dakika içinde ikinci gönderimi reddeder
  (flood döngüsünü durdurur; gerçek kullanıcı tek gönderimde takılmaz).
- **RLS kısıtı** → anon yalnızca insert + demo select/update; toplu okuma/silme yok.

**Tam çözüm (daha fazla zamanda):** insert'i bir **Supabase Edge Function** arkasına alıp
IP başına hız sınırı + **Turnstile captcha** + e-posta rotasyonuna karşı domain itibarı
kontrolü eklerdim. DB guard'ları tabanı sağlamlaştırır ama email rotasyonu yapan
gelişmiş bir bot'u ancak sunucu sınırı + captcha tam durdurur.

### 3.6 Ziyaretçi bir sorunun cevabını vermek istemezse ne olur?
**Felsefe: kullanıcıyı asla tuzağa düşürme. Yalnızca ad + e-posta zorunlu; gerisi atlanabilir.**
- En baştan **"Sadece bakıyorum"** çıkışı var → `JUST_LOOKING` → ister bilgi bırakır,
  ister kapatır. Kapatırsa **hiçbir veri kaydedilmez** (akış `SUBMIT`'e ulaşmaz).
- **Niteleme sorularının hepsi atlanabilir:** Şirket / ekip boyutu / ilgi / aciliyet /
  serbest mesaj adımlarında **"Geç / Belirtmek istemiyorum"** seçeneği var; atlanan alan
  `null` kaydedilir ve akış ilerler. (Metin soruları boş gönderince de atlanır.)
- Yalnızca **ad ve e-posta** zorunlu — çünkü iletişim bilgisi olmayan lead'in satış için
  değeri yoktur. Bu ikisi dışında ziyaretçi hiçbir adımda tuzağa düşmez.
- Mimari config tabanlı olduğu için bir soruyu opsiyonel yapmak `flowConfig.js`'te
  `optional: true` eklemekten ibaret — motor değişmez.

**Bilinçli ödünleşim (dürüst not):** "Yalnızca tamamlanmış akışı kaydet" kararı, e-postasını
verip ortada kapatan birini kaçırmamıza yol açar. Atlanabilir sorular bu riski büyük ölçüde
azalttı (artık takılınacak az soru var). Tam çözüm, e-posta alınır alınmaz lead'i
"incomplete" statüsüyle kaydetmek (kademeli kayıt) olurdu — temizlik uğruna şimdilik
tercih etmedim, "daha fazla zamanda" listesinde.

---

## 4. Güvenlik notu (önemli)

Auth **kapsam dışı**. `/admin` yalnızca tek bir env parolasıyla (`VITE_ADMIN_PASSWORD`)
korunuyor.

⚠️ Vite bu parolayı client bundle'a **gömer**; yani bu gerçek güvenlik değil, bir
**caydırıcıdır** — ileri bir kullanıcı okuyabilir. Demo amacıyla `schema.sql`, anon role'e
`select` (tabloyu okuma) ve `update` (durum/sahip değiştirme) izni veren iki politika içerir;
böylece admin auth olmadan çalışır. Anon yalnızca `insert` + bu iki demo politikasıyla sınırlı.

Gerçek bir deploy'da:
- `schema.sql`'deki demo `select`/`update` politikalarını kaldırır,
- **Supabase Auth** eklerdim,
- `select`/`update` RLS politikalarını yalnızca yetkili adminlere kısardım.

---

## 5. Süre, yapamadıklarım ve daha fazla zamanda ekleyeceklerim

> ⏱️ **Toplam süre: ~X saat** &nbsp;_(← gerçek sürenizi buraya yazın)_

### 6 saatte yetiştiremediklerim
- **Deploy linki** — repo + Vercel deploy son adımda; README'deki canlı link buraya gelecek.
- **Otomatik testler** — FSM motorunu geliştirme sırasında elle (node script) doğruladım,
  ama kalıcı bir test dosyası (Vitest) commit etmedim. Reducer saf olduğu için eklemesi kolay.
- **Gerçek auth** — kapsam dışıydı; `/admin` env-parola gate'iyle korunuyor (caydırıcı, bk. §4).
- **Sunucu sınırı (Edge Function)** — DB seviyesinde doğrulama + rate-limit trigger ekledim
  (bk. §3.5), ama insert hâlâ client'tan anon-key ile gidiyor. IP başına hız sınırı + captcha
  için insert'i bir Edge Function arkasına almak kalan iş.

### Daha fazla zamanım olsa
1. **ICP/uygunluk sorusu** — akışa sektör veya **aylık sipariş hacmi** ekleyip lead skorunu
   gerçek hedef kitleye göre ağırlıklandırmak (mevcut skor sadece elimizdeki alanlarla çalışıyor).
2. **Supabase Edge Function** — insert'i fonksiyon arkasına alıp doğrulama, rate-limit ve
   domain kontrolünü sunucuda yapmak.
3. **Sunucu tarafı sayfalama + realtime** — admin'deki 500 fetch cap'ini kaldırmak; yeni
   lead'lerin canlı düşmesi.
4. **Vitest ile testler** — FSM (happy path/validation/skip/spam) ve `leadScore`/`isFreeEmail`
   yollarını kalıcı test altına almak.
5. **Kademeli kayıt** — e-posta alınır alınmaz taslak lead'i yazıp, yarıda bırakanları da yakalamak.
6. **i18n altyapısı** — metinleri sözlüğe taşımak (case'te çoklu dil kapsam dışıydı).
