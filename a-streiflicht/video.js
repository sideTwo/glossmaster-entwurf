/* Hintergrund-Loops (stumm, ohne Ton, nur Bild).
   - Videos laden erst, wenn sie gebraucht werden (data-src → src), vorher zeigt das Standbild (poster).
   - data-loop="kopf": läuft, solange der Seitenkopf sichtbar ist.
   - data-loop="karte": mit Maus beim Darüberfahren, am Handy die Karte in der Bildschirmmitte.
   - Bei „Bewegung reduzieren“ oder Datensparmodus läuft nichts, das Standbild bleibt. */
(() => {
  const vids = [...document.querySelectorAll('video[data-loop]')];
  if (!vids.length || !('IntersectionObserver' in window)) return;
  const sparen = navigator.connection && navigator.connection.saveData;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || sparen) return;

  const maus = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const karteVon = v => v.closest('.kurs');
  const spiel = v => {
    if (!v.getAttribute('src')) v.src = v.dataset.src;
    const p = v.play();
    if (p) p.catch(() => {});
    karteVon(v)?.classList.add('laeuft');
  };
  const halt = v => { v.pause(); karteVon(v)?.classList.remove('laeuft'); };

  const kopf = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? spiel : halt)(e.target)), { threshold: 0.15 });
  const mitte = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? spiel : halt)(e.target)), { rootMargin: '-38% 0px -38% 0px' });

  vids.forEach(v => {
    if (v.dataset.loop === 'kopf') return kopf.observe(v);
    if (!maus) return mitte.observe(v);
    const k = karteVon(v);
    k.addEventListener('mouseenter', () => spiel(v));
    k.addEventListener('mouseleave', () => halt(v));
    k.addEventListener('focusin', () => spiel(v));
    k.addEventListener('focusout', () => halt(v));
  });
})();
