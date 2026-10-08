/* =========================================================================
   Efeler Toptan Et — ana sayfa davranışları

   Firma bilgileri aşağıdaki SITE nesnesinden değiştirilir; sayfadaki metin ve
   bağlantılar buradan kurulur. index.html'de aynı bilgiler, JavaScript kapalıyken
   de görünsün diye düz metin olarak da yazılı: bir bilgi değişince orayı da
   güncelleyin. Boş bırakılan alan için sayfadaki metin ([E-POSTA] gibi) kalır.
   ========================================================================= */

const SITE = {
  unvan: 'Efeler Et Gıda San. ve Tic. Ltd. Şti.',   // Alt bilgideki © satırı
  telefon: '0530 342 25 40',  // Sayfada göründüğü biçimde. Arama bağlantısı +90 ile kurulur.
  whatsapp: '905303422540',   // Ülke kodlu, yalnız rakam: 90 ile başlar, başta + ya da 0 yok.
  eposta: '',
  adres: 'İsmetpaşa Mh. 85/1 Sk. No: 8/10 A, Sultangazi / İstanbul',  // Alt bilgide son virgülden iki satıra bölünür
  yetkililer: [               // Alt bilgide ad ve tıklanabilir telefon
    { ad: 'Ali Seydi Öter', telefon: '0530 342 25 40' },
    { ad: 'Zeynep Sude Öter', telefon: '0530 049 00 77' },
  ],
  sehir: 'İSTANBUL',          // Kapaktaki "TOPTAN ET TEDARİKÇİSİ · İSTANBUL" satırı
  calismaSaatleri: '06:00 – 17:00',
  kurulusYili: '2023',
  gunlukKapasite: '1 TON',
  teslimatBolgesi: 'İSTANBUL',
  teslimatAyrinti: 'Avrupa & Anadolu Yakası',  // Teslimat bölgesinin altındaki küçük satır
  instagram: '',              // Tam adres, https:// ile
  facebook: '',               // Tam adres, https:// ile
};

