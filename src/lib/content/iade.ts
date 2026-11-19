/**
 * "İptal, İade ve Değişim Koşulları": one page that gathers the return terms
 * of the signed distance sales agreement (lib/bilgi, articles 5.2–5.5, 6, 7)
 * in plain words, for shoppers and for Google Merchant Center's return-policy
 * check. It adds no obligation of its own: every term comes from that
 * agreement, except the refund deadline (Mesafeli Sözleşmeler Yönetmeliği
 * md. 13) and the rights on defective goods (6502 sayılı Kanun md. 11), which
 * are the law's. If the agreement changes, change this page with it — the
 * agreement is the binding text and the page says so.
 *
 * Law 4207: no product-use wording beyond "water, coal" for the hygiene rule.
 */

import type { BilgiDocument } from "@/lib/bilgi";

export const RETURNS_SLUG = "iptal-ve-iade-kosullari";

export const RETURNS_DOCUMENT: BilgiDocument = {
  slug: RETURNS_SLUG,
  title: "İptal, İade ve Değişim Koşulları",
  sourceTitle: "İPTAL, İADE VE DEĞİŞİM KOŞULLARI",
  description:
    "İade ve değişim koşulları: 14 gün cayma hakkı, ücretsiz iade kargosu, kullanılmamış ve ambalajı açılmamış ürün, 30 gün değişim, 14 gün içinde para iadesi.",
  blocks: [
    {
      type: "p",
      text: "nargilemalzemesi.com üzerinden verdiğiniz siparişlerde iade ve değişim koşulları aşağıdadır. Bu sayfa Mesafeli Satış Sözleşmesi'nin iade hükümlerinin özetidir; bağlayıcı metin sözleşmenin kendisidir.",
    },
    { type: "h2", text: "Özet" },
    {
      type: "ul",
      items: [
        "İade süresi: Teslim tarihinden itibaren 14 gün (cayma hakkı), gerekçe göstermeden.",
        "Ürün durumu: Kullanılmamış, orijinal kutusunda, koruyucu ambalajı (jelatin, bant, mühür) açılmamış ve yeniden satılabilir olmalıdır. Kusurlu veya hasarlı gelen ürünler her durumda iade edilebilir.",
        "İade kargo ücreti: Cayma hakkıyla yapılan iadelerde ve kusurlu/hasarlı ürünlerde kargo ücreti bize aittir (anlaşmalı kargo firmamızla gönderildiğinde).",
        "Değişim: Kabul edilir. Teslimden itibaren 30 gün içinde; değişimde gidiş-dönüş kargo ücreti alıcıya aittir.",
        "Para iadesi: Cayma bildiriminiz bize ulaştıktan sonra en geç 14 gün içinde, ödemeyi yaptığınız yönteme kesintisiz olarak.",
        "İade yöntemi: Kargo ile. Mağazadan iade için önceden bizimle iletişime geçebilirsiniz.",
      ],
    },
    { type: "h2", text: "1. Cayma Hakkı (14 Gün İçinde İade)" },
    {
      type: "p",
      text: "Ürünü teslim aldığınız tarihten itibaren 14 gün içinde, hiçbir gerekçe göstermeden ve cezai şart ödemeden siparişinizden cayabilirsiniz. Bunun için bu süre içinde bize e-posta (destek@sultannargile.com), telefon (0212 553 05 92 / 0532 787 30 43) veya sitedeki destek talebi üzerinden yazılı olarak bildirimde bulunmanız yeterlidir.",
    },
    { type: "h2", text: "2. İade Edilebilecek Ürünlerin Durumu" },
    {
      type: "ul",
      items: [
        "Ürün kullanılmamış olmalıdır: içine su konulmamış, kömür veya duman teması olmamış.",
        "Ürün orijinal kutusu, faturası ve tüm aksesuarlarıyla eksiksiz gönderilmelidir.",
        "Marpuç, sipsi (ağızlık) ve diğer aparatların koruyucu ambalajı, jelatini, bandı veya mührü açılmamış olmalıdır.",
        "Ürün yolda hasar görmeyecek şekilde, orijinal kutusuyla özenle paketlenmelidir.",
      ],
    },
    {
      type: "p",
      text: "Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-ç maddesi gereği; teslimden sonra koruyucu ambalajı açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde (nargile takımları, lüleler, marpuçlar, sipsiler dahil) cayma hakkı kullanılamaz. Kullanıldığı tespit edilen ürünlerin iadesi kabul edilmez.",
    },
    { type: "h2", text: "3. İade Nasıl Yapılır?" },
    {
      type: "ol",
      items: [
        "14 gün içinde iade talebinizi e-posta, telefon veya destek talebiyle bize bildirin; sipariş numaranızı belirtin.",
        "Ürünü orijinal kutusu, faturası ve tüm parçalarıyla özenle paketleyin. Bireysel siparişlerde faturanın iade bölümünü doldurup imzalayın; kurumsal (şirket adına) faturalı siparişlerde ürünle birlikte şirketinizin düzenlediği iade faturasını gönderin.",
        "Paketi anlaşmalı kargo firmamız Yurtiçi Kargo ile gönderin. Bu durumda iade kargo ücreti bize aittir; farklı bir kargo firmasıyla gönderilen iadelerin kargo ücreti alıcıya aittir.",
        "Ürün bize ulaşıp kontrol edildikten sonra iadeniz onaylanır ve size bilgi verilir.",
      ],
    },
    { type: "h2", text: "4. Para İadesi" },
    {
      type: "p",
      text: "Ücret iadesi, cayma bildiriminizin bize ulaştığı tarihten itibaren en geç 14 gün içinde, ödemeyi yaptığınız yönteme (kredi kartı veya banka hesabı) kesintisiz olarak yapılır. Kredi kartı iadelerinin hesabınıza yansıma süresi bankanıza bağlıdır. Stokta olmadığı için iptal ettiğimiz siparişlerde ödediğiniz tutar en geç 3 gün içinde iade edilir.",
    },
    { type: "h2", text: "5. Değişim" },
    {
      type: "p",
      text: "Teslim aldığınız ürünü renk, model veya çeşit olarak değiştirmek isterseniz, teslim tarihinden itibaren 30 gün içinde bize başvurabilirsiniz. Ürünün kullanılmamış, hasar görmemiş, hijyenik koruma ambalajı açılmamış ve yeniden satılabilir olması gerekir. Değişim mağazamızın onayıyla yapılır; onaylanan değişimlerde gidiş-dönüş kargo ücreti alıcıya aittir.",
    },
    { type: "h2", text: "6. Hasarlı veya Kusurlu Ürünler" },
    {
      type: "ul",
      items: [
        "Teslimat sırasında pakette açıkça görülen hasar, kırık veya ezilme varsa kargo görevlisine \"Hasar Tespit Tutanağı\" tutturun.",
        "Paketi açtıktan sonra fark ettiğiniz kargo hasarını, fotoğraf veya videosuyla birlikte teslimden itibaren en geç 3 gün içinde yazılı olarak bize bildirin.",
        "Kusurlu (ayıplı) ürünlerde 6502 sayılı Tüketicinin Korunması Hakkında Kanun'daki haklarınız saklıdır: ücret iadesi, değişim, ücretsiz onarım veya indirim. Kusurlu ve hasarlı ürünlerin iade ve değişim kargo ücreti bize aittir.",
      ],
    },
    { type: "h2", text: "7. İletişim" },
    {
      type: "p",
      text: "Sultan Nargile / Pınar Kuş · Soğanlı Mah. Site Sok. No:5/A Bahçelievler / İstanbul · Telefon: 0212 553 05 92 · 0532 787 30 43 · E-posta: destek@sultannargile.com",
    },
  ],
};

