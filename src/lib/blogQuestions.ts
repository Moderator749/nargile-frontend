/**
 * "Blog / SSS" on the homepage, over "Alt SEO Metni": thirteen of the questions
 * of sultannargile.com's blog (its CMS as the page loaded it on 2026-11-05), each with its answer, and the same list as the page's FAQPage
 * JSON-LD. Left out: its "Hangi marka nargile tütünü daha iyidir?", which
 * recommends tobacco brands and points to ordering tobacco — promotion that
 * Law 4207 bars, on a shop that does not sell tobacco.
 *
 * Answers are blocks — a sub-heading, a paragraph or a list — so the page
 * draws them without guessing at a text's line breaks. The four lüle
 * questions are articles of their own on /blog too (lib/blog), and link there.
 *
 * English and Arabic live in lib/content (blogQuestions.en, blogQuestions.ar),
 * question for question under the same ids; read them through
 * `blogQuestions(locale)`.
 */

import { BLOG_HREF } from "@/lib/blog";
import { BLOG_QUESTIONS_AR } from "@/lib/content/blogQuestions.ar";
import { BLOG_QUESTIONS_EN } from "@/lib/content/blogQuestions.en";
import type { FaqItem } from "@/lib/faq";
import type { Locale } from "@/lib/i18n/config";

export type AnswerBlock = { h: string } | { p: string } | { ul: string[] };

export interface BlogQuestion {
  id: string;
  question: string;
  answer: AnswerBlock[];
}

/** Questions that are also a full article on /blog: id → the article's slug. */
const ARTICLES: Record<string, string> = {
  "nargile-lulesi-nedir-cesitleri-var-midir": "nargile-lulesi-nedir",
  "phunnel-ve-killer-lule-arasindaki-fark-nedir": "phunnel-ve-killer-lule-farki",
  "sirli-lule-mi-sirsiz-lule-mi-hangi-luleyi-satin-almaliyim": "sirli-mi-sirsiz-mi-lule",
  "hangi-nargile-lulesini-satin-almaliyim": "hangi-nargile-lulesini-almaliyim"
};