(function () {
  'use strict';

  // WhatsApp sohbeti bu cümleyle açılır (butonlar ve form mesajının ilk satırı)
  const WA_SELAM = 'Merhaba, teklif almak istiyorum.';
  const WA_EKSIK = 'WhatsApp numarası eklenince bu form doğrudan mesaj olarak gidecek.';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const digits = (value) => String(value).replace(/\D/g, '');
  const siteValue = (key) => String(SITE[key] ?? '').trim();
  const waUrl = (text) => 'https://wa.me/' + digits(SITE.whatsapp) + (text ? '?text=' + encodeURIComponent(text) : '');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Türkiye numarası uluslararası biçimde aranır: "0530 342 25 40" → tel:+905303422540
  const telHref = (value) => {
    const d = digits(value);
    return 'tel:+' + (d.startsWith('90') ? d : '90' + d.replace(/^0/, ''));
  };

  /* ---------- 1. Yer tutucular ----------
     data-site="anahtar"       → metni SITE değeriyle değiştirir (data-upper varsa Türkçe büyük harf,
                                 data-lines varsa son virgülden iki satıra böler)
     data-site-href="anahtar"  → bağlantıyı kurar (tel:, mailto:, wa.me, harita, sosyal medya)
     data-yetkililer           → SITE.yetkililer listesini ad + telefon olarak yazar */

  const HREF = {
    telefon: telHref,
    eposta: (v) => 'mailto:' + v,
    whatsapp: () => waUrl(WA_SELAM),
    adres: (v) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v),
    instagram: (v) => v,
    facebook: (v) => v,
  };

  function setLines(el, value) {
    const cut = value.lastIndexOf(',');
    if (cut < 0) el.textContent = value;
    else el.replaceChildren(value.slice(0, cut).trim(), document.createElement('br'), value.slice(cut + 1).trim());
  }

  function applyPeople() {
    const list = $('[data-yetkililer]');
    const people = (SITE.yetkililer || []).filter((person) => String(person.ad || '').trim());
    if (!list || !people.length) return;

    list.replaceChildren(...people.map((person) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = person.ad.trim();
      item.append(name);
      const phone = String(person.telefon || '').trim();
      if (phone) {
        const link = document.createElement('a');
        link.href = telHref(phone);
        link.textContent = phone;
        item.append(link);
      }
      return item;
    }));
  }

  function applySite() {
    $$('[data-site]').forEach((el) => {
      let value = siteValue(el.dataset.site);
      if (!value) return;
      if (el.hasAttribute('data-upper')) value = value.toLocaleUpperCase('tr-TR');
      if (el.hasAttribute('data-lines')) setLines(el, value);
      else el.textContent = value;
    });

    $$('[data-site-href]').forEach((el) => {
      const key = el.dataset.siteHref;
      const value = siteValue(key);
      if (!value || !HREF[key] || (key === 'whatsapp' && !digits(value))) return;
      const href = HREF[key](value);
      el.setAttribute('href', href);
      if (/^https?:/i.test(href)) {
        el.target = '_blank';
        el.rel = 'noopener';
      }
    });

    applyPeople();
  }

  /* ---------- Tema (aydınlık / karanlık) ----------
     İlk tema <head> içindeki satır içi betikle seçilir; burada buton ve kayıt yönetilir.
     Kayıtlı tercih yoksa cihaz ayarı değişince sayfa da onu izler. */

  const THEME_KEY = 'efeler-tema';

  function storedTheme() {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function initTheme() {
    const root = document.documentElement;
    const button = $('[data-theme-toggle]');
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let animTimer = null;

    const apply = (theme) => {
      root.setAttribute('data-theme', theme);
      if (button) button.setAttribute('aria-label', theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
    };

    apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    media.addEventListener('change', (event) => {
      if (!storedTheme()) apply(event.matches ? 'dark' : 'light');
    });

    if (!button) return;
    button.hidden = false;

    button.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (!reduceMotion.matches) {
        root.classList.add('theme-anim');
        clearTimeout(animTimer);
        animTimer = setTimeout(() => root.classList.remove('theme-anim'), 250);
      }
      apply(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        // Kayıt yapılamıyorsa (gizli pencere vb.) tema yalnızca bu ziyarette geçerli
      }
    });
  }

  /* ---------- 2. Yapışkan menü ----------
     Üst bilgi şeridi ekrandan çıkınca menü küçülür (logo 52 px, alt çizgi). */

  function initStickyHeader() {
    const header = $('[data-header]');
    const topbar = $('.topbar');
    if (!header || !topbar || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(topbar);
  }

  /* ---------- 3. Mobil menü (900 px altı) ---------- */

  function initMenu() {
    const toggle = $('[data-menu-toggle]');
    const nav = $('[data-nav]');
    const header = $('[data-header]');
    if (!toggle || !nav) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };

    toggle.hidden = false;

    toggle.addEventListener('click', () => {
      const open = !isOpen();
      setOpen(open);
      if (open) $('a', nav).focus();
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    window.matchMedia('(max-width: 899.98px)').addEventListener('change', (event) => {
      if (!event.matches) setOpen(false);
    });
  }

  /* ---------- 4. Kesim şeması ----------
     Fareyle üzerine gelmek önizler; tıklama, dokunma ya da klavye odağı seçer.
     Bir anda tek parça seçili (11 numaranın şemada iki parçası var). */

  function initCutMap() {
    const root = $('[data-cutmap]');
    if (!root) return;

    const parts = $$('.cut', root);
    const items = $$('.cut-item', root);
    let selected = null;

    const show = (n) => {
      parts.forEach((part) => part.classList.toggle('is-active', part.dataset.c === n));
      items.forEach((item) => item.classList.toggle('is-active', item.dataset.c === n));
    };

    const select = (n) => {
      selected = n;
      items.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.c === n)));
      show(n);
    };

    [...parts, ...items].forEach((el) => {
      el.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') show(el.dataset.c);
      });
      el.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') show(selected);
      });
      el.addEventListener('click', () => select(el.dataset.c));
    });

    items.forEach((item) => item.addEventListener('focus', () => select(item.dataset.c)));
  }

  /* ---------- 5. Ürün sekmeleri ----------
     HTML'de gruplar (DANA, KUZU …) alt alta durur; burada sekmeye çevrilir.
     Sekme adı grubun başlığından, sayı listedeki ürünlerden gelir.
     Sol/sağ ok, Home ve End sekmeler arasında gezer. */

  function initProductTabs() {
    const root = $('[data-prod-tabs]');
    if (!root) return;
    const panels = $$('.prod-panel', root);
    const note = $('[data-prod-note]', root);
    if (!panels.length) return;

    const bar = document.createElement('div');
    bar.className = 'prod-tabs__bar';
    const list = document.createElement('div');
    list.className = 'prod-tabs__list';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Ürün grupları');
    bar.append(list);

    const tabs = panels.map((panel) => {
      const count = $$('.prod-list > li', panel).length;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'prod-tab';
      tab.id = panel.id + '-sekme';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);

      const name = document.createElement('span');
      name.textContent = $('.prod-panel__title', panel).textContent.trim();
      const shownCount = document.createElement('span');
      shownCount.className = 'prod-tab__count';
      shownCount.setAttribute('aria-hidden', 'true');
      shownCount.textContent = String(count).padStart(2, '0');
      const spokenCount = document.createElement('span');
      spokenCount.className = 'visually-hidden';
      spokenCount.textContent = ', ' + count + ' ürün';
      tab.append(name, shownCount, spokenCount);

      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      initProductPanel(panel);
      list.append(tab);
      return tab;
    });

    // Dar ekranda çubuk yatay kayar; seçilen sekme tam görünsün
    const reveal = (tab) => {
      const start = tab.offsetLeft;
      const end = start + tab.offsetWidth;
      const behavior = reduceMotion.matches ? 'auto' : 'smooth';
      if (start < list.scrollLeft) list.scrollTo({ left: start, behavior });
      else if (end > list.scrollLeft + list.clientWidth) list.scrollTo({ left: end - list.clientWidth, behavior });
    };

    const select = (index) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      // "Fiyat için listenizi gönderin" notu açık listenin altına taşınır
      if (note) $('.prod-list', panels[index]).after(note);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        select(index);
        reveal(tab);
      });
    });

    list.addEventListener('keydown', (event) => {
      const current = tabs.indexOf(event.target);
      if (current < 0) return;
      const last = tabs.length - 1;
      const next = {
        ArrowRight: current === last ? 0 : current + 1,
        ArrowLeft: current === 0 ? last : current - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
      reveal(tabs[next]);
    });

    root.prepend(bar);
    root.classList.add('is-tabbed');
    select(0);
  }

  /* Ürün satırı ve fotoğraf, kesim şeması gibi: fareyle üzerine gelmek önizler;
     tıklama, dokunma ya da klavye odağı seçer. data-foto'lu ürün kendi fotoğrafını,
     olmayan grubun kapak fotoğrafını gösterir. Dosyası bulunamayan fotoğraf gösterilmez. */

  function initProductPanel(panel) {
    const frame = $('.prod-photo', panel);
    const rows = $$('.prod-list > li', panel);
    const layers = new Map();   // fotoğrafın tam adresi → <img>
    let cover = frame ? $('img', frame) : null;
    let selected = null;
    let current = null;
    let shown = null;

    const fullUrl = (src) => new URL(src, document.baseURI).href;

    const imageFor = (row) => {
      const src = row && row.dataset.foto;
      if (!src) return cover;
      const key = fullUrl(src);
      if (cover && key === cover.src) return cover;
      return layers.get(key) || cover;
    };

    const show = (row) => {
      current = row;
      rows.forEach((item) => item.classList.toggle('is-active', item === row));
      const image = imageFor(row);
      if (image === shown) return;
      // Henüz inmemiş resme geçilmez; inince (hâlâ isteniyorsa) geçilir, o ana kadar eskisi kalır
      if (image && !(image.complete && image.naturalWidth)) {
        image.addEventListener('load', () => show(current), { once: true });
        return;
      }
      shown?.classList.remove('is-shown');
      image?.classList.add('is-shown');
      shown = image;
    };

    const select = (row) => {
      selected = row;
      rows.forEach((item) => item.firstElementChild.setAttribute('aria-pressed', String(item === row)));
      show(row);
    };

    // Dosya yoksa (henüz yüklenmemiş tavuk-kapak.jpg gibi) <img> kaldırılır, yer tutucu görünür
    const dropIfMissing = (img, onMissing) => {
      const drop = () => {
        img.remove();
        onMissing();
        show(current);
      };
      if (img.complete && !img.naturalWidth) drop();
      else img.addEventListener('error', drop, { once: true });
    };

    if (frame) {
      if (cover) {
        cover.classList.add('is-shown');
        shown = cover;
        dropIfMissing(cover, () => { cover = null; });
      }

      // Ürün fotoğrafları kapağın üstüne katman olarak eklenir; geçiş CSS'te
      rows.forEach((row) => {
        if (!row.dataset.foto) return;
        const key = fullUrl(row.dataset.foto);
        if (layers.has(key) || (cover && key === cover.src)) return;
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.width = 1200;
        img.height = 1500;
        img.src = row.dataset.foto;
        frame.append(img);
        layers.set(key, img);
        dropIfMissing(img, () => layers.delete(key));
      });
    }

    rows.forEach((row) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'prod-item';
      button.setAttribute('aria-pressed', 'false');
      button.append(...row.childNodes);
      row.append(button);

      button.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') show(row);
      });
      button.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') show(selected);
      });
      button.addEventListener('click', () => select(row));
      button.addEventListener('focus', () => select(row));
    });
  }

  /* ---------- 6. Belge büyütme ----------
     Kartta data-src doluysa o görsel, boşsa yer tutucu gösterilir.
     data-pdf doluysa pencerede "PDF olarak indir" bağlantısı çıkar. */

  function initDocs() {
    const dialog = $('[data-doc-dialog]');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    const title = $('[data-doc-title]', dialog);
    const name = $('[data-doc-name]', dialog);
    const scan = $('[data-doc-scan]', dialog);
    const pdf = $('[data-doc-pdf]', dialog);
    let opener = null;

    $$('.doc').forEach((card) => {
      const button = $('.doc__open', card);
      const docTitle = $('.doc__title', card).textContent.trim();
      button.setAttribute('aria-label', 'Belgeyi görüntüle: ' + docTitle);

      button.addEventListener('click', () => {
        opener = button;
        title.textContent = docTitle;
        name.textContent = docTitle;

        $('img', scan)?.remove();
        const src = (card.dataset.src || '').trim();
        if (src) {
          const img = document.createElement('img');
          img.src = src;
          img.alt = docTitle + ' belgesinin taraması';
          img.width = 600;
          img.height = 800;
          scan.append(img);
        }

        const pdfSrc = (card.dataset.pdf || '').trim();
        pdf.hidden = !pdfSrc;
        if (pdfSrc) pdf.setAttribute('href', pdfSrc);

        dialog.showModal();
        document.documentElement.classList.add('is-locked');
      });
    });

    // Kapat butonu ya da pencere dışı (backdrop) tıklaması; Esc tarayıcının kendisinde
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-doc-close]')) dialog.close();
    });

    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('is-locked');
      opener?.focus();
    });
  }

  /* ---------- 7. Teklif formu → WhatsApp ----------
     Sunucu yok: alanlar doğrulanır, mesaj oluşturulur, wa.me yeni sekmede açılır. */

  const FORM_RULES = {
    isletme: (v) => (v ? '' : 'İşletme adını yazın.'),
    telefon: (v) => {
      if (!v) return 'Size dönebilmemiz için telefon numaranızı yazın.';
      if (digits(v).length < 10) return 'Telefon numarası eksik görünüyor; alan koduyla birlikte yazın.';
      return '';
    },
    liste: (v) => (v ? '' : 'Hangi üründen ne kadar gerektiğini yazın.'),
  };

  function buildMessage(form) {
    const value = (name) => form.elements[name].value.trim();
    const lines = [WA_SELAM, '', 'İşletme: ' + value('isletme')];
    if (value('yetkili')) lines.push('Yetkili: ' + value('yetkili'));
    lines.push(
      'Telefon: ' + value('telefon'),
      'İşletme türü: ' + value('tur'),
      '',
      'Ürün ve miktar:',
      value('liste'),
    );
    return lines.join('\n');
  }

  function initQuoteForm() {
    const form = $('[data-quote-form]');
    if (!form) return;
    const status = $('[data-form-status]', form);

    const setError = (field, message) => {
      const box = document.getElementById(field.id + '-hata');
      if (message) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      box.textContent = message;
      box.hidden = !message;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      status.textContent = '';

      let firstInvalid = null;
      Object.entries(FORM_RULES).forEach(([name, check]) => {
        const field = form.elements[name];
        const message = check(field.value.trim());
        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (!digits(SITE.whatsapp)) {
        status.textContent = WA_EKSIK;
        return;
      }

      const url = waUrl(buildMessage(form));
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
    });

    // Hatalı alan düzeltilince hata yazısı kalkar
    form.addEventListener('input', (event) => {
      const field = event.target;
      const check = FORM_RULES[field.name];
      if (check && field.getAttribute('aria-invalid') === 'true' && !check(field.value.trim())) {
        setError(field, '');
      }
    });
  }

  /* ---------- 8. Sabit WhatsApp butonu ----------
     Kapak geçilince belirir, teklif bölümü ekrandayken gizlenir. */

  function initFloatingWhatsApp() {
    const button = $('[data-wa-float]');
    const hero = $('[data-hero]');
    const quote = $('[data-quote]');
    if (!button || !hero || !quote || !('IntersectionObserver' in window)) return;

    let pastHero = false;
    let quoteInView = false;
    const update = () => button.classList.toggle('is-visible', pastHero && !quoteInView);

    new IntersectionObserver(([entry]) => {
      pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    }).observe(hero);

    new IntersectionObserver(([entry]) => {
      quoteInView = entry.isIntersecting;
      update();
    }).observe(quote);
  }

  /* ---------- 9. Kaydırınca belirme ----------
     Bölüm başlıkları, ürün listesi ve kartlar ekrana girerken bir kez, hafifçe belirir. */

  function initReveal() {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    $$('.section-head, .prod-tabs, .step, .doc').forEach((el) => {
      const group = el.closest('.steps, .docs');
      if (group) {
        const index = $$('.step, .doc', group).indexOf(el);
        el.style.setProperty('--reveal-delay', (index % 4) * 70 + 'ms');
      }
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  applySite();
  initTheme();
  initStickyHeader();
  initMenu();
  initCutMap();
  initProductTabs();
  initDocs();
  initQuoteForm();
  initFloatingWhatsApp();
  initReveal();
})();
