"""Cek kamus terjemahan (i18n/en.js, i18n/ar.js) terhadap teks Indonesia di index.html.

Pemakaian (server lokal harus jalan: `python3 -m http.server 8000` di akar repo; butuh `pip install playwright`):
    python3 tools/i18n-cek.py                      # http://127.0.0.1:8000/
    python3 tools/i18n-cek.py http://127.0.0.1:8780/

Mengumpulkan semua kunci (satuan HTML statis + atribut + teks skrip lewat LCDU_T) dari halaman Indonesia
(?lang=id&i18n-rekam), lalu menampilkan kunci yang BELUM ada di tiap kamus. Nama diri, angka, dan teks Arab asli
memang tidak perlu diterjemahkan (disaring). Bila teks Indonesia di index.html diubah, kunci lama di kamus harus diganti
dengan kunci baru yang dicetak skrip ini.
"""
import asyncio, json, re, sys
from pathlib import Path
from playwright.async_api import async_playwright

AKAR = Path(__file__).resolve().parent.parent
URL = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8000/').split('?')[0]
ABAIKAN = re.compile(r"^(\d+|\||[؀-ۿ\sً-ْٰ]+|LCDU|Placement Test|.*Alfa Centauri|English Now|"
                     r"Yayasan Taqwa Cerdas Kreatif|Bank Muamalat|[\d.]+|[\d-]+|Jl\. .*|Language Course for Da'wah dan Ummah|"
                     r"For a Better Ummah|TKT.*|CELTA|DELTA.*|Aqsa Working Group.*)$")

def kamus(lang):
    teks = (AKAR / 'i18n' / f'{lang}.js').read_text(encoding='utf-8')
    return json.loads(teks[teks.index('= {') + 2:teks.rstrip().rstrip(';').rindex('}') + 1])['k']

async def kumpulkan():
    async with async_playwright() as p:
        b = await p.chromium.launch(); kunci = []
        for vp, hp in (((1440, 900), False), ((390, 844), True)):
            c = await b.new_context(viewport={'width': vp[0], 'height': vp[1]}, is_mobile=hp, has_touch=hp)
            pg = await c.new_page()
            await pg.goto(URL + '?lang=id&i18n-rekam'); await pg.wait_for_timeout(2500)
            if not hp:   # teks yang baru muncul setelah interaksi (Tim, cari FAQ)
                for i in range(await pg.locator('.tim-wajah-btn').count()):
                    await pg.locator('.tim-wajah-btn').nth(i).click(force=True)
                for q in ('jadwal', 'zzzz', ''): await pg.fill('#faq-q', q)
            for k in (await pg.evaluate('LCDU_I18N.statis')) + (await pg.evaluate('LCDU_I18N.rekam()')):
                k = k.lstrip('@')
                if k not in kunci: kunci.append(k)
            await c.close()
        await b.close()
        return kunci

kunci = asyncio.run(kumpulkan())
for lang in ('en', 'ar'):
    k = kamus(lang)
    belum = [x for x in kunci if x not in k and not ABAIKAN.match(x)]
    usang = [x for x in k if x not in kunci and not x.startswith('peran: ')]
    print(f'== {lang}: {len(k)} kunci, belum diterjemahkan {len(belum)}, tidak terlihat di halaman uji {len(usang)} (bisa teks bersyarat; cek dulu sebelum menghapus)')
    for x in belum: print('  + ' + x)
    for x in usang: print('  - ' + x)