export const BLOG_QUESTIONS: BlogQuestion[] = [
  {
    "id": "nargile-lulesi-nedir-cesitleri-var-midir",
    "question": "Nargile lülesi nedir, çeşitleri var mıdır?",
    "answer": [
      {
        "h": "NARGİLE LÜLESİ"
      },
      {
        "p": "Nargile içimi için tütünün doldurulduğu temel ekipmandır ve içim seansının kalitesinde kritik bir rol oynar. Genellikle 15-25 gram arasında bir tütün kapasitesine sahip olan lüleler; geleneksel olarak sırlı veya sırsız seçenekleriyle çömlek toprağı (killi toprak), kil, seramik ve taş gibi kil türevi malzemelerden üretilir. Bu geleneksel kil türlerinin yanı sıra cam, silikon ve metal malzemelerden üretilen pek çok çeşidi de mevcut olup, lüleler yaygın olarak PHUNNEL ve KILLER tasarımları olmak üzere farklı kategorilere ayrılır."
      }
    ]
  },
  {
    "id": "phunnel-ve-killer-lule-arasindaki-fark-nedir",
    "question": "Phunnel ve Killer lüle arasındaki fark nedir?",
    "answer": [
      {
        "p": "Nargile içim performansını doğrudan etkileyen iki lüle tasarımı Phunnel ve Killer modelleridir. Tasarımlarındaki delik yapıları, hava akışını, duman yoğunluğunu ve aroma süresini tamamen değiştirir."
      },
      {
        "h": "1. Phunnel Lüle Nedir ve Özellikleri Nelerdir?"
      },
      {
        "p": "Phunnel lülelerin tütün çukuru tabanında tek bir merkez delik yer alır. Bu delik, tabandan yaklaşık 10 mm yükselerek etrafında tütün şerbetinin hapsedileceği dairesel bir alan oluşturur. Tütün, bu ortadaki deliğin hizasına kadar doldurulur."
      },
      {
        "ul": [
          "Rahat Hava Akışı: Tütün dolumu yapıldığında ortadaki yükseltilmiş delik kapanmaz. Bu sayede içim esnasında son derece rahat ve akıcı bir hava/duman akışı sağlanır.",
          "Tıkanmaları Önler: Lüle tabanından nargilenin ser (iç) borusuna tütün parçaları düşmez. Böylece boru içinde veya difüzörde tıkanma yaşanmaz.",
          "Temiz Takım ve Uzun Süreli İçim: Tütün şerbeti nargile takımının içine veya şişeye akmaz, takımınız daha temiz kalır. Lülenin içinde hapsolan şerbet tütünü nemli tutarak daha yoğun bir tat ve daha uzun bir içim süresi sunar.",
          "Yumuşak İçim Deneyimi: Lüle üzerinde folyo veya közlük (HMD) kullanılır. Çekim yapıldığında, merkez deliğin üzerinde tütün bulunmadığı için dumanla birlikte daha fazla hava çekilir. Bu da dumanın boğazda daha yumuşak hissedilmesini sağlar."
        ]
      },
      {
        "h": "2. Killer Lüle Nedir ve Özellikleri Nelerdir?"
      },
      {
        "p": "Killer lülelerin tütün çukuru tabanında 4 ile 7 adet arasında değişen delikler bulunur. Tütün dolumu, lüle üst seviyesinin 2-3 mm altında kalacak şekilde, adeta tuz eker gibi gevşek ve havadar yapılmalıdır. Dolum bittiğinde lüle tabanındaki delikler görünmez, yüzeyde sadece tütün tabakası kalır."
      },
      {
        "ul": [
          "Dolum Hassasiyeti: Rahat bir hava akışı elde etmek için tütünün tabandaki delikleri tamamen tıkamamasına özen gösterilmelidir. Hava sirkülasyonunu korumak adına lüle içi elek kullanılması tavsiye edilir.",
          "Yoğun ve Sert Duman Performansı: Duman oluşumu tütünün üst kısmının ısınmasıyla başlar. Killer lülelerde hava akışı doğrudan tütün tabakasının içinden geçerek aşağıya ulaştığı için çekilen duman çok daha yoğun, tok ve nispeten daha sert (ağır) hissedilir. Klasik ve aromayı güçlü hissetmek isteyen içiciler için idealdir."
        ]
      }
    ]
  },
  {
    "id": "sirli-lule-mi-sirsiz-lule-mi-hangi-luleyi-satin-almaliyim",
    "question": "Sırlı lüle mi, sırsız lüle mi? Hangi lüleyi satın almalıyım?",
    "answer": [
      {
        "p": "Çamur türevlerinden (toprak, kil vb.) üretilen lülelerin dış yüzeyine ve tütün çukuruna uygulanan, renk ve desen içeren koruyucu katmana SIR denir. Nargile alışkanlıklarınıza en uygun lüleyi seçmek için sırlı ve sırsız lülelerin özelliklerini yakından inceleyelim:"
      },
      {
        "h": "1. Sırsız Lüleler"
      },
      {
        "ul": [
          "Aroma Performansı (Tek Tat Kullanımı): Üzerinde sır katmanı bulunmayan lüleler, yüksek ısıda fırınlanarak sertleştirilse bile gözenekli yapıları nedeniyle zamanla tütün şerbetini emer. Bu durum, kullanılan tütünün aromasının lüleye tamamen işlemesini sağlar. Bu yüzden sırsız lülelerde her zaman aynı çeşit tütün içilmesi gerekir. Zamanla aroma lüleye yerleşir ve sonraki içimlerde çok daha yoğun, lezzetli bir tat verir. Farklı aromaların kullanılması ise kokuların birbirine karışmasına ve içim keyfinin bozulmasına neden olur.",
          "Lülede Kusma Durumu: Sırsız lülelerde, gözenekler tarafından emilen tütün şerbeti ve yıkama esnasında çekilen su, malzemenin içinde sürekli nemli bir ortam yaratır. İçim esnasında lüle yüksek ısıya maruz kaldığında, içeride hapsolan bu sıvı genleşerek dışarı sızar; lüle yüzeyinde küçük damlacıklar ve akıntılar oluşur. Sektörde bu duruma “lülede kusma” denir. Sürekli aynı tat tüketildiğinde bu durumun içim kalitesine olumsuz bir etkisi olmasa da, oluşturduğu görsel kirlilik keyif kaçırıcı olabilir.",
          "Önemli İpucu: Fırınlama işlemi daha uzun ve yüksek derecede yapılan, daha sert yapıdaki sırsız lülelerde kusma olayı çok daha az görülür."
        ]
      },
      {
        "h": "2. Sırlı Lüleler"
      },
      {
        "ul": [
          "Görsel Çeşitlilik: Lüle üzerine sır uygulanmasının temel amaçlarından biri, ürüne estetik bir güzellik, renk ve desen çeşitliliği katmaktır.",
          "Sırlı Phunnel Lüleler (Çoklu Tat Kullanımı): Sırlı ve Phunnel model olan lüleler, içim esnasında tütün şerbetini asla emmez. Bu sayede aynı lüleyle farklı tütün aromalarını güvenle tüketebilirsiniz, aromalar birbirine karışmaz. Pürüzsüz yüzeyi sayesinde temizliği de son derece kolaydır. Lüle şerbeti emmediği için kusma sorunu yaşanmaz ya da minimum seviyede kalır.",
          "Sırlı Killer Lüleler: Sırlı olsalar bile Killer modellerde delikler tabanda yer aldığı için içim sırasında tütünden süzülen şerbet deliklerin iç çeperlerine yapışabilir veya taban malzemesi tarafından az da olsa emilebilir. Bu yüzden lüle içinde hafif bir koku kalabilir ve çok zıt aromaların ardı ardına içilmesinde sorun yaratabilir. Ancak sırlı yapısı ve pürüzsüz yüzeyi sayesinde temizlenmesi sırsız modellere göre çok daha pratiktir ve kusma neredeyse hiç görülmez."
        ]
      }
    ]
  },
  {
    "id": "hangi-nargile-lulesini-satin-almaliyim",
    "question": "Hangi nargile lülesini satın almalıyım?",
    "answer": [
      {
        "h": "Malzeme ve Tasarım Seçim Rehberi"
      },
      {
        "p": "Nargile piyasası; kil, toprak, seramik, taş, silikon, cam ve metal gibi malzemelerden üretilmiş çok çeşitli lüle seçenekleri sunar. Bu malzemelerden birine karar verdiğinizde, hemen ardından ikinci kritik soru gelir: Phunnel mi, Killer mı?"
      },
      {
        "p": "Nargile takımı, kömür ve tütün doğru seçildiğinde, keyifli bir içim deneyimi tamamen ısı yönetimine bağlıdır. İçime başlarken duman üretimi için gereken ısıya 1-2 dakika içinde ulaşmak ve sonrasında bu ısıyı sabit veya dengeli bir seviyede tutmak hayati önem taşır. Doğru lüle ve Isı Yönetim Cihazı (HMD) seçimi yapılmadığında, ideal sıcaklığı yakalamak için sürekli maşayla kömürleri ayarlamak zorunda kalırsınız. Bu sorunu en aza indirmek için, lüle malzemelerinin ısı performansı üzerindeki etkilerine daha yakından bakalım:"
      },
      {
        "h": "1. Lüle Malzemelerine Göre Isı Performansı"
      },
      {
        "ul": [
          "Toprak, Kil ve Taş Lüleler (En Çok Tercih Edilenler): Taş fırınların ekmek ve lahmacun pişirme konusunda sunduğu avantajları, bu malzemeler nargile tütünü için sunar. Bu lüleler kalınlaştıkça, ağırlaştıkça ve sertleştikçe ısıyı daha etkili hapseder ve daha uzun süre muhafaza eder. Üstteki kömürler küçülse bile lüle tütüne ısı aktarmaya devam eder, böylece duman performansı düşmez. Isınma süreci kademeli olduğu için tütünün yanma riski önemli ölçüde daha düşüktür. Sırlı ve sırsız çeşitleri bulunan bu ürünler, dünya genelinde en çok tercih edilen lüle türleridir.",
          "Seramik Lüleler: Bunlar genellikle çok kalın olmayan, uzun profilli lülelerdir. Hızlı ısınır ve ısıyı tütüne hızla aktarırlar; ancak aynı hızla soğurlar. Başlangıçta duman üretimi için 2 parça kömür kullanılmalı ve aşırı ısıdan kaçınılmalıdır. Sıcaklık dengesi, kapaklı bir Isı Yönetim Cihazı (HMD) kullanılarak daima korunmalıdır.",
          "Silikon Lüleler: Silikon, ısıyı muhafaza ederken yaklaşık 300°C'ye kadar sıcaklığa dayanabilen yalıtkan bir malzemedir. İç lüle sıcaklığını uzun süre sabit tutma kapasitesine sahiptir. En verimli performans için, kapaklı bir Isı Yönetim Cihazı (HMD) ile birlikte kullanılmaları şiddetle tavsiye edilir.",
          "Cam Lüleler: İnce yapıları nedeniyle, ısıyı kontrol etmek metal lülelere kıyasla daha zordur. Kapaklı bir ısı yönetim sistemi (HMD) ile istenen sıcaklık yakalanabilse de, tütünü yakma veya acı bir tat oluşturma riski yüksektir. Ancak, QUASAR marka cam lüleler bu kuralın istisnasıdır. Kalın camdan üretilmiş tütün haznesi ve kalın silikon gövdesiyle dikkat çeken bu ürün, kendine özgü kapaklı ısı yönetim sistemiyle (HMD) bir set halinde satılır. Kapaklı HMD ısıyı dengede tutarken, fazla ısı silikon gövde tarafından emilir. HMD içine 2 parça kömür yerleştirip duman oluşumu için 5 dakika beklemek mükemmel sonuçlar verir. Keyifli ve rahat bir içim deneyimi için Quasar harika bir seçimdir.",
          "Metal Lüleler: İçim sırasında metalik bir tat oluşmasını önlemek amacıyla, ana malzeme olarak genellikle alüminyum tercih edilir. Isıyı son derece hızlı iletirler. Yüksek iletkenlikleri nedeniyle, kullanılan kömür miktarına bağlı olarak lülenin iç sıcaklığı hızla dalgalanır. Bu değişkenlik, sürekli kömür ekleyip çıkarmanızı gerektirir. Özellikle folyo ile kullanıldığında tütünü yakma ve acı tat oluşturma riski son derece yüksektir; bu nedenle metal lüleler genellikle önerilmez."
        ]
      },
      {
        "h": "2. İçim Alışkanlıklarına Göre Model Seçimi (Phunnel ve Killer Karşılaştırması)"
      },
      {
        "p": "Doğru lüle yapısını seçmek, tamamen içimden beklentilerinize ve alışkanlıklarınıza bağlıdır:"
      },
      {
        "ul": [
          "Sık Aroma Değiştiren ve Yumuşak Çekim Tercih Edenler: Farklı tütün aromalarını denemekten hoşlanıyorsanız, daha yumuşak bir çekim arıyorsanız veya \"dark leaf\" (koyu yaprak) tütün kullanmayı planlıyorsanız, sırlı Phunnel veya Quasar modellerini satın almalısınız. Kapaklı ısı yönetim sistemi (HMD) ile set halinde sunulan silikon lüleler de iyi bir alternatif olabilir.",
          "Sık Aroma Değiştiren ve Güçlü/Yoğun Çekim Tercih Edenler: Yoğun aroma notaları ve güçlü bir duman performansı istiyorsanız, sırlı Killer model lüleleri tercih etmelisiniz. (Sırlı yüzey, melasın emilmesini engelleyerek önceki aromaların tadının yeni içime karışmasını önler).",
          "Tek Aroma Kullananlar (Belirli Bir Aroma İçin Özel Kurulum): Farklı aromalar arasında sürekli geçiş yapmayı düşünmüyorsanız, sırlı bir lüle satın almak zorunlu değildir. Güçlü ve yoğun bir çekim deneyimi için Killer modellerini, yumuşak ve rahat bir hava akışı içinse Phunnel modellerini tercih edebilirsiniz. Maksimum performans elde etmek adına, her bir farklı aroma profili için sırsız ve ayrı bir lüle kullanmak en profesyonel yöntemdir."
        ]
      },
      {
        "p": "Zamanla size en uygun tütün markalarını ve aroma profillerini keşfettikçe, herhangi bir günde Phunnel mi yoksa Killer modeli mi kullanacağınıza dair kararınız, doğal olarak yerleşmiş alışkanlıklarınız doğrultusunda şekillenecektir."
      }
    ]
  },
  {
    "id": "nargile-hazirlarken-nelere-dikkat-etmeliyim",
    "question": "Nargile hazırlarken nelere dikkat etmeliyim?",
    "answer": [
      {
        "p": "Nargile içmenin gerçek keyfine varabilmek, hazırlık sürecinden parça seçimine kadar her detayın bir uyum içinde olmasıyla mümkündür. İşte kusursuz bir nargile deneyimi için bilmeniz gereken en önemli püf noktaları:"
      },
      {
        "ul": [
          "Çekiş Performansı ve Tahliye Süreci: Öncelikle hava akışı (çekişi) rahat olan bir nargile takımı seçmelisiniz. Zor çekilen nargileler özellikle yeni başlayanlar için yorucu olabileceği gibi baş ağrısına da yol açabilir. Bununla birlikte, tahliye subaplı bir nargile kullanmak içim kalitesini doğrudan artırır. İçim sırasında tütünün fazla ısıdan yanması durumunda marpuçtan hafifçe üfleyerek şişe içindeki acılaşmış dumanı kolayca tahliye edebilir, böylece seansınızı kurtarabilirsiniz.",
          "Hava Kaçağı ve Doğru Dolum: Nargile takımınızın hava kaçırmadığından emin olmalısınız. Hava kaçıran sistemlerde tütün dengeli ısınmaz ve dumanla birlikte dışarıdan hava çekileceği için performans ciddi oranda düşer. Lüle hazırlarken ise tütünü asla sıkıştırmamalı, adeta tuz eker gibi gevşek ve havadar bir şekilde koymalısınız.",
          "Tütünün Korunması ve Şerbet Dengesi: Paketi açılan tütünleri mutlaka hava sızdırmayan saklama kaplarında muhafaza etmelisiniz. Uçucu aromaların hava ile temas ederek kaybolması tütünün kurumasına neden olur. Tütünü lüleye koymadan önce bir çatal yardımıyla dipten yüzeye doğru iyice karıştırmalısınız; böylece dibe çöken aromatik şerbet tekrar harmanlanır. En kritik kural ise şerbeti kesinlikle sıkmamak ve süzmemektir. Nargile tütününün yaklaşık %75'ini glikoz, gliserin, aromalar ve koruyuculardan oluşan bu şerbet oluşturur. Tütün burada sadece bir taşıyıcıdır; şerbet süzüldüğünde aroma ve duman performansı tamamen yok olur.",
          "Marpuç Seçimi ve Bakımı: Geleneksel deri ve vinleks marpuçlar koku tutma özelliğine sahiptir. Bu nedenle kesinlikle tütün çeşidine göre ayrılmalı ve her aroma için sabit bir marpuç kullanılmalıdır. Ancak bu malzemeler nemden etkilendiği için zamanla mukavvası şişer, derisi çürür ve içindeki tel paslanarak içim esnasında ağza küçük parçalar gelebilir. Hem sağlık hem de tat kalitesi için düzenli olarak yenilenmelidirler. Silikon marpuçlar ise yıkanabilir yapıları sayesinde koku tutmazlar, çok uzun ömürlüdürler ve aroma ayrımı gerektirmezler.",
          "Takım ve Lülelerin Koku Yönetimi: Nargile takımlarının iç boruları metalden imal edildiği için koku tutma özellikleri yoktur; seans sonrasında harbi (fırça) ile yıkamak aromanın temizlenmesi için yeterlidir. Dolayısıyla takımları aromaya göre ayırmak kafeler için sadece ek bir maliyettir. Ancak toprak lüleler gözenekli yapıları nedeniyle kokuyu hapseder. Özellikle nane, gül, limon ve portakal gibi keskin aromaların kokusu lüleye tamamen işler. En profesyonel yöntem lüleleri tütün çeşidine göre ayırmaktır. Kullanılmış bir lülenin kokusunu minimuma indirmek için, temizledikten sonra içi su dolu bir kapta ertesi güne kadar bekletebilirsiniz.",
          "Kömürün Önemi: Tütününüz ne kadar kaliteli olursa olsun, kalitesiz veya yanlış hazırlanmış bir kömür tüm seansı mahvedebilir. En ideal tercih her zaman doğal kömürlerdir. Kömürlerin dış yüzeyinde kesinlikle siyah nokta kalmamalı, tamamen kor haline gelmelidir. Yarı yanmış kömürler nargileye hem kötü bir kömür kokusu verir hem de solunum yoluyla sağlığınızı riske atar."
        ]
      },
      {
        "h": "Son Söz"
      },
      {
        "p": "Unutmayın ki nargile içmek bir keyif, kültür ve ritüel işidir. Lülesinden tütününe, kömüründen marpucuna kadar her detaya özen göstererek bu keyfi en üst seviyeye çıkarmak tamamen sizin elinizdedir."
      },
      {
        "p": "Tüm nargile severlere keyif dolu günler dileriz!"
      }
    ]
  },
  {
    "id": "hangi-nargile-takimini-almaliyim",
    "question": "Hangi nargile takımını almalıyım?",
    "answer": [
      {
        "p": "Kullanım amacına göre nargile seçimi, profosyonel kullanıcı (nargile kafeler) ve bireysel kullanıcılara göre değişmektedir."
      },
      {
        "ul": [
          "35 cm’e kadar olan takımlar küçük boy",
          "35-50 cm arası olan takımlar orta boy",
          "50-65 cm arası olan takımlar büyük boy",
          "65 cm den büyük takımlar battal boy takımlardır"
        ]
      },
      {
        "p": "Biz takımları 5 gruba ayırıp ayrı ayrı inceleyeceğiz."
      },
      {
        "p": "ÇANTALI TAKIMLAR: Delrin, alüminyum ve çelik malzeme ile yapılmış çok fazla model mevcuttur. 45 cm yi takımlar tercih edilmelidir. Oduman ve Legend Hookah markalı ürünlerde iyi örnekler vardır."
      },
      {
        "p": "DÖKÜM NARGİLE TAKIMLARI: Bu nargile takımlarında sadece bakır boru kullanılmakta ve nargile serinin içinden komple geçmektedir. Bu ürün yıllarca kafeler tarafından kullanılmış gayet güzel sonuçlar alınmıştır. Başlangıç için tercih edilebilir. Vidalı şişe ya da geçme şişe tercih edilebilir, geçme şişenin ağzı düzgün olmalı ve hava kaçırmadığından emin olduktan sonra 50 cm ya da 60 cm boyunda olanlar alınmalıdır. Döküm takım almaya karar verildiğinde, sürekli aynı tadı içilmeli ve deri marpuç kullanılmalıdır."
      },
      {
        "p": "KOMPLE CAM NARGİLE TAKIMLARI: Bu ürünlerin cam kalınlıkları çok ince, şişe içine girişler çok dar ve borular camdır. Temizlenmesi zor, kullanımı fazlaca özen istemekte, kırılması durumunda yedek parça temini bulunmamaktadır. Genelde kafelerde kullanılmaktadır. Sorun yaşamayacağınıza inanıyorsanız içimleri güzeldir"
      },
      {
        "p": "YER TİPİ NARGİLE TAKIMLARI: Zamak, alüminyum, ağaç, pirinç ve çelikten imal edilmiş nargile takımlarıdır. Hepsi birbirine yakın özellik ve boylardadır. Bu ürünler de kendi aralarında vidalı ya da kilitli sistem olarak ikiye ayrılır. Alüminyum nargile ve zamak nargileler en kısa ömürlü olanlarıdır, kullanıma göre en fazla 1 sene içinde çürüme başlayacak ya da vida dişlerinde sıkıntılar başlayacaktır; kısa vadeli olarak düşünülebilir. Alüminyum ve zamak nargile ekonomik olmasından dolayı tercih edilir. Bazı markalarda bu malzemeler ile kaliteli üretim yapsalarda kullanım ömrü 3 yılı geçmeyecektir. Pirinç ve çelik malzeme ile yapılmış ürünler sağlamlık açısından en doğru tercih olacaktır, WD Hookah, Oduman ve Legend Hookah gibi markaların Tradi yani klasik modelleri mevcuttur ve uzun yıllar kullanabilirsiniz. Ağaç/ahşap gövdeli nargile takımlara en iyi ve kaliteli örnek Mr.Wood markasıdır ve başka marka tercih edilmemelidir."
      },
      {
        "p": "MASAÜSTÜ NARGİLE TAKIMLARI: Profosyenel kullanıcıların tercih ettiği Sultan Nargile, Legend Hookah ve Oduman gibi markaların çelik ürünleri tercih edildiğinde iyi sonuçlar verecektir. Kullan at ve silikon marpuç kullanılmaktadır. Kendini geliştirmiş içiciler bu takım ile görsel ve lezzet şöleni yapabilirler."
      }
    ]
  },
  {
    "id": "nargile-takimi-alirken-nelere-dikkat-etmeliyim",
    "question": "Nargile takımı alırken nelere dikkat etmeliyim?",
    "answer": [
      {
        "p": "Nargileden keyif almak tüm malzemelerin doğru seçilmesi ile mümkündür. Nargile Kafelerin çoğu bu tercihleri doğru yapmakta ve müşteri memnuniyetini yakalamaktadır. Siz de evinizde aynı kaliteyi yakalamak ve kendi yaptığınız nargileden keyif almak istiyorsanız öncelikle nargile takımınızı ve marpucunuzu doğru seçmelisiniz."
      },
      {
        "ul": [
          "Döküm takımlarda, iç borusu çelik ya da bakır olmalı,",
          "Döküm takımlarda İç boru çapı en az 10 mm olmalı,",
          "İç borusu çelik olmalı,",
          "İç boru çapı 13-15 mm olmalı,",
          "Duman tahliyesi olmalı,",
          "Piknik, seyahat gibi günlerin olacağı, evde muhafaza edileceği ve temizlik aşamaları da düşünülerek küçük ve orta boy, mümkünse çantalı ürünler tercih edilmeli,",
          "Yer tipi takımlarda deri veya silikon marpuç tercih edilmeli, farklı tatlar kullanılacak ise evde kullan at marpuç bulunmalıdır.",
          "Hafif, çok parçalı, alüminyum borulu, ince marpuçlu sıvama takımlar asla tercih edilmemelidir."
        ]
      }
    ]
  },
  {
    "id": "nargile-takimi-nasil-temizlenir",
    "question": "Nargile takımı nasıl temizlenir?",
    "answer": [
      {
        "h": "Nargile takımı ve aksesuarları nasıl temizlenir?"
      },
      {
        "p": "Nargile keyfinizin sürekliliği, nargile takımınızın ve aksesuarlarınızın daha uzun ömürlü olması için temizliğin doğru yapılması çok önemlidir."
      },
      {
        "h": "Nargile takımı temizliği"
      },
      {
        "ul": [
          "Yeni alınan nargile takımları ilk kullanımdan önce mutlaka yıkanmalıdır.",
          "Nargile takımı her kullanımdan sonra yıkanmalı, kilitli ve vidalı sisteme sahip takımlar kullanım sonrası kilitli şekilde bırakılmamalıdır. Sudaki kireç yüzünden kilitli kalma ihtimali vardır. Bu durum takımın imalat detaylarına ve malzemesine bağlı olarak değişkenlik gösterebilir.",
          "Tüm nargile takımları deterjanlı su ile yıkanabilir fakat çok iyi durulanmalı, içim esnasında deterjan kokusu gelmemelidir. Sürekli aynı tat kullanımda sadece su ile yıkamak yeterlidir.",
          "Temizlik esnasında takım yüzeyinde yumuşak dokulu bez ya da sünger kullanılabilir fakat keçemsi dokulu ürünler ile kullanılmamalıdır bu durum kılcal hatta daha derin çiziklere, yüzeyi boyalı, kaplamalı veya farklı dekorlara sahip ürünlerde, boya, kaplama ya da dekorlarda bozulmalara sebep olacaktır.",
          "Nargile takımı yıkandıktan sonra kurulanmalıdır. Özellikle alüminyum ve zamak takımlarda kilit/vida bölgesine özen gösterilmelidir.",
          "Nargilenin iç borusu harbi adı verilen, ince özel bir fırça ile yapılmalıdır.",
          "Nargile şişesi temizliği de aynı şekilde şişeler için üretilmiş fırçalar ile yapılmaktadır. Deterjan kullanılabilir. Dışı dekorlu boyalı şişelerde, dış yüzeyine dikkat edilmeli, sünger veya fırça sürülmemelidir. İçine fırça ve sünger gibi temizlik malzemesi girmeyen ağzı dar şişelerde temizlik yapmak zordur. İçine yarım çay bardağı yağ sökücü veya çamaşır suyu döküp ağzına kadar su ile doldurmalı ve 2 saat kadar bekledikten sonra durulanmalıdır.",
          "Nargile takımınızın temizliği için bulaşık makinası tercih edilmemelidir."
        ]
      }
    ]
  },
  {
    "id": "hangi-nargile-marpucunu-satin-almaliyim",
    "question": "Hangi nargile marpucunu satın almalıyım?",
    "answer": [
      {
        "h": "Marpuç çeşitleri ve seçim rehberi"
      },
      {
        "p": "Nargile pazarında deri, vinleks (vinneks), silikon ve kullan-at olmak üzere farklı marpuç türleri bulunmaktadır. Bu marpuçların tamamı içim için uygundur; ancak her birinin kendine has özellikleri, avantajları ve kullanım alanları vardır. Doğru bir nargile deneyimi için öncelikle marpuçları tanımalı ve tüketim alışkanlıklarınıza göre seçim yapmalısınız."
      },
      {
        "h": "1. Kullan-At Marpuçlar"
      },
      {
        "ul": [
          "Kullanım Alanı: Genellikle nargile kafeler tarafından hijyen amacıyla tercih edilse de ev kullanıcıları için de oldukça pratiktir. Kafeler her içimden sonra bu ürünü çöpe atarken, ev kullanıcıları iyi bakarak defalarca kullanabilir.",
          "Ne Zaman Tercih Edilmeli?: Evinizde çok sık farklı tütün aromaları deniyorsanız, aromaların birbirine karışmaması için elinizin altında birkaç adet kullan-at marpuç bulundurmanızda büyük fayda vardır.",
          "Seçerken Dikkat Edilmesi Gerekenler: Kaliteli hammaddeden üretilmiş, hortum yapısı esnek/yumuşak olan ve plastik başlık (ağızlık) kısmında çapak bulunmayan ürünler tercih edilmelidir."
        ]
      },
      {
        "h": "2. Silikon Marpuçlar"
      },
      {
        "ul": [
          "Uzun Ömürlülük: Malzemenin doğası gereği yıpranmaya karşı son derece dayanıklı ve uzun ömürlüdür.",
          "Koku ve Temizlik: Sürekli aroma değiştiren kullanıcılar için idealdir. Her kullanımdan sonra yıkanabildiği için hortum içinde minimum koku bırakır ve bir sonraki içimde rahatsızlık vermez. Ancak en yüksek verim için silikon hortumda da tek bir aromaya bağlı kalmak her zaman daha iyidir.",
          "Teknik Özellikler: İdeal bir silikon hortumun et kalınlığı 2.5 - 3 mm, iç çapı ise 9 - 12 mm arasında olmalıdır. Çok yumuşak silikonlar tercih edilmemelidir; çünkü yumuşak hortumlar nargileye takıldığında ser (gövde) girişinden bükülüp kırılır ve hava akışını engelleyerek içim kalitenizi düşürür."
        ]
      },
      {
        "h": "3. Deri ve Vinleks Marpuçlar"
      },
      {
        "ul": [
          "Aroma Performansı (Geleneksel İçim): Deri ve vinleks marpuçların en büyük özelliği koku tutma yetenekleridir. Aromalı bir tütünle yapılan tek bir içim bile kokunun marpuca sinmesini sağlar. Bu marpuçlar kesinlikle tütün çeşidine göre ayrılmalı ve sadece o aromayla kullanılmalıdır. Zamanla aroma marpuca tamamen işler ve benzersiz bir içim kalitesi sunar.",
          "Deformasyon ve Sağlık Riskleri: Bu marpuçlar uzun ömürlü değildir. Üretimlerinde kullanılan ahşap, mukavva ve deri gibi malzemeler nargile buharının yarattığı nemden doğrudan etkilenir. Mukavva nemle şişerek çekimi zorlaştırır, deri yüzeyde çürümeye işaret eden kararmalar oluşur. Ayrıca hortuma formunu veren iç teller zamanla paslanır. Şişen mukavvadan ve paslanan tellerden kopan küçük parçacıklar içim esnasında ağza gelerek hem rahatsızlık verir hem de sağlık riski oluşturur. Bu yüzden bu marpuçlar düzenli olarak yenilenmelidir.",
          "Teknik Özellikler ve Uyumluluk: Her nargile takımına doğrudan uyum sağlamazlar; takımınızın marpuç girişinin geleneksel marpuçlara uygun olması gerekir. Başlıkların iç çapı 7 - 10 mm, hortumların iç çapı ise 9 - 13 mm arasında olmalıdır. Naimi Nargile marpuçları, yüksek kalitesiyle tüm bu standartları eksiksiz karşılamaktadır."
        ]
      }
    ]
  },
  {
    "id": "mukemmel-bir-nargile-keyfi-icin-nelere-dikkat-edilmeli",
    "question": "Mükemmel bir nargile keyfi için nelere dikkat edilmeli?",
    "answer": [
      {
        "h": "Mükemmel Bir Nargile Keyfi İçin Altın Kurallar ve Tütün Saklama rehberi"
      },
      {
        "p": "Nargile içiminden en yüksek performansı, yoğun dumanı ve net aromayı almak için hazırlık aşamasında ve tütün bakımında dikkat edilmesi gereken hayati kurallar vardır. Kusursuz bir deneyim için şu noktalara mutlaka özen göstermelisiniz:"
      },
      {
        "ul": [
          "Hava Kaçağı Kontrolü: İçime başlamadan önce nargile takımınızın hava kaçırıp kaçırmadığını mutlaka kontrol etmelisiniz. Hava kaçıran bir takımda ısı dengesi sağlanamaz ve tütün tam performansla ısınmaz. Bu durumda dumanla birlikte dışarıdan hava da çekileceği için duman yoğunluğu azalır ve içim kalitesi ciddi oranda düşer.",
          "Doğru Tütün Dolumu: Tütün, lüle içerisine asla sıkıştırılmamalı; adeta tuz eker gibi gevşek ve havadar bir şekilde konulmalıdır. Gevşek dolum sayesinde hava sirkülasyonu rahatlar, nargilenin çekişi kolaylaşır ve içimi çok daha keyifli hale gelir.",
          "Tütünün Saklanması ve Muhafaza Koşulları: Paketi açılan tütünün saklama koşulları aromanın ömrünü doğrudan belirler. Açılan tütünler mutlaka hava sızdırmayan, vakumlu saklama kaplarında muhafaza edilmelidir. Tütünün içindeki uçucu aromaların hava ile temas ederek uçması, tütünün kurumasına ve kalıcı tat kaybına neden olur. Eğer tütünü çok uzun süre tüketmeyecekseniz, tazeliğini koruması için buzdolabında saklayabilirsiniz.",
          "Dolum Öncesi Karıştırma: Tütün lüleye konulmadan önce, saklama kabının içerisinde bir çatal veya benzeri bir aparat yardımıyla dipten yüzeye doğru iyice karıştırılmalıdır. Bekleme esnasında yer çekimi nedeniyle dibe süzülen aromatik şerbet, karıştırma sayesinde tekrar tütün yapraklarına harmanlanır ve böylece lezzet kaybının önüne geçilmiş olur.",
          "Şerbeti Sıkmamak ve Süzmemek (En Kritik Kural): Nargile tütünü kesinlikle sıkılmamalı ve şerbeti süzülmemelidir. Nargile şerbetinin içerisinde; tütüne asıl lezzetini veren uçucu aromalar, tatlandırmayı artıran glikoz, tütünü yakmadan yoğun duman çıkarmasını sağlayan bitkisel gliserin ve raf ömrünü uzatan koruyucular yer alır. Bu maddelerin oranları üretici firmalara ve tütünün reçetesine göre değişiklik gösterir. Bu bileşenler, 1 kilogram nargile tütününün yaklaşık %75'ini oluşturmaktadır. Aslında tütün yaprağı burada sadece bir \"taşıyıcı\" görevi görür; tüm tat, aroma ve duman performansı bu şerbetin içerisindedir. Şerbetin süzülmesi veya sıkılması durumunda tütün tüm özelliğini kaybeder, aroma yok olur ve nargileden hiçbir verim alınamaz."
        ]
      }
    ]
  },
  {
    "id": "nargile-komuru-nasil-yakilir",
    "question": "Nargile kömürü nasıl yakılır?",
    "answer": [
      {
        "p": "Nargile keyfinizin yarım kalmaması ve en önemlisi sağlığınızı riske atmamanız için nargile kömürünün doğru şekilde yakılması kritik bir öneme sahiptir. Kömürlerinizi hazırlarken şu yöntemleri tercih edebilirsiniz:"
      },
      {
        "ul": [
          "Elektrikli Nargile Ocakları (En Doğru Yöntem): Nargile kömürünü yakmak için en ideal ve güvenli tercih elektrikli nargile ocaklarıdır. Bu ocaklarda kömürlerin tam olarak yanması yaklaşık 10-15 dakika sürer. Yakma işlemi esnasında kömürleri maşa yardımıyla çevirerek her yüzeyinin eşit şekilde kızarmasını (yanmasını) sağlamalısınız.",
          "Açık Havada Gazlı Pürmüz ve Köz Tavası: Açık alanlarda yakım yapacaksanız, küçük bir köz tavası ve gazlı pürmüz çakmak kullanabilirsiniz. Köz tavasının üzerine koyacağınız bir köz bacası, rüzgarı engelleyip ısıyı hapsederek kömürlerin daha hızlı ve tam yanmasını sağlayacaktır. Kömürlerin dış yüzeyinde siyah hiçbir nokta kalmayacak şekilde tamamen kızardığından emin olunmalıdır."
        ]
      },
      {
        "h": "Yarı Yanmış Kömür Kullanmanın Tehlikeleri"
      },
      {
        "p": "Kömürlerin aceleyle, tamamen kızarmadan nargile üzerine konulması hem sağlığınız hem de içim keyfiniz için büyük riskler taşır:"
      },
      {
        "ul": [
          "Karbonmonoksit Zehirlenmesi Riski: Nargile kömürü yanma aşamasındayken yüksek miktarda karbonmonoksit ve karbondioksit gazı salınımı yapar. Tamamen kor haline gelmemiş, yarı yanmış kömürlerin nargilede kullanılması doğrudan solunum yoluyla zehirlenmeye yol açabilir. Bunun başlıca belirtileri; baş dönmesi, şiddetli baş ağrısı, öksürük krizi, mide bulantısı, kusma ve bayılmadır.",
          "Tat ve Aroma Bozulması: Yarı yanmış kömürler tütünü dengeli bir şekilde ısıtamaz. Bu durum tütünün yanmasına, ağza acı bir tat gelmesine ve nargilenin aromasının tamamen bozulmasına neden olur."
        ]
      }
    ]
  },
  {
    "id": "nargile-komuru-secimi-nargile-keyfini-ve-sagligi-nasil-etkiler",
    "question": "Nargile kömürü seçimi nargile keyfini ve sağlığı nasıl etkiler?",
    "answer": [
      {
        "h": "Keyifli Bir Nargile İçimi İçin Kömür Seçimine Dikkat!"
      },
      {
        "p": "Birçok platformda nargile içimiyle ilgili çok sayıda tavsiye okumuş olabilirsiniz; bunların büyük kısmı doğru ve faydalı bilgilerdir. Ancak nargileden gerçek anlamda keyif almak, her şeyden önce doğru malzeme seçimiyle mümkündür. Dünyanın en kaliteli tütününü kullanırsanız kullanın, kömür kalitesiz olduğunda hedeflediğiniz performansı ve aromayı alamazsınız. Gerçek bir nargile müdavimi için bu durum tüm keyfi kaçırmaya yeterlidir. İşte bu yüzden, nargilede kullanılan kömür hayati bir önem taşır."
      },
      {
        "h": "Farklı Coğrafyalar, Farklı Kömür Kültürleri"
      },
      {
        "p": "Ülkemizde nargile içiminde genellikle Hindistan cevizi kabuğundan üretilen kömürler ile doğal odun kömürleri tercih edilmektedir. Dünya genelinde ise ülkelerin coğrafi yapılarına ve nargile kültürlerine göre çeşitli alternatifler geliştirilmiştir; meyve ve zeytin çekirdeklerinden, yemiş kabuklarından ve talaşlardan kömürler üretilmiştir. Ancak bu hammaddeler un veya talaş haline getirilip preslenirken, içerisine birtakım katkı maddeleri eklenmektedir. Hatta bazı ürünlerin çabuk tutuşması veya sönmemesi için üretimde kimyasal maddeler ve barut türevleri dahi kullanılmaktadır."
      },
      {
        "h": "Kalitesiz Kömürlerin Sağlığa ve Keyfe Etkileri"
      },
      {
        "p": "Geçmişte ülkemizde de uzun süre kullanılan bu tarz katkılı ürünler; baş ağrısı, baş dönmesi, mide bulantısı, boğazda yanma, dilde ve damakta uyuşma ile ağızda kötü tat bırakma gibi pek çok yan etkiye neden olmuştur. Tamamen doğal olmayan veya nargile içimine uygun üretilmeyen bu ürünler, tüketiciler arasında haklı bir memnuniyetsizlik ve şikayet dalgası yaratmıştır."
      },
      {
        "p": "Bahsedilen bu olumsuz tecrübeler nedeniyle, piyasadaki pres (sıkma) kömürlerin tamamına uzun süre kaygıyla yaklaşılmıştır. Ancak zaman içinde kömür üretim teknolojileri gelişmiş, tüketicilerin aradığı yüksek kalite standartları yakalanmıştır. Bugün artık neredeyse tüm dünyada, kalitesi tescillenmiş Hindistan cevizi kabuğu kömürleri standart haline gelmiştir."
      },
      {
        "h": "Güvenilir Markaları Tercih Edin"
      },
      {
        "p": "Endonezya’da üretilen bu kömürlerin bazı merdiven altı çeşitlerinde halen kalite sorunları yaşansa da, büyük bir kısmı tamamen doğal yöntemlerle imal edilmektedir. Nargile keyfinizin yarım kalmaması ve sağlığınızı riske atmamanız için kalitesini ve kendini sektörde ispatlamış; Black Coco’s, Coco Pearls, BuCoco, SultanCoco, One Nation ve Venhookah gibi güvenilir markaların ürünlerini tercih etmeniz büyük önem taşımaktadır."
      }
    ]
  },
  {
    "id": "nargile-marpuclari-temizlenir-mi",
    "question": "Nargile marpuçları temizlenir mi?",
    "answer": [
      {
        "h": "Nargile marpucu temizliği"
      },
      {
        "ul": [
          "Deri ve vinneks nargile marpuçları, ilk alımda ser girişi ve sipsi girişi marpuç harbisi ile küçük bir temizlik yapılabilir, kullanıma başladıktan sonra iç temizliği yapmak mümkün değildir su ve nemli ortamlardan uzak tutulmalıdır.",
          "Alüminyum yada çelik marpuç başlıkları harbi/fırça yardımı ile yıkanarak temizlenebilir, yıkadıktan sonra kurulanmalıdır.",
          "Silikon hortumlar sadece içinden su geçirilerek yıkanır. Hortum içindeki kokuyu tamamen almak zordur. İçi yarıya kadar su dolu bir kovaya yarım çay bardağı çamaşır suyu veya yağ sökücü konulur ve hortum su dolu kovanın içinde 2 saat kadar bekletilir, iyice durulanır, durulama işlemi deterjan kokusu çıkana kadar tekrarlanır."
        ]
      }
    ]
  }
];

const BY_LOCALE: Record<Locale, BlogQuestion[]> = { tr: BLOG_QUESTIONS, en: BLOG_QUESTIONS_EN, ar: BLOG_QUESTIONS_AR };

export const blogQuestions = (locale: Locale): BlogQuestion[] => BY_LOCALE[locale];

/** The full article a question has on /blog, if it has one (unprefixed: the page's Link adds the language). */
export const articleHref = (id: string): string | null => (ARTICLES[id] ? `${BLOG_HREF}/${ARTICLES[id]}` : null);

/** An answer's words, line by line: for the FAQPage JSON-LD. */
export const answerText = (answer: AnswerBlock[]): string =>
  answer.map((b) => ("h" in b ? b.h : "p" in b ? b.p : b.ul.join("\n"))).join("\n");

/** The questions as lib/faq's items, for `faqJsonLd`. */
export const asFaqItems = (questions: BlogQuestion[]): FaqItem[] =>
  questions.map((q) => ({ id: q.id, question: q.question, answer: answerText(q.answer) }));
