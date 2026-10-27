/**
 * The words around the long-form pages: the Bilgi Sayfaları and their shell,
 * "Ayrıcalıklar ve Avantajlar", the blog and /sss. The documents, the article
 * and the answers themselves are content (lib/bilgi, lib/blog, lib/faq and
 * their translations in lib/content), not messages.
 *
 * The perks' points mark their emphasis as `**…**`; the page renders those
 * as <strong>, so a translation can put the bold where its own word order
 * puts the figure.
 */

import { defineMessages } from "@/lib/i18n/messages";

/** The shells: BilgiLayout and InfoPage. */
export const infoShellMessages = defineMessages({
  tr: {
    breadcrumbLabel: "Sayfa konumu",
    lastUpdated: "Son güncelleme:",
  },
  en: {
    breadcrumbLabel: "Breadcrumb",
    lastUpdated: "Last updated:",
  },
  ar: {
    breadcrumbLabel: "مسار التنقل",
    lastUpdated: "آخر تحديث:",
  },
});

/** /bilgi and /bilgi/[slug]. */
export const bilgiMessages = defineMessages({
  tr: {
    title: "Bilgi Sayfaları",
    description:
      "Sultan Nargile ayrıcalıkları ve avantajları, üyelik ve kullanım şartları, kargo ve teslimat şartları ve mesafeli satış sözleşmesi.",
    notFound: "Sayfa bulunamadı",
  },
  en: {
    title: "Information Pages",
    description:
      "Sultan Nargile perks and benefits, membership and terms of use, shipping and delivery terms, and the distance sales agreement.",
    notFound: "Page not found",
  },
  ar: {
    title: "صفحات المعلومات",
    description: "مزايا وامتيازات Sultan Nargile، شروط العضوية والاستخدام، شروط الشحن والتسليم، وعقد البيع عن بعد.",
    notFound: "الصفحة غير موجودة",
  },
});

/** /blog and its articles. */
export const blogMessages = defineMessages({
  tr: {
    title: "Blog",
    description: "Nargile lülesi, ekipman seçimi ve içim üzerine Sultan Nargile rehberleri.",
    notFound: "Yazı bulunamadı",
    moreArticles: "Diğer yazılar",
    browseBowls: "Lüleleri incele",
  },
  en: {
    title: "Blog",
    description: "Sultan Nargile guides to hookah bowls, choosing your hookah gear and getting a better session.",
    notFound: "Article not found",
    moreArticles: "More articles",
    browseBowls: "Browse hookah bowls",
  },
  ar: {
    title: "المدونة",
    description: "أدلة Sultan Nargile حول رؤوس الشيشة واختيار معدات الشيشة والحصول على جلسة أفضل.",
    notFound: "المقال غير موجود",
    moreArticles: "مقالات أخرى",
    browseBowls: "تصفّح رؤوس الشيشة",
  },
});

/** /sss. */
export const faqMessages = defineMessages({
  tr: {
    title: "Destek & Sıkça Sorulan Sorular",
    description:
      "Toptan fiyatlar, dağıtımını yaptığımız markalar, minimum sipariş tutarı ve kafe/mağaza teslimatı hakkında sıkça sorulan sorular.",
  },
  en: {
    title: "Support & FAQ",
    description:
      "Frequently asked questions about wholesale prices, the brands we distribute, minimum order amounts and delivery to cafés and shops.",
  },
  ar: {
    title: "الدعم والأسئلة الشائعة",
    description: "أسئلة شائعة حول أسعار الجملة، والماركات التي نوزّعها، والحدّ الأدنى لقيمة الطلب، والتوصيل إلى المقاهي والمتاجر.",
  },
});

/**
 * "Ayrıcalıklar ve Avantajlar". Amounts arrive formatted ("3.000 TL"), rates
 * too ("%5" / "5%"); `range` and `rangeFrom` build the ladders' ranges that
 * `volumeLine` and `transferLine` then place.
 */
