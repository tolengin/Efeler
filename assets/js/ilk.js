/* =========================================================================
   İlk boyamadan önce çalışır (her sayfanın <head>'inde, defer'siz).
   1. Tema: kayıtlı tercih, yoksa cihaz ayarı. JS sınıfı.
   2. Çerçeve koruması: sayfa başka bir sitenin çerçevesi (iframe) içinde
      açılırsa kendini üst pencereye taşır; tarayıcı izin vermezse içeriği
      gizleyip "siteyi açın" bağlantısı gösterir. GitHub Pages bunu HTTP
      başlığıyla yapmaya izin vermediği için JavaScript'le yapılır.
   ========================================================================= */

(function (d, w) {
  var root = d.documentElement;
  var theme;

  try { theme = w.localStorage.getItem('efeler-tema'); } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
  root.classList.add('js');

  var framed;
  try { framed = w.top !== w.self; } catch (e) { framed = true; }
  if (!framed) return;

  root.classList.add('is-framed');
  try { w.top.location.replace(w.location.href); } catch (e) {}

  d.addEventListener('DOMContentLoaded', function () {
    var link = d.createElement('a');
    link.className = 'frame-break';
    link.href = w.location.href;
    link.target = '_top';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Efeler Toptan Et sitesini açmak için dokunun →';
    d.body.appendChild(link);
  });
})(document, window);
