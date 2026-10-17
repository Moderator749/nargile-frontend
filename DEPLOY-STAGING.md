# Staging dağıtımı — test.nargilemalzemesi.com (Vercel)

Vercel yalnızca bu Next.js ön yüzünü barındırır. FastAPI backend ve PostgreSQL
ayrı bir sunucuda, herkese açık bir HTTPS adresinde çalışmalıdır.

## 0. Ön koşul: herkese açık backend

Backend şu an yalnızca bu Mac'te (`127.0.0.1:8000`). Vercel'deki site buna
ulaşamaz: build geçer, ama ürünsüz sayfalar üretir ve tarayıcıdaki API
çağrıları başarısız olur. Önce backend'i örneğin
`https://api-test.nargilemalzemesi.com` adresinde yayına alın ve şunları yapın:

1. Backend `.env` dosyasına staging ön yüzünü CORS izinlerine ekleyin:

   ```
   CORS_ORIGINS=["https://test.nargilemalzemesi.com"]
   ```

2. Veritabanındaki görsel adresleri yerel makineyi gösteriyor (804 ürün ve
   ana sayfa içeriğinde bir kayıt). Staging veritabanına aktardıktan sonra,
   **yalnızca staging veritabanında** çalıştırın:

   ```sql
   UPDATE products
      SET image_url  = replace(image_url, 'http://127.0.0.1:8000', 'https://api-test.nargilemalzemesi.com'),
          image_urls = replace(image_urls::text, 'http://127.0.0.1:8000', 'https://api-test.nargilemalzemesi.com')::jsonb;
   UPDATE site_content
      SET data = replace(data::text, 'http://127.0.0.1:8000', 'https://api-test.nargilemalzemesi.com')::jsonb;
   ```

3. `saas_backend/media/` klasörünü sunucuya kopyalayın (ürün fotoğrafları
   burada).

4. Migration'ları çalıştırın ve ürünlere eski mağazanın adreslerini verin
   (ürün sayfaları `/product/<slug>` adresinde; eski `/product/<uuid>` ve eski
   mağazanın `/<slug>` adresleri 301 ile buraya gelir):

   ```bash
   .venv/bin/python -m alembic upgrade head
   .venv/bin/python scripts/apply_legacy_product_slugs.py
   ```

## 1. Vercel ortam değişkenleri

Vercel → Project → Settings → Environment Variables (Production ve Preview):

| Değişken | Değer |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://test.nargilemalzemesi.com` |
| `NEXT_PUBLIC_API_URL` | `https://api-test.nargilemalzemesi.com/api/v1` |
| `BACKEND_URL` | Backend'in kendi adresi, örn. `http://209.38.195.227:8000` |
| `NEXT_PUBLIC_ALLOW_INDEXING` | **eklemeyin** (staging indekslenmemeli) |

Tarayıcı API'ye her zaman sitenin kendi `/api/backend/api/v1` yolundan
ulaşır; `next.config.ts` bunu `BACKEND_URL`'e iletir, sunucu tarafı da
`BACKEND_URL`'i doğrudan çağırır. `BACKEND_URL` olmadan Vercel build'i bilerek
hata verir. Backend bu proxy'nin arkasındaysa `NEXT_PUBLIC_API_URL` proxy
yoludur (`https://<site>/api/backend/api/v1`) ve backend `.env`'inde
`PUBLIC_MEDIA_URL=https://<site>/api/backend/media` olmalıdır; görseller de
böylece proxy'den gelir.

`NEXT_PUBLIC_*` değerleri ve `BACKEND_URL` build sırasında koda gömülür. Bir değeri
değiştirdikten sonra yeniden deploy edin. `NEXT_PUBLIC_ALLOW_INDEXING=true`
yalnızca gerçek mağaza alan adına geçildiğinde eklenecek.

## 2. Deploy — Vercel CLI (önerilen)

`saas_frontend` klasöründen:

```bash
npx vercel login
npx vercel link            # yeni proje oluşturun, kök klasör: ./ (saas_frontend)
npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel env add NEXT_PUBLIC_API_URL production
npx vercel env add BACKEND_URL production
npx vercel --prod
```

CLI, commit gerektirmeden klasörü yükler. `.vercelignore` yerel `.env*`
dosyalarını ve `node_modules`'u dışarıda bırakır. `vercel.json` sunucu
fonksiyonlarını Frankfurt bölgesine (`fra1`) sabitler.

**Alternatif — GitHub:** `saas_frontend` deposunu GitHub'a push edin, Vercel'de
"Add New → Project → Import" ile seçin, Root Directory'yi deponun köküne
bırakın ve 1. adımdaki değişkenleri girin.

## 3. Alan adı ve DNS

1. Vercel → Project → Settings → Domains → `test.nargilemalzemesi.com` ekleyin.
2. Turkticaret / DirectAdmin → DNS Management (`nargilemalzemesi.com`):
   - Panelde alt alan adı oluşturulduysa `test` için bir **A kaydı** zaten
     vardır. CNAME ile aynı adda başka kayıt olamaz: önce o A kaydını silin.
   - Yeni kayıt:

     | Ad | Tür | Değer | TTL |
     |---|---|---|---|
     | `test` | `CNAME` | `cname.vercel-dns.com.` | 3600 |

     Vercel, Domains ekranında projeye özel bir değer gösterirse
     (`xxxx.vercel-dns-0xx.com`) onu kullanın. Sondaki noktayı DirectAdmin
     istiyorsa bırakın.
3. Vercel kaydı doğrulayınca SSL sertifikasını kendisi üretir (genelde
   birkaç dakika, DNS yayılımı en çok birkaç saat).

## 4. Kontrol

```bash
npm run verify:seo -- https://test.nargilemalzemesi.com
```

Staging'de beklenen çıktı: robots.txt her şeyi engelliyor, sayfalar `noindex`.
Ana sayfa, bir kategori ve bir ürün sayfasını tarayıcıda açıp görsellerin ve
fiyatların geldiğini kontrol edin.