export const perksMessages = defineMessages({
  tr: {
    metaDescription: (threshold: string) =>
      `${threshold} ve üzeri ücretsiz kargo, İstanbul içi aynı gün kurye, havale/EFT ve sepet indirimleri, SultanPuan ve KumbaraPuan: Sultan Nargile ayrıcalıkları.`,
    intro:
      "Bireysel (perakende) alışverişlerinizde geçerli kargo, teslimat, ödeme ve puan ayrıcalıklarının tamamı. Tutarlar ve oranlar, ödeme adımında uygulananlarla aynıdır.",
    navLabel: "Ayrıcalıklar",
    range: (from: string, to: string) => `${from} – ${to} arası`,
    rangeFrom: (from: string) => `${from} ve üzeri`,
    pieces: (n: number) => `${n} adet`,
    kilos: (n: number) => `${n} kg`,
    shippingTitle: "Ücretsiz Kargo Avantajı",
    shippingThreshold: (threshold: string) => `**${threshold} ve üzeri** tüm perakende siparişlerinizde kargo tamamen ücretsizdir.`,
    shippingCoal: (ratio: string, minimum: string) =>
      `**Kömür siparişleri:** Kömür bedeli sepet tutarının ${ratio} oranını aşıyorsa, ücretsiz kargo için tek seferde en az **${minimum}** kömür alınması gerekir.`,
    shippingMixed: (ratio: string, byQuantity: boolean, threshold: string) =>
      `**Sepet dengesi:** Kömür bedelinin sepet tutarının ${ratio} oranını aşmadığı karma sepetlerde ayrıca ${byQuantity ? "adet" : "kilo"} şartı aranmaz; ${threshold} barajı yeterlidir.`,
    shippingNote:
      "Ücretsiz kargo koşullarını karşılamayan siparişler, kargo ücreti teslimatta alıcı tarafından ödenmek üzere (karşı ödemeli) gönderilir.",
    courierTitle: "İstanbul İçi VIP Kurye ile Hızlı Teslimat",
    courierUrgent: "İstanbul içi acil siparişlerinizde hızlı moto kurye teslimatı sağlanır.",
    courierStores: "Sevkiyatlar teslimat adresinize en yakın mağazamızdan (Bahçelievler veya Esenyurt) organize edilir.",
    courierHours: "Kurye hizmetimiz **10:00 – 20:00** saatleri arasında geçerlidir.",
    courierNote:
      "Sipariş oluşturulduğunda güncel kurye mesafesi ve bedeli belirlenerek onayınıza sunulur; kurye masrafı alıcıya aittir.",
    instalmentTitle: "Peşin Fiyatına 3 Taksit İmkânı",
    instalmentCards: "Seçili ürün gruplarında anlaşmalı kredi kartlarına **vade farksız 3 taksit** seçeneği sunulmaktadır.",
    instalmentMore: "3 taksitin üzerindeki vadeli seçenekler, bankanızın sunduğu oranlarla ödeme adımında listelenir.",
    volumeTitle: "Kademeli Otomatik Sepet İndirimi",
    volumeLine: (range: string, rate: string, last: boolean) =>
      `${range} alışverişlerde anında **${rate}** ${last ? "toptan sepet indirimi" : "sepet indirimi"} uygulanır.`,
    volumeNote: "İndirim, sepet tutarınıza göre ödeme adımında kendiliğinden uygulanır; ayrıca bir kod girmeniz gerekmez.",
    transferTitle: "Havale & EFT Ekstra Nakit İndirimi",
    transferLine: (range: string, rate: string) => `${range} havale/EFT ödemelerinde anında **${rate}** nakit indirimi uygulanır.`,
    transferNote: "Havale/EFT indirimi, varsa kademeli sepet indirimi düşüldükten sonra kalan tutara uygulanır.",
    sultanTitle: (rate: string) => `SultanPuan Sadakat Programı (${rate})`,
    sultanEarn: (min: string, max: string, rate: string) =>
      `${min} – ${max} arasındaki tek seferlik siparişlerinizde **${rate} SultanPuan** hesabınıza yüklenir.`,
    sultanSpend: (value: string) =>
      `Kazandığınız puanları sonraki siparişlerinizde kısmen ya da tek seferde kullanabilirsiniz; 1 SultanPuan = ${value}.`,
    sultanLifetime: "Puanların kullanım süresi, kazanıldıkları tarihten itibaren 1 yıldır.",
    kumbaraTitle: (rate: string) => `KumbaraPuan Birikim Sistemi (${rate})`,
    kumbaraEarn: (ceiling: string | null, days: number, threshold: string, points: number, rate: string) =>
      `${ceiling ? `${ceiling} altındaki` : "Tüm"} siparişlerinizin son ${days} gün içindeki toplamı **${threshold}**’ye ulaştığında hesabınıza otomatik olarak **${points.toLocaleString("tr-TR")} puan (${rate})** tanımlanır.`,
    kumbaraSpend: "Puanlar SultanPuan bakiyenize eklenir; sonraki alışverişlerinizde serbestçe kullanabilirsiniz (1 yıl geçerli).",
  },
  en: {
    metaDescription: (threshold: string) =>
      `Free shipping from ${threshold}, same-day courier within Istanbul, bank transfer and cart discounts, SultanPuan and KumbaraPuan: Sultan Nargile perks.`,
    intro:
      "Every shipping, delivery, payment and points perk that applies to your individual (retail) purchases. The amounts and rates are the same ones applied at checkout.",
    navLabel: "Perks",
    range: (from: string, to: string) => `of ${from} – ${to}`,
    rangeFrom: (from: string) => `of ${from} and above`,
    pieces: (n: number) => `${n} pcs`,
    kilos: (n: number) => `${n} kg`,
    shippingTitle: "Free Shipping",
    shippingThreshold: (threshold: string) => `Shipping is completely free on all retail orders of **${threshold} and above**.`,
    shippingCoal: (ratio: string, minimum: string) =>
      `**Charcoal orders:** If the charcoal makes up more than ${ratio} of the cart total, free shipping requires buying at least **${minimum}** of charcoal in a single order.`,
    shippingMixed: (ratio: string, byQuantity: boolean, threshold: string) =>
      `**Mixed carts:** In mixed carts where the charcoal makes up no more than ${ratio} of the cart total, there is no separate ${byQuantity ? "quantity" : "weight"} requirement; the ${threshold} threshold is enough.`,
    shippingNote:
      "Orders that don't meet the free shipping conditions are sent with the shipping fee payable by the recipient on delivery (cash on delivery for shipping).",
    courierTitle: "Fast VIP Courier Delivery Within Istanbul",
    courierUrgent: "For urgent orders within Istanbul, we offer fast motorcycle courier delivery.",
    courierStores: "Deliveries are dispatched from our store nearest to your delivery address (Bahçelievler or Esenyurt).",
    courierHours: "Our courier service runs between **10:00 – 20:00**.",
    courierNote:
      "When the order is placed, the current courier distance and fee are worked out and presented for your approval; the courier fee is paid by the buyer.",
    instalmentTitle: "3 Instalments at the Cash Price",
    instalmentCards: "On selected product groups, **3 interest-free instalments** are available with partner credit cards.",
    instalmentMore: "Instalment plans longer than 3 months are listed at checkout, at the rates your bank offers.",
    volumeTitle: "Tiered Automatic Cart Discount",
    volumeLine: (range: string, rate: string, last: boolean) =>
      `Purchases ${range} get an instant **${rate}** ${last ? "wholesale cart discount" : "cart discount"}.`,
    volumeNote: "The discount is applied automatically at checkout, based on your cart total; there's no code to enter.",
    transferTitle: "Extra Cash Discount for Bank Transfer",
    transferLine: (range: string, rate: string) => `Bank transfer payments ${range} get an instant **${rate}** cash discount.`,
    transferNote: "The bank transfer discount is applied to the amount left after any tiered cart discount.",
    sultanTitle: (rate: string) => `SultanPuan Loyalty Programme (${rate})`,
    sultanEarn: (min: string, max: string, rate: string) =>
      `On single orders of ${min} – ${max}, **${rate} in SultanPuan** is credited to your account.`,
    sultanSpend: (value: string) =>
      `You can use the points you earn on your next orders, in part or all at once; 1 SultanPuan = ${value}.`,
    sultanLifetime: "Points can be used for 1 year from the date they are earned.",
    kumbaraTitle: (rate: string) => `KumbaraPuan Savings Scheme (${rate})`,
    kumbaraEarn: (ceiling: string | null, days: number, threshold: string, points: number, rate: string) =>
      `When the total of ${ceiling ? `your orders under ${ceiling}` : "all your orders"} over the last ${days} days reaches **${threshold}**, **${points.toLocaleString("en-GB")} points (${rate})** are automatically credited to your account.`,
    kumbaraSpend: "The points are added to your SultanPuan balance, to use freely on your next purchases (valid for 1 year).",
  },
  ar: {
    metaDescription: (threshold: string) =>
      `شحن مجاني للطلبات بقيمة ${threshold} فما فوق، توصيل بمندوب في نفس اليوم داخل إسطنبول، خصومات التحويل البنكي والسلة، SultanPuan وKumbaraPuan: مزايا Sultan Nargile.`,
    intro:
      "جميع مزايا الشحن والتوصيل والدفع والنقاط السارية على مشترياتكم الفردية (بالتجزئة). والمبالغ والنسب هي نفسها المطبّقة في خطوة الدفع.",
    navLabel: "المزايا",
    range: (from: string, to: string) => `من ${from} إلى ${to}`,
    rangeFrom: (from: string) => `بقيمة ${from} فما فوق`,
    pieces: (n: number) => `${n} قطعة`,
    kilos: (n: number) => `${n} كغ`,
    shippingTitle: "ميزة الشحن المجاني",
    shippingThreshold: (threshold: string) => `الشحن مجاني تمامًا في جميع طلبات التجزئة **بقيمة ${threshold} فما فوق**.`,
    shippingCoal: (ratio: string, minimum: string) =>
      `**طلبات الفحم:** إذا تجاوزت قيمة الفحم نسبة ${ratio} من قيمة السلة، يُشترط للحصول على الشحن المجاني شراء **${minimum}** من الفحم على الأقل في طلب واحد.`,
    shippingMixed: (ratio: string, byQuantity: boolean, threshold: string) =>
      `**توازن السلة:** في السلال المختلطة التي لا تتجاوز فيها قيمة الفحم نسبة ${ratio} من قيمة السلة، لا يُشترط حدّ أدنى ${byQuantity ? "للكمية" : "للوزن"}؛ ويكفي بلوغ حدّ ${threshold}.`,
    shippingNote: "تُرسل الطلبات التي لا تستوفي شروط الشحن المجاني على أن يدفع المستلم رسوم الشحن عند التسليم (الشحن بالدفع عند الاستلام).",
    courierTitle: "توصيل سريع بمندوب VIP داخل إسطنبول",
    courierUrgent: "نوفّر توصيلًا سريعًا بمندوب على دراجة نارية لطلباتكم العاجلة داخل إسطنبول.",
    courierStores: "تُنظَّم الشحنات من أقرب متجر لنا إلى عنوان التسليم (Bahçelievler أو Esenyurt).",
    courierHours: "تعمل خدمة التوصيل بالمندوب بين الساعة **10:00 – 20:00**.",
    courierNote: "عند إنشاء الطلب، تُحدَّد المسافة الحالية وأجرة المندوب وتُعرض عليكم للموافقة؛ وتكلفة المندوب على المشتري.",
    instalmentTitle: "3 أقساط بسعر الدفع النقدي",
    instalmentCards: "تتوفر في مجموعات منتجات مختارة إمكانية **التقسيط على 3 دفعات دون فوائد** ببطاقات الائتمان المتعاقد معها.",
    instalmentMore: "تُعرض خيارات التقسيط لأكثر من 3 دفعات في خطوة الدفع، بالنسب التي يقدّمها بنككم.",
    volumeTitle: "خصم تلقائي متدرّج على السلة",
    volumeLine: (range: string, rate: string, last: boolean) =>
      `للمشتريات ${range} يُطبَّق فورًا ${last ? "خصم جملة على السلة" : "خصم على السلة"} بنسبة **${rate}**.`,
    volumeNote: "يُطبَّق الخصم تلقائيًا في خطوة الدفع حسب قيمة سلتكم؛ ولا حاجة لإدخال أي رمز.",
    transferTitle: "خصم نقدي إضافي للتحويل البنكي",
    transferLine: (range: string, rate: string) => `لمدفوعات التحويل البنكي ${range} يُطبَّق فورًا خصم نقدي بنسبة **${rate}**.`,
    transferNote: "يُطبَّق خصم التحويل البنكي على المبلغ المتبقي بعد خصم السلة المتدرّج، إن وُجد.",
    sultanTitle: (rate: string) => `برنامج الولاء SultanPuan (${rate})`,
    sultanEarn: (min: string, max: string, rate: string) =>
      `في طلباتكم الفردية بقيمة ${min} – ${max}، يُضاف إلى حسابكم **${rate} من SultanPuan**.`,
    sultanSpend: (value: string) =>
      `يمكنكم استخدام النقاط التي تكسبونها في طلباتكم التالية جزئيًا أو دفعة واحدة؛ 1 SultanPuan = ${value}.`,
    sultanLifetime: "صلاحية استخدام النقاط سنة واحدة من تاريخ اكتسابها.",
    kumbaraTitle: (rate: string) => `نظام ادخار KumbaraPuan (${rate})`,
    kumbaraEarn: (ceiling: string | null, days: number, threshold: string, points: number, rate: string) =>
      `عندما يبلغ مجموع ${ceiling ? `طلباتكم التي تقل عن ${ceiling}` : "جميع طلباتكم"} خلال آخر ${days} يومًا **${threshold}**، تُضاف إلى حسابكم تلقائيًا **${points.toLocaleString("en-GB")} نقطة (${rate})**.`,
    kumbaraSpend: "تُضاف النقاط إلى رصيد SultanPuan الخاص بكم، ويمكنكم استخدامها بحرية في مشترياتكم التالية (صالحة لمدة سنة واحدة).",
  },
});