const NOTICE_EN = { type: "notice", text: "This is a courtesy translation. The Turkish version is the legally binding text." } as const;
const NOTICE_AR = { type: "notice", text: "هذه ترجمة للاطلاع فقط، والنص التركي هو النص الملزم قانونيًا." } as const;

export const RETURNS_DOCUMENT_EN: BilgiDocument = {
  slug: RETURNS_SLUG,
  title: "Cancellation, Return and Exchange Policy",
  sourceTitle: "İPTAL, İADE VE DEĞİŞİM KOŞULLARI",
  description:
    "Return and exchange policy: 14-day right of withdrawal, free return shipping, unused items in unopened packaging, 30-day exchanges, refunds within 14 days.",
  blocks: [
    NOTICE_EN,
    {
      type: "p",
      text: "These are the return and exchange terms for orders placed on nargilemalzemesi.com. This page summarises the return provisions of the Distance Sales Agreement; the agreement itself is the binding text.",
    },
    { type: "h2", text: "Summary" },
    {
      type: "ul",
      items: [
        "Return window: 14 days from delivery (right of withdrawal), no reason needed.",
        "Condition: unused, in the original box, with the protective packaging (film, tape, seal) unopened, and resaleable. Defective or damaged items can always be returned.",
        "Return shipping: free for returns under the right of withdrawal and for defective/damaged items (when sent with our contracted carrier).",
        "Exchanges: accepted within 30 days of delivery; the customer pays shipping both ways for an exchange.",
        "Refund: within 14 days of your withdrawal notice reaching us, to your original payment method, in full.",
        "Return method: by cargo. Contact us first to return an item in store.",
      ],
    },
    { type: "h2", text: "1. Right of Withdrawal (Returns Within 14 Days)" },
    {
      type: "p",
      text: "You may withdraw from your order within 14 days of the delivery date, without giving any reason and without paying a penalty. To do so, notify us in writing within this period by email (destek@sultannargile.com), phone (0212 553 05 92 / 0532 787 30 43) or a support request on the site.",
    },
    { type: "h2", text: "2. Condition of Returned Items" },
    {
      type: "ul",
      items: [
        "The item must be unused: no water put in it, no contact with coal or smoke.",
        "The item must be sent complete, with its original box, invoice and all accessories.",
        "The protective packaging, film, tape or seal of hoses, mouthpieces and other parts must be unopened.",
        "The item must be packed carefully in its original box so that it is not damaged in transit.",
      ],
    },
    {
      type: "p",
      text: "Under article 15/1-ç of the Distance Contracts Regulation, the right of withdrawal does not apply to items whose protective packaging has been opened after delivery and whose return is unsuitable for health and hygiene reasons (including hookah sets, bowls, hoses and mouthpieces). Items found to have been used are not accepted for return.",
    },
    { type: "h2", text: "3. How to Return" },
    {
      type: "ol",
      items: [
        "Tell us about your return within 14 days by email, phone or support request, quoting your order number.",
        "Pack the item carefully with its original box, invoice and all parts. For individual orders, fill in and sign the return section of the invoice; for corporate (company) invoices, send the return invoice issued by your company with the item.",
        "Send the parcel with our contracted carrier, Yurtiçi Kargo; return shipping is then paid by us. Returns sent with another carrier are shipped at the customer's cost.",
        "Once the item reaches us and is checked, your return is approved and we let you know.",
      ],
    },
    { type: "h2", text: "4. Refunds" },
    {
      type: "p",
      text: "The refund is made in full to the payment method you used (credit card or bank account) within 14 days of the date your withdrawal notice reaches us at the latest. How long a card refund takes to appear on your account depends on your bank. For orders we cancel because an item is out of stock, the amount paid is refunded within 3 days.",
    },
    { type: "h2", text: "5. Exchanges" },
    {
      type: "p",
      text: "If you would like to exchange an item for another colour, model or type, you can contact us within 30 days of delivery. The item must be unused, undamaged, with its hygienic protective packaging unopened, and resaleable. Exchanges are made with the shop's approval; for approved exchanges, the customer pays shipping both ways.",
    },
    { type: "h2", text: "6. Damaged or Defective Items" },
    {
      type: "ul",
      items: [
        "If the parcel shows clearly visible damage, breakage or crushing at delivery, have the courier draw up a \"Damage Assessment Report\".",
        "Report shipping damage you notice after opening the parcel to us in writing, with photos or video, within 3 days of delivery at the latest.",
        "For defective items, your rights under Consumer Protection Law No. 6502 are reserved: a refund, a replacement, free repair or a price reduction. Return and exchange shipping for defective and damaged items is paid by us.",
      ],
    },
    { type: "h2", text: "7. Contact" },
    {
      type: "p",
      text: "Sultan Nargile / Pınar Kuş · Soğanlı Mah. Site Sok. No:5/A Bahçelievler / İstanbul · Phone: 0212 553 05 92 · 0532 787 30 43 · Email: destek@sultannargile.com",
    },
  ],
};

