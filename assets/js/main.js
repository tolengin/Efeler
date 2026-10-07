/* =========================================================================
   Efeler Toptan Et — ana sayfa davranışları

   Firma bilgileri YALNIZCA aşağıdaki SITE nesnesinden değiştirilir.
   Boş bırakılan alanlar için sayfadaki köşeli parantezli metin ([TELEFON] gibi)
   olduğu gibi kalır; JavaScript kapalıyken de sayfa eksiksiz görünür.
   ========================================================================= */

const SITE = {
  telefon: '',          // Sayfada göründüğü biçimde. Arama bağlantısı rakamlardan kurulur.
  whatsapp: '',         // Ülke kodlu, yalnız rakam: 90 ile başlar, başta + ya da 0 yok.
  eposta: '',
  adres: '',
  sehir: '',            // Kapaktaki "TOPTAN ET TEDARİKÇİSİ · [ŞEHİR]" satırı
  calismaSaatleri: '',
  kurulusYili: '',
  gunlukKapasite: '',   // Örn. biçim: "__ TON / GÜN"
  teslimatBolgesi: '',
  instagram: '',        // Tam adres, https:// ile
  facebook: '',         // Tam adres, https:// ile
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

  /* ---------- 1. Yer tutucular ----------
     data-site="anahtar"       → metni SITE değeriyle değiştirir (data-upper varsa Türkçe büyük harf)
     data-site-href="anahtar"  → bağlantıyı kurar (tel:, mailto:, wa.me, sosyal medya) */

  const HREF = {
    telefon: (v) => 'tel:' + v.replace(/[^\d+]/g, ''),
    eposta: (v) => 'mailto:' + v,
    whatsapp: () => waUrl(WA_SELAM),
    instagram: (v) => v,
    facebook: (v) => v,
  };

  function applySite() {
    $$('[data-site]').forEach((el) => {
      const value = siteValue(el.dataset.site);
      if (!value) return;
      el.textContent = el.hasAttribute('data-upper') ? value.toLocaleUpperCase('tr-TR') : value;
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

  /* ---------- 5. Belge büyütme ----------
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

  /* ---------- 6. Teklif formu → WhatsApp ----------
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

  /* ---------- 7. Sabit WhatsApp butonu ----------
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

  /* ---------- 8. Kaydırınca belirme ----------
     Bölüm başlıkları ve kartlar ekrana girerken bir kez, hafifçe belirir. */

  function initReveal() {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    $$('.section-head, .prod, .step, .doc').forEach((el) => {
      const group = el.closest('.prod-grid, .steps, .docs');
      if (group) {
        const index = $$('.prod, .step, .doc', group).indexOf(el);
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
  initDocs();
  initQuoteForm();
  initFloatingWhatsApp();
  initReveal();
})();
