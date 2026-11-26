/* Shop-Entwurf: zeigt Übersicht, Produktseite, Warenkorb und Kasse im neuen Design.
   Nur zur Ansicht – der Warenkorb liegt im Browser (sessionStorage), es wird nichts bestellt oder gesendet.
   In WordPress übernimmt das alles WooCommerce; dort bekommen nur die echten Bausteine dieses Aussehen. */
(() => {
  const W = document.body.dataset.wurzel || '';          // Pfad zum Ordner glossmaster-entwurf
  const S = document.body.dataset.shop || '';            // Pfad zum Shop-Ordner
  const P = window.GM_PRODUKTE || [];
  const euro = n => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const finde = id => P.find(p => p.id === id);
  const korb = {
    lesen() { try { return JSON.parse(sessionStorage.getItem('gm-korb') || '[]'); } catch (e) { return []; } },
    schreiben(k) { try { sessionStorage.setItem('gm-korb', JSON.stringify(k)); } catch (e) {} zaehler(); },
    dazu(id, variante, menge) {
      const k = korb.lesen(); const e = k.find(x => x.id === id && x.variante === variante);
      if (e) e.menge += menge; else k.push({ id, variante, menge });
      korb.schreiben(k);
    }
  };
  const preisVon = (p, v) => p.art === 'kurs' ? p.preis : (p.varianten.find(x => x.id === v) || p.varianten[0]).preis;
  const ab = p => p.art === 'kurs' ? euro(p.preis) : 'ab ' + euro(Math.min(...p.varianten.map(v => v.preis)));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function zaehler() {
    const n = korb.lesen().reduce((s, x) => s + x.menge, 0);
    document.querySelectorAll('[data-korb-zahl]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
  }

  const kursIcons = {
    komplett: 'car-front',
    polierschulung: 'drill',
    keramik: 'shield-check',
    leder: 'scissors',
    innen: 'armchair',
    scheinwerfer: 'lightbulb',
    coaching: 'presentation'
  };

  /* ---------- Übersicht ---------- */
  const raster = document.querySelector('[data-raster]');
  if (raster) {
    raster.innerHTML = P.filter(p => p.art === 'pad').map(p => `
      <a class="produkt" href="${S}produkt/?p=${p.id}">
        <div class="produkt-bild"><img src="${W}${p.bild}" alt="${esc(p.name)}" loading="lazy" />
          ${p.lager ? '' : '<span class="nicht-da">Zurzeit nicht vorrätig</span>'}</div>
        <div class="produkt-text">
          <span class="stufe">${esc(p.stufe)}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.kurz)}</p>
          <div class="produkt-fuss"><span class="preis">${ab(p)}</span><span class="knopf rand klein">Ausführung wählen</span></div>
        </div>
      </a>`).join('');
    const kurse = document.querySelector('[data-kurse]');
    // Schulungen als kompakte Karten (Foto, Dauer, Preis, direkt in den Warenkorb) – bewusst kleiner als die Kurskarten der Academy
    if (kurse) kurse.innerHTML = P.filter(p => p.art === 'kurs').map(p => `
      <div class="kurs-karte">
        <div class="kurs-foto"><img src="${W}${p.bild}" alt="" loading="lazy" /></div>
        <div class="kurs-text">
          ${p.dauer ? `<span class="stufe">${esc(p.dauer)}</span>` : ''}
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.kurz)}</p>
          <div class="produkt-fuss"><span class="preis">${euro(p.preis)}</span><button class="knopf voll klein" type="button" data-dazu="${p.id}">In den Warenkorb</button></div>
        </div>
      </div>`).join('');
  }

  /* ---------- Produktseite ---------- */
  const detail = document.querySelector('[data-produkt]');
  if (detail) {
    const p = finde(new URLSearchParams(location.search).get('p')) || P[0];
    document.title = p.name + ' | GlossMaster Shop';
    const gal = p.galerie || [p.bild];
    detail.innerHTML = `
      <div class="galerie">
        <div class="galerie-gross"><img src="${W}${gal[0]}" alt="${esc(p.name)}" data-gross /></div>
        ${gal.length > 1 ? `<div class="galerie-klein">${gal.map((g, i) => `<button type="button" data-bild="${W}${g}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${W}${g}" alt="" /></button>`).join('')}</div>` : ''}
      </div>
      <div class="kauf">
        <a class="zurueck" href="${S}">← Alle Pads</a>
        <span class="stufe">${esc(p.stufe)}</span>
        <h1>${esc(p.name)}</h1>
        <p class="preis-gross"><span data-preis>${euro(p.varianten[0].preis)}</span> <small>inkl. MwSt., zzgl. Versand</small></p>
        <p class="lead">${esc(p.kurz)}</p>
        <fieldset class="varianten"><legend>Ausführung</legend>
          ${p.varianten.map((v, i) => `<label><input type="radio" name="variante" value="${v.id}" ${i === 0 ? 'checked' : ''} /><span>${esc(v.name)}<small>${euro(v.preis)}</small></span></label>`).join('')}
        </fieldset>
        <div class="kauf-zeile">
          <div class="menge"><button type="button" data-minus aria-label="weniger">−</button><input type="number" min="1" value="1" aria-label="Menge" data-menge /><button type="button" data-plus aria-label="mehr">+</button></div>
          ${p.lager ? '<button class="knopf voll" type="button" data-in-korb>In den Warenkorb</button>' : '<span class="nicht-da gross">Zurzeit nicht vorrätig</span>'}
        </div>
        <ul class="haken">${p.punkte.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${p.text ? `<div class="beschreibung"><h2>Beschreibung</h2>${p.text.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      </div>`;
    const menge = detail.querySelector('[data-menge]');
    detail.querySelector('[data-minus]').onclick = () => { menge.value = Math.max(1, +menge.value - 1); };
    detail.querySelector('[data-plus]').onclick = () => { menge.value = +menge.value + 1; };
    detail.querySelectorAll('input[name=variante]').forEach(r => r.onchange = () => { detail.querySelector('[data-preis]').textContent = euro(preisVon(p, r.value)); });
    detail.querySelectorAll('[data-bild]').forEach(b => b.onclick = () => {
      detail.querySelector('[data-gross]').src = b.dataset.bild;
      detail.querySelectorAll('[data-bild]').forEach(x => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true');
    });
    const kn = detail.querySelector('[data-in-korb]');
    if (kn) kn.onclick = () => {
      korb.dazu(p.id, detail.querySelector('input[name=variante]:checked').value, Math.max(1, +menge.value || 1));
      kn.textContent = 'Im Warenkorb ✓'; setTimeout(() => location.href = S + 'warenkorb/', 450);
    };
  }

  /* ---------- Warenkorb / Kasse: Positionen und Summen ---------- */
  function summen() {
    const k = korb.lesen();
    const zwischen = k.reduce((s, x) => s + preisVon(finde(x.id), x.variante) * x.menge, 0);
    const versand = k.some(x => finde(x.id).art === 'pad') ? window.GM_VERSAND : 0;
    return { k, zwischen, versand, gesamt: zwischen + versand, mwst: (zwischen + versand) / 1.19 * 0.19 };
  }
  function summenHtml(s) {
    return `<div class="summe"><span>Zwischensumme</span><b>${euro(s.zwischen)}</b></div>
      <div class="summe"><span>Versand ${s.versand ? '(DHL)' : ''}</span><b>${s.versand ? euro(s.versand) : 'entfällt'}</b></div>
      <div class="summe gesamt"><span>Gesamt</span><b>${euro(s.gesamt)}</b></div>
      <p class="mwst">inkl. ${euro(s.mwst)} MwSt. (19 %)</p>`;
  }
  const liste = document.querySelector('[data-warenkorb]');
  function zeichneKorb() {
    if (!liste) return;
    const s = summen();
    if (!s.k.length) {
      liste.innerHTML = `<div class="leer"><p>Dein Warenkorb ist leer.</p><a class="knopf voll" href="${S}">Zum Shop</a></div>`;
      document.querySelector('[data-korb-summen]').innerHTML = ''; document.querySelector('[data-zur-kasse]').hidden = true; return;
    }
    liste.innerHTML = s.k.map((x, i) => { const p = finde(x.id); const v = p.art === 'pad' ? p.varianten.find(y => y.id === x.variante) : null; return `
      <div class="position">
        <img src="${W}${p.bild}" alt="" class="${p.art === 'pad' ? 'hell' : ''}" />
        <div class="pos-text"><b>${esc(p.name)}</b><span>${v ? esc(v.name) + ' · ' : (p.art === 'kurs' ? 'Schulung · ' : '')}${euro(preisVon(p, x.variante))}</span></div>
        <div class="menge"><button type="button" data-pos-minus="${i}" aria-label="weniger">−</button><input type="number" min="1" value="${x.menge}" aria-label="Menge" readonly /><button type="button" data-pos-plus="${i}" aria-label="mehr">+</button></div>
        <b class="pos-summe">${euro(preisVon(p, x.variante) * x.menge)}</b>
        <button type="button" class="entfernen" data-pos-weg="${i}" aria-label="Entfernen">×</button>
      </div>`; }).join('');
    document.querySelector('[data-korb-summen]').innerHTML = summenHtml(s);
    document.querySelector('[data-zur-kasse]').hidden = false;
    liste.querySelectorAll('[data-pos-minus]').forEach(b => b.onclick = () => { const k = korb.lesen(); k[b.dataset.posMinus].menge = Math.max(1, k[b.dataset.posMinus].menge - 1); korb.schreiben(k); zeichneKorb(); });
    liste.querySelectorAll('[data-pos-plus]').forEach(b => b.onclick = () => { const k = korb.lesen(); k[b.dataset.posPlus].menge++; korb.schreiben(k); zeichneKorb(); });
    liste.querySelectorAll('[data-pos-weg]').forEach(b => b.onclick = () => { const k = korb.lesen(); k.splice(+b.dataset.posWeg, 1); korb.schreiben(k); zeichneKorb(); });
  }
  zeichneKorb();

  const uebersicht = document.querySelector('[data-kasse-uebersicht]');
  if (uebersicht) {
    const s = summen();
    if (!s.k.length) korb.schreiben([{ id: 'hard-cut-125', variante: '3-pad-set', menge: 1 }]); // Beispiel, damit die Kasse etwas zeigt
    const t = summen();
    uebersicht.innerHTML = t.k.map(x => { const p = finde(x.id); const v = p.art === 'pad' ? p.varianten.find(y => y.id === x.variante) : null;
      return `<div class="summe"><span>${x.menge} × ${esc(p.name)}${v ? ' (' + esc(v.name) + ')' : (p.art === 'kurs' ? ' (Schulung)' : '')}</span><b>${euro(preisVon(p, x.variante) * x.menge)}</b></div>`; }).join('') + summenHtml(t);
    const f = document.querySelector('[data-kasse]');
    f.addEventListener('submit', e => { e.preventDefault(); document.querySelector('[data-kasse-hinweis]').hidden = false; });
  }

  document.querySelectorAll('[data-dazu]').forEach(b => b.onclick = () => { korb.dazu(b.dataset.dazu, null, 1); b.textContent = 'Im Warenkorb ✓'; });
  zaehler();
})();
