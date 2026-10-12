/**
 * The three "Bilgi Sayfaları", as the shop wrote them in Word.
 *
 * Generated from the client's .docx files (`üyelik ve kullanım şartları`,
 * `kargo ve teslimat`, `mesafeli satış`) and kept verbatim: a legal text is
 * published as it was given, so a correction belongs in the source document
 * and then here, never here alone. Only the structure was read from Word —
 * numbered section titles become headings, Word lists stay lists.
 */

export const BILGI_HREF = "/bilgi";

export type BilgiBlock = { type: "h2" | "h3" | "p"; text: string } | { type: "ul" | "ol"; items: string[] };

export interface BilgiDocument {
  slug: string;
  /** The title the site shows; the Word heading is kept in `sourceTitle`. */
  title: string;
  sourceTitle: string;
  description: string;
  blocks: BilgiBlock[];
}

export const bilgiHref = (doc: Pick<BilgiDocument, "slug">) => `${BILGI_HREF}/${doc.slug}`;

export const BILGI_DOCUMENTS: BilgiDocument[] = [
  {
    slug: "uyelik-ve-kullanim-sartlari",
    title: "Üyelik ve Kullanım Şartları",
    sourceTitle: "ÜYELİ ve KULLANIM ŞARTLARI",
    description:
      "Sultan Nargile üyelik ve kullanım şartları: yaş sınırı, telif hakları, hesap güvenliği, fiyatlandırma ve sorumluluğun sınırlandırılması.",
    blocks: [
      {
        type: "h2",
        text: "1. TARAFLAR VE KAPSAM",
      },
      {
        type: "p",
        text: 'Bu internet sitesini ([Sitenizin Adresi]) ziyaret eden, üye olan veya sitedeki hizmetlerden yararlanan tüm kullanıcılar, işbu "Kullanım Şartları"nda yer alan tüm maddeleri peşinen okumuş, anlamış ve onaylamış sayılır. Eğer bu şartları kabul etmiyorsanız, lütfen siteyi kullanmayı sonlandırınız.',
      },
      {
        type: "h2",
        text: "2. YAŞ SINIRLAMASI VE YASAL UYARI",
      },
      {
        type: "p",
        text: "2.1. Sitemizde satışı yapılan nargile takımları ve tütün mamullerine ait aksesuarlar, yasal düzenlemeler gereği yalnızca yetişkinlerin kullanımına yöneliktir.",
      },
      {
        type: "p",
        text: "2.2. Sitemize üye olmak ve alışveriş yapmak için 18 yaşını doldurmuş olmak zorunludur. Alıcı, sisteme kayıt olurken verdiği doğum tarihi ve kimlik bilgilerinin doğruluğunu yasal olarak taahhüt eder. Yanıltıcı beyanlardan doğacak tüm hukuki sorumluluk kullanıcıya aittir.",
      },
      {
        type: "h2",
        text: "3. FİKRİ VE SINAİ MÜLKİYET HAKLARI (TELİF HAKLARI)",
      },
      {
        type: "p",
        text: "Sitede yer alan tüm tasarımlar, metinler, ürün görselleri, videolar, logolar, grafikler ve yazılımlar firmamıza ait olup, fikri ve sınai mülkiyet hukuku kapsamında korunmaktadır. Firmamızın yazılı izni olmaksızın site içeriğinin kısmen veya tamamen kopyalanması, başka mecralarda yayınlanması, ticari amaçla kullanılması veya değiştirilmesi kesinlikle yasaktır. Tespiti halinde yasal işlem başlatılacaktır.",
      },
      {
        type: "h2",
        text: "4. KULLANIM VE HESAP GÜVENLİĞİ",
      },
      {
        type: "p",
        text: "4.1. Üyeler, sitemize kayıt olurken belirledikleri şifrelerin güvenliğinden kendileri sorumludur. Şifrenin üçüncü kişilerle paylaşılması veya yetkisiz kullanımı nedeniyle doğabilecek zararlardan firmamız sorumlu tutulamaz.",
      },
      {
        type: "p",
        text: "4.2. Kullanıcılar, siteyi kullanırken genel ahlaka, kamu düzenine ve Türkiye Cumhuriyeti kanunlarına aykırı davranışlarda bulunamazlar. Sitenin güvenliğini tehdit edecek, yazılımsal olarak işleyişini engelleyecek veya diğer kullanıcılara zarar verecek (virüs, bot, spam vb.) faaliyetlerde bulunulması yasaktır.",
      },
      {
        type: "h2",
        text: "5. HİZMET DEĞİŞİKLİKLERİ VE FİYATLANDIRMA",
      },
      {
        type: "p",
        text: "Firmamız; sitemizde yer alan ürün çeşitliliğini, ürün fiyatlarını, stok durumlarını, kargo şartlarını ve işbu Kullanım Şartları metnini, önceden haber vermeksizin dilediği zaman değiştirme, güncelleme veya yayından kaldırma hakkını saklı tutar. Güncel şartlar sitede yayınlandığı an yürürlüğe girer.",
      },
      {
        type: "h2",
        text: "6. SORUMLULUĞUN SINIRLANDIRILMASI",
      },
      {
        type: "p",
        text: "Sitenin kullanımından, siber saldırılardan, internet kesintilerinden veya kullanıcının hatalı işlem yapmasından kaynaklanabilecek veri kayıpları, donanımsal zararlar veya kar mahrumiyetlerinden firmamız yasal olarak sorumlu tutulamaz.",
      },
      {
        type: "h2",
        text: "7. YÜRÜRLÜK VE DEĞİŞİKLİKLER",
      },
      {
        type: "p",
        text: "İşbu Kullanım Şartları, kullanıcının siteye girdiği veya üye olduğu andan itibaren süresiz olarak yürürlüğe girer. Firmamız, gerekli gördüğü durumlarda bu sözleşme maddelerinde tek taraflı değişiklik yapabilir.",
      },
    ],
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Kargo ve Teslimat Şartları",
    sourceTitle: "KARGO VE TESLİMAT ŞARTLARI",
    description:
      "Sultan Nargile kargo ve teslimat şartları: kargoya teslim süresi, ücretsiz kargo limiti, iade gönderileri ve hasar tespit tutanağı.",
    blocks: [
      {
        type: "ol",
        items: [
          "Siparişleriniz en geç 2 iş günü içerisinde kargoya teslim edilir. Hafta sonu verilen siparişler ise pazartesi günü işleme alınarak kargolanır.",
          "Mağazamızda ücretsiz kargo alt limiti uygulanmaktadır. Siparişinizin ücretsiz kargo kapsamına girip girmediğini ürün sayfasında veya sepetinizde görebilirsiniz.",
          "Limit altında kalan siparişlerde kargo ücreti alıcıya aittir. Alışverişinizi tamamlamak için kargo şartlarını onaylamanız gerekmektedir.",
          "Siparişiniz kargoya teslim edildiğinde, tarafınıza e-posta veya SMS yoluyla bilgilendirme yapılacaktır.",
          "Adres bilgilerinin hatalı girmesi veya müşterinin ürünü teslim almaması nedeniyle kargonun geri dönmesi durumunda siparişiniz iptal edilebilir ya da müşterinin talebi doğrultusunda ikinci gönderim alıcı ödemeli kargo ile gerçekleştirilebilir. Tüketici mevzuatı gereği yasal cayma hakkı kapsamında iptal edilen siparişlerde para iadesi kesintisiz olarak yapılır.",
          "Firmamız, ürünlerinizi hasar görmeyecek şekilde özenle paketler ve sağlam bir şekilde teslim edilmesini garanti eder.",
          "Olası bir iade veya değişim talebinde; ürünü orijinal kutusuyla, hasar görmeyecek ve kırılmayacak şekilde özenle paketleyerek firmamıza sağlam bir şekilde ulaştırması müşterinin sorumluluğundadır.",
          "Kargo teslimatı sırasında üründe açıkça görülebilen hasar/kırık bulunması halinde, alıcı kargo görevlisine 'Hasar Tespit Tutanağı' tutturmakla yükümlüdür. Ürünün teslim alınmasından sonra fark edilen gizli hasar durumlarında ise hasar tespitinin ve görsel kanıtların (fotoğraf/video), teslim tarihinden itibaren en geç 3 gün içinde firmamıza yazılı olarak (e-posta/destek talebi) bildirilmesi zorunludur. Bu sürenin aşılması halinde sorumluluk firmamıza ait olmayacaktır.",
        ],
      },
    ],
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    sourceTitle: "MESAFELİ SATIŞ SÖZLEŞMESİ",
    description:
      "Sultan Nargile mesafeli satış sözleşmesi: teslimat ve stok koşulları, değişim, 14 günlük cayma hakkı ve iade edilemeyen ürünler.",
    blocks: [
      {
        type: "h2",
        text: "1. TARAFLAR",
      },
      {
        type: "h3",
        text: "1.1. SATICI BİLGİLERİ:",
      },
      {
        type: "p",
        text: "Ünvanı: Sultan Nargile / Pınar Kuş",
      },
      {
        type: "p",
        text: "Adresi: Soğanlı mah. site sok.no:5/A Bahçelievler / İstanbul",
      },
      {
        type: "p",
        text: "Telefon: 0212 553 05 92 0532 787 30 43",
      },
      {
        type: "p",
        text: "E-posta: turhan@nargilemalzemesi.com",
      },
      {
        type: "p",
        text: "MERSİS / Vergi Numarası: Vergi No: 5980781207",
      },
      {
        type: "h3",
        text: "1.2. ALICI BİLGİLERİ:",
      },
      {
        type: "p",
        text: "Alışveriş sitesine üye olan veya sipariş veren, faturada ve sipariş formunda bilgileri yer alan kişidir. (Sözleşme onaylandığında sistem bu bilgileri otomatik olarak dolduracaktır.)",
      },
      {
        type: "h2",
        text: "2. SÖZLEŞMENİN KONUSU",
      },
      {
        type: "p",
        text: "İşbu Sözleşme'nin konusu, Alıcı'nın Satıcı'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Kurunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerinin saptanmasıdır.",
      },
      {
        type: "h2",
        text: "3. SÖZLEŞME KONUSU ÜRÜN VE ÖDEME BİLGİLERİ",
      },
      {
        type: "p",
        text: "İnternet sitesi üzerinden elektronik ortamda satın alınan ürün/ürünlerin türü, miktarı, marka/modeli, satış bedeli, ödeme şekli ve sipariş sonlandığı itibarındaki bilgileri, Alıcı'nın beyan ettiği fatura ve teslimat adresindeki gibidir. Sistem, bu bilgileri sipariş anında sözleşmeye otomatik olarak yansıtır.",
      },
      {
        type: "h2",
        text: "4. TESLİMAT, KARGO VE STOK KOŞULLARI",
      },
      {
        type: "p",
        text: "4.1. Siparişler, Alıcı'nın sipariş formunda belirttiği teslimat adresine, en geç 2 iş günü içerisinde kargoya verilmek üzere teslim edilir. Hafta sonuna veya resmi tatillere denk gelen siparişler, takip eden ilk iş günü işleme alınarak kargolanır.",
      },
      {
        type: "p",
        text: "4.2. Mağazamızda ücretsiz kargo alt limiti uygulanmaktadır. Sipariş tutarının bu limitin altında kalması durumunda kargo ücreti Alıcı'ya aittir ve sepet/ödeme ekranında net olarak gösterilir. Alıcı, alışverişi tamamlayarak bu kargo koşullarını kabul etmiş sayılır.",
      },
      {
        type: "p",
        text: "4.3. Sipariş kargoya teslim edildiğinde, Alıcı'nın sistemde kayıtlı olan e-posta veya SMS kanalları üzerinden bilgilendirme yapılır.",
      },
      {
        type: "p",
        text: "4.4. Alıcı'nın adres bilgilerini hatalı/eksik girmesi veya adreste bulunmaması nedeniyle kargonun Satıcı'ya geri dönmesi durumunda; sipariş iptal edilerek ücret iadesi kesintisiz yapılabilir ya da Alıcı'nın talebi doğrultusunda ikinci gönderim alıcı ödemeli kargo ile gerçekleştirilir.",
      },
      {
        type: "p",
        text: "4.5. Sipariş Konusu Ürünün Tedarik İmkânsızlığı (Stok Hatası): Satıcı, sistemsel hatalar, eş zamanlı siparişler veya tedarikçi kaynaklı gecikmeler nedeniyle sipariş konusu ürünün stokta bulunmadığını/tedarik edilemeyeceğini fark ederse; bu durumu öğrendiği tarihten itibaren en geç 3 (üç) gün içinde Alıcı'ya yazılı olarak (e-posta/SMS) bildirmekle yükümlüdür. Bu durumda sipariş iptal edilir ve Alıcı'nın ödemiş olduğu toplam tutar en geç 3 (üç) gün içinde kesintisiz olarak Alıcı'nın banka hesabına/kredi kartına iade edilir. Alıcı, stok hatasından kaynaklanan bu iptal işlemi nedeniyle Satıcı'dan herhangi bir ek tazminat veya cezai şart talep edemeyeceğini kabul eder.",
      },
      {
        type: "h2",
        text: "5. TARAFLARIN HAK AND YÜKÜMLÜLÜKLERİ",
      },
      {
        type: "p",
        text: "5.1. Satıcının Sorumluluğu: Satıcı, sözleşme konusu ürünleri hasar görmeyecek veya kırılmayacak şekilde itina ve özenle paketleyerek Alıcı'ya sağlam bir şekilde ulaştırmayı garanti eder.",
      },
      {
        type: "p",
        text: '5.2. Alıcının Sorumluluğu (Hasar Tespiti): Alıcı, kargo teslimatı sırasında ürünü kontrol etmekle yükümlüdür. Üründe açıkça görülebilen bir hasar, kırık veya ezilme bulunması halinde, Alıcı kargo görevlisine mutlaka "Hasar Tespit Tutanağı" tutturmak zorundadır. Tutanak tutulmayan durumlarda sorumluluk Alıcı\'ya geçer.',
      },
      {
        type: "p",
        text: "5.3. Gizli Hasar Durumu: Teslimat sırasında fark edilemeyen ancak paket açıldığında görülen gizli hasar/kırık durumlarında; Alıcı hasarın fotoğraf ve video gibi görsel kanıtlarını teslim tarihinden itibaren en geç 3 gün içinde Satıcı'ya yazılı olarak (e-posta veya destek talebi) bildirmekle yükümlüdür. Bu sürenin aşılması halinde, hasarın teslimattan sonra oluştuğu kabul edilir.",
      },
      {
        type: "p",
        text: "5.4. İade ve Değişimlerde Paketleme Özeni: Alıcı, yasal hakları kapsamında yapacağı iade veya değişim gönderilerinde; ürünü orijinal kutusuyla, hasar görmeyecek ve kırılmayacak şekilde özenle paketleyerek Satıcı'ya sağlam bir şekilde ulaştırmakle yükümlüdür. Alıcı'nın özensiz paketlemesi nedeniyle yolda hasar gören, kırılan ve yeniden satılabilirlik özelliğini yitiren ürünlerin sorumluluğu Alıcı'ya ait olup, bu tür ürünlerin iadesi kabul edilmez.",
      },
      {
        type: "h3",
        text: "5.5. Değişim Taleplerinde Kargo Ücreti ve Koşulları:",
      },
      {
        type: "ul",
        items: [
          "5.5.1. Değişim Koşulları: Alıcı'nın teslim aldığı ürünü renk, model veya çeşit bazında değiştirmek istemesi durumunda; ürünün teslim tarihinden itibaren en geç 30 (otuz) gün içinde kullanılmamış, hasar görmemiş, hijyenik koruma ambalajı/jelatini açılmamış ve yeniden satılabilirlik özelliğini yitirmemiş olması şartıyla değişim süreci başlatılabilir. Değişim taleplerinin değerlendirilmesi, onaylanması ve işleme alınması hususunda nihai karar ve inisiyatif tamamen Mağazaya (Satıcı'ya) aittir.",
          "5.5.2. Değişimlerde Kargo ve Paketleme Sorumluluğu: Mağaza tarafından onaylanan değişim işlemlerine ait gidiş-dönüş kargo bedeli tamamen Alıcı'ya aittir. Değişimi talep edilen ürünün orijinal kutusu, faturası ve tüm aksesuarları ile birlikte, taşıma esnasında hasar görmeyecek şekilde eksiksiz ve sağlam olarak Satıcı'ya ulaştırılması sorumluluğu tamamen Alıcı'ya aittir. Özensiz paketleme nedeniyle hasarlı, eksik veya Mağaza onayı olmaksızın gönderilen ürünlerin değişim talebi kabul edilmeyecektir.",
        ],
      },
      {
        type: "h2",
        text: "6. CAYMA HAKKI",
      },
      {
        type: "p",
        text: "6.1. Alıcı; ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (ondört) gün içinde, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.",
      },
      {
        type: "p",
        text: '6.2. Cayma hakkının kullanılması için bu 14 günlük süre içinde Satıcı\'ya faks, e-posta veya internet sitesindeki destek/iade talebi üzerinden yazılı bildirimde bulunulması ve ürünün "7. Cayma Hakkı Kullanılamayacak Ürünler" hükümleri çerçevesinde kullanılmamış olması şarttır.',
      },
      {
        type: "p",
        text: "6.3. Cayma hakkı kapsamında iade edilecek ürünlerin kargo ücreti Satıcı'ya aittir. Alıcı, ürünü ancak Satıcı'nın ön bilgilendirme formunda belirttiği anlaşmalı kargo firması ile geri göndermekle yükümlüdür. Farklı bir kargo firması ile gönderilen iadelerin kargo ücreti Alıcı tarafından karşılanır.",
      },
      {
        type: "p",
        text: "6.4.Bireysel Siparişlerde Fatura İbrazı: Alıcı, cayma hakkı kapsamında iade edeceği ürünü, teslim aldığı orijinal faturası (veya e-arşiv faturası) ile birlikte geri göndermekle yükümlüdür. Vergi Usul Kanunu uyarınca, muhasebesel süreçlerin tamamlanabilmesi için varsa fatura üzerindeki açıklama bölümü Alıcı tarafından doldurulmalı ve imzalanmalıdır.",
      },
      {
        type: "p",
        text: '6.5. Kurumsal Siparişlerde İade Faturası Zorunluluğu: İade edilmek istenen ürünün faturası bir kurum/şirket adına (Kurumsal Fatura) düzenlenmiş ise, Alıcı ürünü iade ederken ilgili kurum tarafından düzenlenen "İADE FATURASI" ile birlikte göndermek zorundadır. Faturası kurumlar adına düzenlenen sipariş iadeleri, yasal "İade Faturası" kesilmediği takdirde tamamlanamaz ve ücret iadesi gerçekleştirilemez',
      },
      {
        type: "h2",
        text: "7. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER (HİJYEN VE KULLANIM İSTİSNASI)",
      },
      {
        type: "p",
        text: "7.1. Mesafeli Sözleşmeler Yönetmeliği’nin 15/1-ç maddesi uyarınca; tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı kullanılamaz.",
      },
      {
        type: "p",
        text: "7.2. Nargile Takımlarına Özel Hüküm: Satışı yapılan nargile takımları, lüleler, marpuçlar ve sipsiler kişisel kullanım içeren ürünler kapsamındadır. Bu ürünlerin cayma hakkı dahilinde iade alınabilmesi için:",
      },
      {
        type: "ul",
        items: [
          "Ürünlerin hiçbir şekilde kullanılmamış (içine su doldurulmamış, tütün konulmamış, duman/kömür teması olmamış) olması,",
          "Varsa marpuç, ağızlık (sipsi) veya diğer aparatların koruyucu ambalaj, jelatin, bant veya mühürlerinin açılmamış/bozulmamış olması zorunludur.",
        ],
      },
      {
        type: "p",
        text: "7.3. Deneme amacıyla dahi olsa tütün veya su ile temas etmiş, kullanıldığı tespit edilen ya da hijyenik koruyucu ambalajı açılmış olan nargile takımı ve aparatlarının iadesi sağlık ve hijyen kuralları gereği kesinlikle kabul edilmeyecektir.",
      },
      {
        type: "h2",
        text: "8. UYUŞMAZLIKLARIN ÇÖZÜMÜ VE YETKİLİ MAHKEME",
      },
      {
        type: "p",
        text: "İşbu Sözleşme'nin uygulanmasında, Ticaret Bakanlığı tarafından her yıl ilan edilen değere kadar Alıcı'nın mal veya hizmeti satın aldığı veya ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.",
      },
      {
        type: "h2",
        text: "9. YÜRÜRLÜK",
      },
      {
        type: "p",
        text: "Alıcı, internet sitesi üzerinden siparişini tamamladığında ve ödeme aşamasına geçtiğinde işbu Sözleşme'nin tüm şartlarını okuduğunu ve kabul ettiğini beyan etmiş sayılır. Satıcı, siparişin onaylanmasıyla birlikte bu sözleşmeyi Alıcı'nın kalıcı veri saklayıcısına (e-posta adresine) iletmekle yükümlüdür.",
      },
    ],
  },
];
