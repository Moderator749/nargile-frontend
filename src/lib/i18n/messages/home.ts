/**
 * The homepage's own words (components/home, the homepage itself), the
 * special-day strip and the opening popup (components/banner), and the
 * printed price list (components/lookbook).
 *
 * Only what is written in the code is here. What the admin writes in "Ana
 * Sayfa Düzenleme" — hero slides, section titles, the promo boxes, the strip's
 * message, the SEO text — and its defaults in lib/homepage.ts are translated
 * centrally, as the catalog is.
 *
 * Figures: amounts in liras keep the shop's "20.000 TL" in every language (as
 * formatMoney does); a rate is "%10" in Turkish and "10%" in English and
 * Arabic, with Latin digits throughout.
 */

import { defineMessages } from "@/lib/i18n/messages";

/** "%2,5" in Turkish: the sign first, a decimal comma (what formatRate writes). */
const percentTr = (n: number) => `%${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
/** "2.5%": the sign after, a decimal point, Latin digits (Arabic too). */
const percentLatin = (n: number) => `${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;

/** A sentence with one part set in bold: before, the bold part, after. */
interface Emphasis {
  before: string;
  strong: string;
  after: string;
}

export const homeMessages = defineMessages({
  tr: {
    /** A rate in percent: 10 → "%10". */
    percent: percentTr,
    previousProducts: "Önceki ürünler",
    nextProducts: "Sonraki ürünler",
    readMore: "Devamını Oku",
    readLess: "Daralt",
    newTab: "(yeni sekmede açılır)",
    explore: "Keşfet",
    followUs: "Bizi takip edin",
    highlights: "Öne çıkanlar",
    hero: {
      previous: "Önceki slayt",
      next: "Sonraki slayt",
      slide: (n: number, eyebrow: string) => `Slayt ${n}: ${eyebrow}`,
    },
    aside: {
      channelsTitle: "Topluluğa Katılın",
      advantagesEyebrow: "Ayrıcalıklar & Avantajlar",
      advantagesTitle: "Hacim büyür. Maliyet küçülür.",
      advantagesText: "Sultan Nargile ile alışverişlerinizde toptan ve perakende ayrıcalıklarından yararlanın.",
      advantagesLink: "Avantajları keşfet",
    },
    perks: {
      heading: "Mağaza avantajları",
      installmentsLabel: "Taksit Avantajı",
      installmentsValue: "Peşin fiyatına 3 taksit",
      installmentsNote: "Anlaşmalı kredi kartlarına 3 eşit taksit.",
      volumeLabel: "Sepette İndirim",
      volumeNote: "Sepet tutarınıza göre anında otomatik indirim.",
      transferLabel: "Havale & EFT",
      transferNote: "Havale ve EFT ödemelerinde ekstra nakit indirimi.",
      courierEyebrow: "Kurye Ayrıcalığı",
      courierText: "İstanbul içi aynı gün teslimat",
      shippingEyebrow: "Ücretsiz Kargo & Hızlı Sevk",
      shippingText: (threshold: string): Emphasis => ({
        before: "",
        strong: threshold,
        after: " ve üzeri tüm siparişlerinizde kargo tamamen ücretsizdir.",
      }),
    },
    picks: {
      title: "Sizin İçin Seçtiklerimiz",
      subtitle: "En çok tercih edilen ve yeni gelen ürünler",
      tabs: "Ürün listesi",
      bestsellers: "Çok Satanlar",
      newest: "Yeni Gelenler",
    },
    lules: {
      title: "Lüle Alırken Kararsız Kalacaksınız",
      kinds: ["Sırlı & Sırsız", "Phunnel & Killer", "Cam & Silikon", "Toprak & Seramik"],
      // Its last two words held together, so it never ends on one alone.
      closing: "Aradığınız tüm lüle marka ve modelleri burada",
      more: "Tüm Lüleleri Gör",
    },
    loyalty: {
      count: (n: number) => `${n} ürün`,
      sultanPuanBand: (band: string) => `${band} alışverişlerde`,
      sultanPuanNote: "Puanınız sonraki alışverişinizde indirim olur.",
      sultanPuanCall: "Kazanan Siz Olun!",
      kumbaraSubtitle: "Az ya da çok, her alışverişe SultanPuan",
      kumbaraNote: (amount: string, bonus: string) => `Toplam ${amount} barajına ulaşın, ekstra ${bonus} KumbaraPuan kazanın.`,
      kumbaraCall: "Birikim Yapın!",
    },
    deals: {
      previous: "Önceki fırsatlar",
      next: "Sonraki fırsatlar",
      missed: "Fırsat Kaçtı",
      saving: (percent: number) => `-%${percent}`,
      deal: "Fırsat",
      dealProduct: "Fırsat ürünü",
      soldOut: "Tükendi",
      view: "İncele",
      all: "Fırsatları Gör",
    },
    bento: {
      label: "Öne Çıkan Koleksiyonlar",
      boxes: [
        { alt: "Nargile kömürleri", eyebrow: "Doğal Hindistan Cevizi", title: "Nargile\nKömürleri", subtitle: "Uzun yanan, kokusuz kömürler" },
        { alt: "Bitkisel nargile aromaları", eyebrow: "Tütünsüz Tatlar", title: "Bitkisel\nÜrünler", subtitle: "Doğal, aromatik karışımlar" },
        { alt: "Nargile malzemeleri", eyebrow: "Her Şey Tek Yerde", title: "Nargile\nMalzemeleri", subtitle: "Lüle, marpuç, közlük ve dahası" },
      ],
    },
    bento2: {
      label: "Nargile Takımları ve Markalar",
      boxes: [
        { alt: "Altın ve siyah nargile takımları", eyebrow: "Klasik & Modern", title: "Nargile\nTakımları", subtitle: "Her zevke bir takım" },
        { alt: "Legend Hookah çelik nargile takımı", eyebrow: "Premium Seri", title: "Legend\nHookah", subtitle: "Çelik gövde, usta işçiliği" },
        { alt: "Oduman kristal gövdeli nargile takımı", eyebrow: "Kristal Gövde", title: "Oduman\nNargile", subtitle: "Koleksiyonu keşfedin" },
      ],
    },
    campaigns: {
      heading: "Kampanyalar",
      leadEyebrow: "Sınırlı Stok",
      leadTitle: "Premium Takımlarda Efsane Fırsat",
      leadSubtitle: "Sınırlı stoklarla sunulan elit koleksiyonu keşfedin.",
      leadCta: "Hemen İncele",
      lulesTitle: "Lüle Seçkisi",
      lulesSubtitle: "Premium tatlar.",
      kozlukTitle: "Közlükler",
      kozlukSubtitle: "Isı kontrolü.",
      accessoriesTitle: "Yeni Aksesuarlar",
      accessoriesSubtitle: "Seansınızı zenginleştiren detaylar.",
    },
    spotlight: {
      eyebrow: "Özel Lüle Koleksiyonu",
      titleLead: "Sanat Eseri",
      titleAccent: "Lüleler",
      shipping: (threshold: string): Emphasis => ({ before: "", strong: `${threshold} üzeri`, after: " siparişlerde ücretsiz kargo" }),
      courier: { before: "İstanbul içi ", strong: "aynı gün VIP teslimat", after: "" } as Emphasis,
      cta: "Tümünü Keşfet",
    },
    statement: {
      heading: "Sektörde Referans Noktası",
      lead: "Nargile kültürünü modern mühendislik ve birinci sınıf materyallerle yeniden tanımlıyoruz.",
      rest: "Sadece bir donanım değil; estetik, performans ve uzun ömürlülüğü bir araya getiren premium bir deneyim sunuyoruz.",
    },
    brands: {
      ticker: "Dünya markaları",
      heading: "Markalarımız",
      collection: "Koleksiyonu Keşfet",
      sultan:
        "Geleneksel nargile zanaatını modern mühendislikle buluşturan Sultan Nargile; dayanıklı çelik takımları, tescilli aksesuarları ve benzersiz içim kalitesiyle sektör standartlarını belirliyor.",
      oduman:
        "Camın zarafetini paslanmaz çelikle birleştiren Oduman, kompakt ve yenilikçi tasarımlarıyla nargile deneyimine modern bir dokunuş katıyor. Her detayıyla kusursuz bir içim keyfi.",
      legend:
        "Geleneksel estetiği modern nargile mühendisliğiyle buluşturan Legend Hookah, benzersiz tahliye sistemleri ve kusursuz işçiliğiyle elit bir performans sunar.",
    },
    rows: {
      kozlukTitle: "Közlükler",
      kozlukSubtitle: "Isı yöneticileri, elekler ve lüle başlıkları: kömürü doğru ısıda tutan aparatlar",
      kozlukMore: "Tüm Közlükleri Gör",
      gamesTitle: "Oyun & Eğlence",
      gamesSubtitle: "Tavla, okey ve iskambil: sohbetin en keyifli ortakları",
      gamesMore: "Tüm Oyunları Gör",
    },
  },
  en: {
    percent: percentLatin,
    previousProducts: "Previous products",
    nextProducts: "Next products",
    readMore: "Read More",
    readLess: "Show Less",
    newTab: "(opens in a new tab)",
    explore: "Explore",
    followUs: "Follow us",
    highlights: "Highlights",
    hero: {
      previous: "Previous slide",
      next: "Next slide",
      slide: (n: number, eyebrow: string) => `Slide ${n}: ${eyebrow}`,
    },
    aside: {
      channelsTitle: "Join the Community",
      advantagesEyebrow: "Perks & Advantages",
      advantagesTitle: "Order more. Pay less.",
      advantagesText: "Enjoy wholesale and retail perks every time you shop with Sultan Nargile.",
      advantagesLink: "Explore the perks",
    },
    perks: {
      heading: "Store perks",
      installmentsLabel: "Installments",
      installmentsValue: "3 installments at the cash price",
      installmentsNote: "3 equal installments on participating credit cards.",
      volumeLabel: "Cart Discount",
      volumeNote: "An instant, automatic discount based on your cart total.",
      transferLabel: "Bank Transfer",
      transferNote: "An extra cash discount when you pay by bank transfer.",
      courierEyebrow: "Courier Perk",
      courierText: "Same-day delivery within Istanbul",
      shippingEyebrow: "Free Shipping & Fast Dispatch",
      shippingText: (threshold: string): Emphasis => ({
        before: "Shipping is completely free on all orders of ",
        strong: threshold,
        after: " or more.",
      }),
    },
    picks: {
      title: "Handpicked for You",
      subtitle: "Our most popular products and latest arrivals",
      tabs: "Product list",
      bestsellers: "Best Sellers",
      newest: "New Arrivals",
    },
    lules: {
      title: "Spoiled for Choice in Hookah Bowls",
      kinds: ["Glazed & Unglazed", "Phunnel & Killer", "Glass & Silicone", "Clay & Ceramic"],
      closing: "Every hookah bowl brand and model you're looking for, all here",
      more: "See All Hookah Bowls",
    },
    loyalty: {
      count: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
      sultanPuanBand: (band: string) => `On orders of ${band}`,
      sultanPuanNote: "Your points become a discount on your next order.",
      sultanPuanCall: "Be the Winner!",
      kumbaraSubtitle: "Big or small, every order earns SultanPuan",
      kumbaraNote: (amount: string, bonus: string) => `Reach ${amount} in total and earn an extra ${bonus} in KumbaraPuan.`,
      kumbaraCall: "Start Saving!",
    },
    deals: {
      previous: "Previous deals",
      next: "Next deals",
      missed: "Deal Ended",
      saving: (percent: number) => `-${percent}%`,
      deal: "Deal",
      dealProduct: "Special deal",
      soldOut: "Sold Out",
      view: "View",
      all: "See All Deals",
    },
    bento: {
      label: "Featured collections",
      boxes: [
        { alt: "Hookah charcoal", eyebrow: "Natural Coconut", title: "Hookah\nCharcoal", subtitle: "Long-burning, odourless coals" },
        { alt: "Herbal hookah flavours", eyebrow: "Tobacco-Free Flavours", title: "Herbal\nBlends", subtitle: "Natural, aromatic mixes" },
        { alt: "Hookah supplies", eyebrow: "All in One Place", title: "Hookah\nSupplies", subtitle: "Bowls, hoses, heat managers and more" },
      ],
    },
    bento2: {
      label: "Hookah sets and brands",
      boxes: [
        { alt: "Gold and black hookah sets", eyebrow: "Classic & Modern", title: "Hookah\nSets", subtitle: "A set for every taste" },
        { alt: "Legend Hookah steel hookah set", eyebrow: "Premium Series", title: "Legend\nHookah", subtitle: "Steel body, master craftsmanship" },
        { alt: "Oduman hookah set with a crystal base", eyebrow: "Crystal Base", title: "Oduman\nHookah", subtitle: "Discover the collection" },
      ],
    },
    campaigns: {
      heading: "Promotions",
      leadEyebrow: "Limited Stock",
      leadTitle: "Legendary Deals on Premium Hookah Sets",
      leadSubtitle: "Discover the elite collection, while stocks last.",
      leadCta: "Shop Now",
      lulesTitle: "Hookah Bowl Selection",
      lulesSubtitle: "Premium flavor.",
      kozlukTitle: "Heat Management",
      kozlukSubtitle: "Total heat control.",
      accessoriesTitle: "New Accessories",
      accessoriesSubtitle: "Details that elevate your session.",
    },
    spotlight: {
      eyebrow: "Exclusive Hookah Bowl Collection",
      titleLead: "Masterpiece",
      titleAccent: "Hookah Bowls",
      shipping: (threshold: string): Emphasis => ({ before: "Free shipping on orders ", strong: `over ${threshold}`, after: "" }),
      courier: { before: "", strong: "Same-day VIP delivery", after: " within Istanbul" },
      cta: "Explore All",
    },
    statement: {
      heading: "The Industry's Benchmark",
      lead: "We're redefining hookah culture with modern engineering and first-class materials.",
      rest: "Not just hardware: a premium experience that brings together aesthetics, performance and durability.",
    },
    brands: {
      ticker: "World brands",
      heading: "Our Brands",
      collection: "Explore the Collection",
      sultan:
        "Sultan Nargile brings traditional hookah craftsmanship together with modern engineering, setting the industry standard with durable stainless steel hookah sets, patented accessories and an unmatched smoking experience.",
      oduman:
        "Oduman pairs the elegance of glass with stainless steel, bringing a modern touch to the hookah experience with compact, innovative designs. A flawless session, down to every detail.",
      legend:
        "Legend Hookah unites traditional aesthetics with modern hookah engineering, delivering elite performance with its distinctive purge systems and flawless craftsmanship.",
    },
    rows: {
      kozlukTitle: "Heat Management Devices",
      kozlukSubtitle: "HMDs, screens and wind covers: the gear that keeps your charcoal at just the right heat",
      kozlukMore: "See All HMDs",
      gamesTitle: "Games & Entertainment",
      gamesSubtitle: "Backgammon, okey and playing cards: the best company for a good conversation",
      gamesMore: "See All Games",
    },
  },
  ar: {
    percent: percentLatin,
    previousProducts: "المنتجات السابقة",
    nextProducts: "المنتجات التالية",
    readMore: "اقرأ المزيد",
    readLess: "عرض أقل",
    newTab: "(يفتح في علامة تبويب جديدة)",
    explore: "اكتشف",
    followUs: "تابعونا",
    highlights: "أبرز العروض",
    hero: {
      previous: "الشريحة السابقة",
      next: "الشريحة التالية",
      slide: (n: number, eyebrow: string) => `الشريحة ${n}: ${eyebrow}`,
    },
    aside: {
      channelsTitle: "انضم إلى مجتمعنا",
      advantagesEyebrow: "المزايا والامتيازات",
      advantagesTitle: "اطلب أكثر، وادفع أقل.",
      advantagesText: "استفد من مزايا الجملة والتجزئة في كل مشترياتك مع Sultan Nargile.",
      advantagesLink: "اكتشف المزايا",
    },
    perks: {
      heading: "مزايا المتجر",
      installmentsLabel: "التقسيط",
      installmentsValue: "3 أقساط بسعر الدفع نقدًا",
      installmentsNote: "3 أقساط متساوية على بطاقات الائتمان المشاركة.",
      volumeLabel: "خصم السلة",
      volumeNote: "خصم تلقائي فوري حسب قيمة سلتك.",
      transferLabel: "تحويل بنكي",
      transferNote: "خصم نقدي إضافي عند الدفع بالتحويل البنكي.",
      courierEyebrow: "ميزة مندوب التوصيل",
      courierText: "توصيل في نفس اليوم داخل إسطنبول",
      shippingEyebrow: "شحن مجاني وإرسال سريع",
      shippingText: (threshold: string): Emphasis => ({
        before: "الشحن مجاني تمامًا على جميع الطلبات بقيمة ",
        strong: threshold,
        after: " فأكثر.",
      }),
    },
    picks: {
      title: "اخترناها لك",
      subtitle: "المنتجات الأكثر طلبًا وأحدث الوافدين",
      tabs: "قائمة المنتجات",
      bestsellers: "الأكثر مبيعًا",
      newest: "وصل حديثًا",
    },
    lules: {
      title: "ستحتار في اختيار رأس الشيشة",
      kinds: ["مزجج وغير مزجج", "Phunnel وKiller", "زجاج وسيليكون", "فخار وسيراميك"],
      closing: "كل ماركات وموديلات رؤوس الشيشة التي تبحث عنها هنا",
      more: "عرض كل رؤوس الشيشة",
    },
    loyalty: {
      count: (n: number) => `${n} منتج`,
      sultanPuanBand: (band: string) => `على المشتريات بين ${band}`,
      sultanPuanNote: "تتحول نقاطك إلى خصم على طلبك التالي.",
      sultanPuanCall: "كن أنت الرابح!",
      kumbaraSubtitle: "قليلة كانت أم كثيرة، كل عملية شراء تمنحك SultanPuan",
      kumbaraNote: (amount: string, bonus: string) => `اصل بمشترياتك إلى ${amount} واكسب ${bonus} إضافية من KumbaraPuan.`,
      kumbaraCall: "ابدأ الادخار!",
    },
    deals: {
      previous: "العروض السابقة",
      next: "العروض التالية",
      missed: "انتهى العرض",
      saving: (percent: number) => `خصم ${percent}%`,
      deal: "عرض",
      dealProduct: "منتج بعرض خاص",
      soldOut: "نفدت الكمية",
      view: "عرض التفاصيل",
      all: "شاهد كل العروض",
    },
    bento: {
      label: "مجموعات مميزة",
      boxes: [
        { alt: "فحم الأرجيلة", eyebrow: "جوز هند طبيعي", title: "فحم\nالأرجيلة", subtitle: "فحم طويل الاشتعال بلا رائحة" },
        { alt: "نكهات أرجيلة عشبية", eyebrow: "نكهات بلا تبغ", title: "منتجات\nعشبية", subtitle: "خلطات طبيعية عطرية" },
        { alt: "مستلزمات الأرجيلة", eyebrow: "كل شيء في مكان واحد", title: "مستلزمات\nالأرجيلة", subtitle: "رؤوس وخراطيم ومنظمات حرارة والمزيد" },
      ],
    },
    bento2: {
      label: "أطقم الأرجيلة والعلامات التجارية",
      boxes: [
        { alt: "أطقم أرجيلة ذهبية وسوداء", eyebrow: "كلاسيكي وعصري", title: "أطقم\nالأرجيلة", subtitle: "طقم لكل ذوق" },
        { alt: "طقم أرجيلة ليجند هوكا من الفولاذ", eyebrow: "سلسلة فاخرة", title: "ليجند\nهوكا", subtitle: "هيكل فولاذي وصنعة متقنة" },
        { alt: "طقم أرجيلة أودومان بقاعدة كريستال", eyebrow: "قاعدة كريستال", title: "أرجيلة\nأودومان", subtitle: "اكتشف المجموعة" },
      ],
    },
    campaigns: {
      heading: "العروض",
      leadEyebrow: "كمية محدودة",
      leadTitle: "عروض استثنائية على أطقم الشيشة الفاخرة",
      leadSubtitle: "اكتشف التشكيلة الفاخرة قبل نفاد الكمية.",
      leadCta: "تسوق الآن",
      lulesTitle: "تشكيلة رؤوس الشيشة",
      lulesSubtitle: "نكهة فاخرة.",
      kozlukTitle: "منظمات الحرارة",
      kozlukSubtitle: "تحكم كامل بالحرارة.",
      accessoriesTitle: "إكسسوارات جديدة",
      accessoriesSubtitle: "تفاصيل تُثري جلستك.",
    },
    spotlight: {
      eyebrow: "تشكيلة رؤوس شيشة حصرية",
      titleLead: "تحف فنية من",
      titleAccent: "رؤوس الشيشة",
      shipping: (threshold: string): Emphasis => ({ before: "شحن مجاني للطلبات ", strong: `فوق ${threshold}`, after: "" }),
      courier: { before: "", strong: "توصيل VIP في نفس اليوم", after: " داخل إسطنبول" },
      cta: "اكتشف الكل",
    },
    statement: {
      heading: "المرجع الأول في القطاع",
      lead: "نعيد تعريف ثقافة الشيشة بالهندسة الحديثة والمواد الفاخرة.",
      rest: "ليست مجرد معدات، بل تجربة فاخرة تجمع بين الجمال والأداء وطول العمر.",
    },
    brands: {
      ticker: "علامات عالمية",
      heading: "علاماتنا التجارية",
      collection: "اكتشف المجموعة",
      sultan:
        "تجمع Sultan Nargile بين حرفة الشيشة التقليدية والهندسة الحديثة، وتضع معايير القطاع بأطقم شيشة ستانلس ستيل متينة وإكسسوارات مسجلة الملكية وجودة تدخين لا مثيل لها.",
      oduman:
        "تجمع Oduman بين أناقة الزجاج والستانلس ستيل، وتضيف لمسة عصرية إلى تجربة الشيشة بتصاميم مدمجة ومبتكرة. متعة تدخين مثالية في كل تفصيل.",
      legend:
        "تجمع Legend Hookah بين الجمال التقليدي وهندسة الشيشة الحديثة، وتقدم أداءً راقيًا بفضل أنظمة تفريغ الدخان المميزة والصنعة المتقنة.",
    },
    rows: {
      kozlukTitle: "منظمات حرارة الشيشة (كالود)",
      kozlukSubtitle: "منظمات حرارة وشبكات وأغطية رأس الشيشة: أدوات تحافظ على الفحم بالحرارة المثالية",
      kozlukMore: "عرض كل منظمات الحرارة",
      gamesTitle: "ألعاب وتسلية",
      gamesSubtitle: "طاولة الزهر والأوكي وورق اللعب: أجمل رفاق السهرة",
      gamesMore: "عرض كل الألعاب",
    },
  },
});

/** The special-day strip, its countdown, and the opening popup. */
export const bannerMessages = defineMessages({
  tr: {
    announcement: "Duyuru",
    close: "Duyuruyu kapat",
    ok: "Tamam",
    timeLeft: "Kalan süre",
    timeLeftFull: (days: number, hours: number, minutes: number) =>
      `Kalan süre: ${days} gün ${hours} saat ${minutes} dakika`,
    /** The ticker's units: "02g 14sa 03dk 22sn". */
    units: { days: "g", hours: "sa", minutes: "dk", seconds: "sn" },
  },
  en: {
    announcement: "Announcement",
    close: "Close announcement",
    ok: "OK",
    timeLeft: "Time left",
    timeLeftFull: (days: number, hours: number, minutes: number) =>
      `Time left: ${days} ${days === 1 ? "day" : "days"} ${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`,
    units: { days: "d", hours: "h", minutes: "m", seconds: "s" },
  },
  ar: {
    announcement: "إعلان",
    close: "إغلاق الإعلان",
    ok: "حسنًا",
    timeLeft: "الوقت المتبقي",
    timeLeftFull: (days: number, hours: number, minutes: number) =>
      `الوقت المتبقي: ${days} يوم ${hours} ساعة ${minutes} دقيقة`,
    units: { days: "ي", hours: "سا", minutes: "د", seconds: "ث" },
  },
});

/** The printed price list ("Fiyat Listesi"). */
export const lookbookMessages = defineMessages({
  tr: {
    title: "Fiyat Listesi",
    noImage: "Görsel yok",
    noPrice: "Fiyat yok",
    exclVat: "KDV hariç",
    vat: "+ KDV",
    total: "Toplam",
  },
  en: {
    title: "Price List",
    noImage: "No image",
    noPrice: "No price",
    exclVat: "Excl. VAT",
    vat: "+ VAT",
    total: "Total",
  },
  ar: {
    title: "قائمة الأسعار",
    noImage: "لا توجد صورة",
    noPrice: "لا يوجد سعر",
    exclVat: "بدون الضريبة",
    vat: "+ الضريبة",
    total: "الإجمالي",
  },
});
