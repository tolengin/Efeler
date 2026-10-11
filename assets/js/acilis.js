/* =========================================================================
   Açılış perdesi (yalnızca index.html, <head>'de ilk.js'ten sonra, defer'siz)
   Oturumda bir kez: kırmızı perde ortadan ikiye bölünüp açılır; amblem sol
   perdenin sağ kenarına yapışık, onunla tek parça çıkar. Hareketler style.css'teki
   "Açılış perdesi" bölümünde. main.js'ten bağımsızdır: o yüklenmese de çalışır.
   JavaScript kapalıysa perde hiç görünmez; hata ya da yavaş yüklemede en geç
   LIMIT süresinde açılır.
   ========================================================================= */

(function (d, w) {
  var root = d.documentElement;
  var KEY = 'efeler-acilis';
  var LOGO = 'assets/img/efeler-logo-ilk.svg';   // perdedeki logo
  var HOLD = 1200;     // amblem 0.4 sn'de belirir, en az 0.8 sn tam görünür kalır
  var LIMIT = 4000;    // sayfa bu sürede yüklenmezse de açılır
  var seen, opened = false, loaded = false, logoAt = 0;

  // Betik <head>'de çalışır; perde öğesi <body>'nin başında, okununca bulunur
  function withSplash(fn) {
    var el = d.querySelector('[data-splash]');
    if (el || d.readyState !== 'loading') fn(el);
    else d.addEventListener('DOMContentLoaded', function () { fn(d.querySelector('[data-splash]')); });
  }

  function remove(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  try { seen = w.sessionStorage.getItem(KEY); } catch (e) {}
  if (seen) {
    withSplash(remove);
    // Perde yok: sayfa, kapak yazı tipleri hazır olana kadar en çok 300 ms görünmez kalır (yedek yazı tipi görünmesin)
    var fonts = d.fonts;
    if (fonts && fonts.load && w.Promise) {
      var show = function () { root.classList.remove('fonts-wait'); };
      root.classList.add('fonts-wait');
      w.setTimeout(show, 300);
      try {
        w.Promise.all([
          fonts.load('900 1em "Big Shoulders Display"', 'Aİ'),
          fonts.load('400 1em "Hanken Grotesk"', 'aş')
        ]).then(show, show);
      } catch (e) { show(); }
    }
    return;
  }

  function open() {
    if (opened) return;
    opened = true;
    var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('splash-open');
    // Geçiş bitince katman kaldırılır, kaydırma serbest kalır (transitionend'e güvenilmez)
    w.setTimeout(function () {
      remove(d.querySelector('[data-splash]'));
      root.classList.remove('splash-on');
    }, reduce ? 350 : 950);
  }

  function check() {
    if (opened || !loaded || !logoAt) return;
    var wait = logoAt + HOLD - Date.now();
    if (wait > 0) w.setTimeout(check, wait);
    else open();
  }

  w.setTimeout(open, LIMIT);
  root.classList.add('splash-on');
  try {
    w.sessionStorage.setItem(KEY, '1');
  } catch (e) {}
  try {
    // Logo hemen inmeye başlar; inince perdedeki <img>'e konup belirir
    var logo = new Image();
    logo.onload = function () {
      withSplash(function (el) {
        var img = el && el.getElementsByTagName('img')[0];
        if (!img) { open(); return; }
        img.src = LOGO;
        logoAt = Date.now();
        root.classList.add('splash-logo');
        check();
      });
    };
    logo.onerror = function () {
      logoAt = Date.now() - HOLD;
      check();
    };
    logo.src = LOGO;
    // Sayfa yüklenince yazı tiplerini de bekle (yedek yazı tipi perdenin arkasında kalsın)
    w.addEventListener('load', function () {
      var fonts = d.fonts;
      if (fonts && fonts.ready && fonts.status !== 'loaded') {
        fonts.ready.then(function () {
          loaded = true;
          check();
        });
      } else {
        loaded = true;
        check();
      }
    });
  } catch (e) {
    open();
  }
})(document, window);
