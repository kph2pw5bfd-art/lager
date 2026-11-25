/* ===== 1.190 – Lager Übersicht unten: Karte „Berichte und Listen“ (Jürgen 25.11., Entwurf https://claude.ai/artifact/EzeWgZHMvLimBhadpMgmko, Variante A)
   Eine weiße Karte, Zeilen wie der Streifen „Nichts zu prüfen“: Symbol links, Name + Erklärung, rechts Stand-Schild, Pfeil.
   Zeilen: Wochenbericht (alle mit Lager Übersicht, id jvwb), Austragen in epirent (Recht fm_a, id jvfm), Ersatzteile-Bericht (Defekte – Bearbeiten, id jvet).
   Der Ersatzteile-Bericht ist dafür aus der Defekte-Liste raus (build.py, 1.95); Link in der Werkstatt Übersicht bleibt. ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.berh{font-size:12px;font-weight:800;color:var(--mute);margin:6px 4px -4px}'+
'.bercard{background:var(--card);border:2.5px solid var(--navy);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}'+
'.berrow{display:flex;align-items:center;gap:12px;width:100%;padding:13px 12px;border:0;background:none;font:inherit;color:var(--ink);text-align:left;cursor:pointer;min-height:64px}.berrow+.berrow{border-top:1px solid var(--line)}'+
'.berrow:hover{background:rgba(17,74,151,.05)}.berrow:focus-visible{outline:3px solid var(--navy);outline-offset:-3px}'+
'.berico{flex:none;width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center}.berico.b{background:#e6eef9;color:#114a97}.berico.o{background:#fdf0e3;color:#b35a00}.berico.g{background:#eaeef3;color:#3b4a5e}'+
'.bertx{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.bertx b{font-size:16px}.bertx small{font-size:13px;color:var(--mute)}'+
'.berchip{flex:none;font-size:12px;font-weight:800;border-radius:999px;padding:3px 9px;white-space:nowrap}.berchip.n{background:#114a97;color:#fff}.berchip.ok{background:#e3f3ea;color:#1f6b41}.berchip.or{background:#b35a00;color:#fff}.berchip.gr{background:#eaeef3;color:#3b4a5e}'+
'.berrow>svg{flex:none;color:var(--navy)}.bertx .berchip{display:none;align-self:flex-start;margin-top:4px}'+
'@media (max-width:520px){.berrow>.berchip{display:none}.bertx .berchip{display:inline-block}}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .berico.b{background:#22406f;color:#cfe0fb}:root:not([data-theme="light"]) .berico.o{background:#6b3a0a;color:#ffd9b0}:root:not([data-theme="light"]) .berico.g{background:#2f3d52;color:#dfe6f0}:root:not([data-theme="light"]) .berchip.n{background:#3d6fc4}:root:not([data-theme="light"]) .berchip.ok{background:#1f7a4a;color:#fff}:root:not([data-theme="light"]) .berchip.gr{background:#3a4a62;color:#fff}:root:not([data-theme="light"]) .berrow>svg{color:#8fb0ea}:root:not([data-theme="light"]) .berrow:hover{background:rgba(143,176,234,.08)}}'+
':root[data-theme="dark"] .berico.b{background:#22406f;color:#cfe0fb}:root[data-theme="dark"] .berico.o{background:#6b3a0a;color:#ffd9b0}:root[data-theme="dark"] .berico.g{background:#2f3d52;color:#dfe6f0}:root[data-theme="dark"] .berchip.n{background:#3d6fc4}:root[data-theme="dark"] .berchip.ok{background:#1f7a4a;color:#fff}:root[data-theme="dark"] .berchip.gr{background:#3a4a62;color:#fff}:root[data-theme="dark"] .berrow>svg{color:#8fb0ea}';
document.head.appendChild(st)}catch(e){}})();
const BER_CHEV='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const BER_ICO={wb:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 fm:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>',
 et:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>'};
function berCanEt(){try{return (typeof can==="function"&&can("def_b"))||(typeof canDone==="function"&&canDone())}catch(e){return false}}
function berRow(id,ico,cls,title,sub,chip,chipCls){const c=chip?'<span class="berchip '+chipCls+'">'+esc(chip)+'</span>':'';/* Schild am Handy unter dem Text, sonst rechts */
 return '<button class="berrow" type="button" id="'+id+'"><span class="berico '+cls+'">'+ico+'</span><span class="bertx"><b>'+esc(title)+'</b><small>'+esc(sub)+'</small>'+c+'</span>'+c+BER_CHEV+'</button>'}
function berCard(wbn){const R=[];
 R.push(berRow("jvwb",BER_ICO.wb,"b","Wochenbericht","Montags-Besprechung · Drucken / PDF",wbn?wbn+(wbn===1?" Punkt":" Punkte"):"","n"));
 if(typeof can==="function"&&can("fm_a")&&typeof fmAus==="function"){const n=fmAus().length,d=fmAusDone().length;
  R.push(berRow("jvfm",BER_ICO.fm,"o","Austragen in epirent","Fehlmaterial, Ausgemustertes · "+d+" ausgetragen",n?n+" offen":"✓ Nichts offen",n?"or":"ok"))}
 if(berCanEt()&&typeof etRepDlg==="function"){const m0=new Date();m0.setDate(1);m0.setHours(0,0,0,0);const MN=["Jän","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const n=vdefs().filter(d=>d.done&&!d.aus&&(d.doneT||0)>=+m0).length;
  R.push(berRow("jvet",BER_ICO.et,"g","Ersatzteile-Bericht","Verbaute Teile, Reparaturzeit · PDF",MN[m0.getMonth()]+": "+n+" Rep.","gr"))}
 return '<div class="berh">Berichte und Listen</div><div class="bercard" id="bercard">'+R.join("")+'</div>'}
document.addEventListener("click",e=>{const t=e.target&&e.target.closest&&e.target.closest("#jvet");if(t&&typeof etRepDlg==="function")etRepDlg()});