export const RETURNS_DOCUMENT_AR: BilgiDocument = {
  slug: RETURNS_SLUG,
  title: "شروط الإلغاء والإرجاع والاستبدال",
  sourceTitle: "İPTAL, İADE VE DEĞİŞİM KOŞULLARI",
  description:
    "شروط الإرجاع والاستبدال لدى سلطان نرجيلة: حق العدول خلال 14 يومًا، شحن إرجاع مجاني، منتج غير مستخدم بتغليف غير مفتوح، استبدال خلال 30 يومًا، واسترداد المبلغ خلال 14 يومًا.",
  blocks: [
    NOTICE_AR,
    {
      type: "p",
      text: "فيما يلي شروط الإرجاع والاستبدال للطلبات المقدمة عبر nargilemalzemesi.com. هذه الصفحة ملخص لأحكام الإرجاع في عقد البيع عن بعد، والنص الملزم هو العقد نفسه.",
    },
    { type: "h2", text: "ملخص" },
    {
      type: "ul",
      items: [
        "مدة الإرجاع: 14 يومًا من تاريخ الاستلام (حق العدول) دون الحاجة إلى ذكر سبب.",
        "حالة المنتج: غير مستخدم، في علبته الأصلية، وتغليفه الواقي (النايلون، الشريط، الختم) غير مفتوح، وقابل لإعادة البيع. يمكن دائمًا إرجاع المنتجات المعيبة أو التالفة.",
        "تكلفة شحن الإرجاع: علينا في حالات حق العدول والمنتجات المعيبة/التالفة (عند الإرسال مع شركة الشحن المتعاقدة معنا).",
        "الاستبدال: مقبول خلال 30 يومًا من الاستلام، وتكلفة الشحن ذهابًا وإيابًا على المشتري.",
        "استرداد المبلغ: خلال 14 يومًا كحد أقصى من وصول إشعار العدول إلينا، كاملًا وبطريقة الدفع نفسها.",
        "طريقة الإرجاع: عبر الشحن. للإرجاع في المتجر تواصل معنا مسبقًا.",
      ],
    },
    { type: "h2", text: "1. حق العدول (الإرجاع خلال 14 يومًا)" },
    {
      type: "p",
      text: "يمكنك العدول عن طلبك خلال 14 يومًا من تاريخ الاستلام دون ذكر أي سبب ودون دفع أي غرامة. يكفي أن تُبلغنا كتابيًا خلال هذه المدة عبر البريد الإلكتروني (destek@sultannargile.com) أو الهاتف (0212 553 05 92 / 0532 787 30 43) أو طلب الدعم على الموقع.",
    },
    { type: "h2", text: "2. حالة المنتجات القابلة للإرجاع" },
    {
      type: "ul",
      items: [
        "يجب أن يكون المنتج غير مستخدم: لم يوضع فيه ماء ولم يلامس الفحم أو الدخان.",
        "يجب إرسال المنتج كاملًا مع علبته الأصلية وفاتورته وجميع ملحقاته.",
        "يجب ألا يكون التغليف الواقي أو النايلون أو الشريط أو الختم للخراطيم والمباسم والقطع الأخرى قد فُتح.",
        "يجب تغليف المنتج بعناية في علبته الأصلية حتى لا يتضرر أثناء الشحن.",
      ],
    },
    {
      type: "p",
      text: "وفقًا للمادة 15/1-ç من لائحة العقود عن بعد، لا يمكن استخدام حق العدول في المنتجات التي فُتح تغليفها الواقي بعد التسليم ولا يناسب إرجاعها من ناحية الصحة والنظافة (بما في ذلك أطقم النرجيلة والرؤوس والخراطيم والمباسم). لا تُقبل إعادة المنتجات التي يتبين أنها استُخدمت.",
    },
    { type: "h2", text: "3. كيفية الإرجاع" },
    {
      type: "ol",
      items: [
        "أبلغنا بطلب الإرجاع خلال 14 يومًا عبر البريد الإلكتروني أو الهاتف أو طلب الدعم، مع ذكر رقم الطلب.",
        "غلّف المنتج بعناية مع علبته الأصلية وفاتورته وجميع قطعه. في الطلبات الفردية املأ قسم الإرجاع في الفاتورة ووقّعه، وفي الفواتير المؤسسية (باسم شركة) أرسل مع المنتج فاتورة الإرجاع الصادرة عن شركتك.",
        "أرسل الطرد مع شركة الشحن المتعاقدة معنا Yurtiçi Kargo، وعندها تكون تكلفة شحن الإرجاع علينا. أما المرتجعات المرسلة مع شركة شحن أخرى فتكلفة شحنها على المشتري.",
        "بعد وصول المنتج إلينا وفحصه تتم الموافقة على الإرجاع ونُعلمك بذلك.",
      ],
    },
    { type: "h2", text: "4. استرداد المبلغ" },
    {
      type: "p",
      text: "يُردّ المبلغ كاملًا إلى وسيلة الدفع التي استخدمتها (بطاقة ائتمان أو حساب بنكي) خلال 14 يومًا كحد أقصى من تاريخ وصول إشعار العدول إلينا. تعتمد مدة ظهور المبلغ المسترد في حساب البطاقة على البنك. وفي الطلبات التي نلغيها لعدم توفر المنتج في المخزون يُردّ المبلغ المدفوع خلال 3 أيام.",
    },
    { type: "h2", text: "5. الاستبدال" },
    {
      type: "p",
      text: "إذا رغبت في استبدال المنتج بلون أو طراز أو نوع آخر، يمكنك التقدم بطلب خلال 30 يومًا من تاريخ الاستلام. يجب أن يكون المنتج غير مستخدم وغير تالف وتغليفه الصحي الواقي غير مفتوح وقابلًا لإعادة البيع. يتم الاستبدال بموافقة المتجر، وفي حالات الاستبدال الموافق عليها تكون تكلفة الشحن ذهابًا وإيابًا على المشتري.",
    },
    { type: "h2", text: "6. المنتجات التالفة أو المعيبة" },
    {
      type: "ul",
      items: [
        "إذا كان في الطرد ضرر أو كسر أو انبعاج ظاهر عند التسليم، فاطلب من موظف الشحن تحرير \"محضر إثبات الضرر\".",
        "أبلغنا كتابيًا بضرر الشحن الذي تلاحظه بعد فتح الطرد، مع صور أو فيديو، خلال 3 أيام كحد أقصى من تاريخ الاستلام.",
        "في المنتجات المعيبة تبقى حقوقك بموجب قانون حماية المستهلك رقم 6502 محفوظة: استرداد المبلغ أو الاستبدال أو الإصلاح المجاني أو التخفيض. تكلفة شحن الإرجاع والاستبدال للمنتجات المعيبة والتالفة علينا.",
      ],
    },
    { type: "h2", text: "7. التواصل" },
    {
      type: "p",
      text: "Sultan Nargile / Pınar Kuş · Soğanlı Mah. Site Sok. No:5/A Bahçelievler / İstanbul · الهاتف: 0212 553 05 92 · 0532 787 30 43 · البريد الإلكتروني: destek@sultannargile.com",
    },
  ],
};
