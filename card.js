/* card.js — shared image maker for both pages.
   Usage: Card.mount(containerEl); Card.getSubtitle = () => "…"; Card.filename = () => "name";
          Card.setRows([{name, artist, n, ms}], "plays" | "time" | "none");  */
(function () {
"use strict";
const $ = id => document.getElementById(id);

const THEMES = {
  midnight:{label:"Midnight", bg:["#12141c","#232a4a"], text:"#f2f4f8", sub:"#9aa3b8", accent:"#7c9cff"},
  dusk:    {label:"Dusk",     bg:["#2b1146","#c2461a"], text:"#fff6ec", sub:"#f2cdb8", accent:"#ffd166"},
  paper:   {label:"Paper",    bg:["#ece7f6","#d9d2ea"], text:"#1d1b29", sub:"#5f5a76", accent:"#6a2fd6"},
  field:   {label:"Field",    bg:["#123a2c","#0a2219"], text:"#eaf5ec", sub:"#8fb8a2", accent:"#f2b84b"},
  bubble:  {label:"Bubblegum",bg:["#ffdbe9","#ffb1d0"], text:"#3a0b24", sub:"#8c3a63", accent:"#d6196c"},
  harbor:  {label:"Harbor",   bg:["#0c2a49","#1c6491"], text:"#eef7ff", sub:"#a9d0ea", accent:"#ff8a5b"}
};
const FONTS = {
  grotesk:  {label:"Grotesk",   fam:"Bricolage Grotesque",  css:'"Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif', k:1},
  serif:    {label:"Serif",     fam:"Fraunces",             css:'"Fraunces", Georgia, "Times New Roman", serif', k:.96},
  condensed:{label:"Condensed", fam:"Big Shoulders Display",css:'"Big Shoulders Display", "Arial Narrow", Impact, sans-serif', k:1.18}
};
const SIZES = {
  sq:{label:"Square",   w:1080, h:1080},
  pt:{label:"Portrait", w:1080, h:1350},
  st:{label:"Story",    w:1080, h:1920}
};
const PAD = 80, LIST_TOP = 250;
const BGS = {gradient:"Gradient", flat:"Flat color"};
const TEXS = {grooves:"Record grooves", grain:"Grain", dots:"Halftone dots", stripes:"Stripes", none:"None"};
const st = {size:"sq", font:"grotesk", theme:"midnight", bg:"gradient", tex:"grooves"};

const Card = {
  rows: [], mode: "plays", hasSub: true, autoTitle: "My top tracks", noun: "tracks",
  getSubtitle: () => "",
  filename: () => "top-tracks"
};

const HTML = `
<section class="block" id="preview" aria-labelledby="h-prev">
  <h2 id="h-prev">Your image</h2>
  <div class="stage"><canvas id="card" width="1080" height="1080" role="img" aria-label="Preview of your top tracks image"></canvas></div>
  <button class="btn" id="save" type="button">Save image</button>
  <p class="hint" id="saveMsg" role="status" aria-live="polite"></p>
  <p class="hint" id="artNote" role="status" aria-live="polite"></p>
</section>
<section class="block" id="style" aria-labelledby="h-style">
  <h2 id="h-style">Customize</h2>
  <div class="field"><label for="title">Title</label><input type="text" id="title" value="My top tracks" maxlength="40"></div>
  <div class="field"><label for="subtitle">Subtitle (leave empty to fill it in automatically)</label><input type="text" id="subtitle" maxlength="60"></div>
  <div class="field"><span class="lab">Theme</span><div class="swatches" id="themes"></div></div>
  <div class="field"><label for="accent">Accent color</label><input type="color" id="accent" value="#7c9cff"></div>
  <div class="field"><span class="lab">Background</span><div class="chips" id="bgs"></div></div>
  <div class="field"><label for="flat">Flat background color</label><input type="color" id="flat" value="#12141c"></div>
  <div class="field"><span class="lab">Texture</span><div class="chips" id="texs"></div></div>
  <div class="field"><span class="lab">Font</span><div class="chips" id="fonts"></div></div>
  <div class="field"><span class="lab">Shape</span><div class="chips" id="sizes"></div></div>
  <div class="field"><label for="count">Number of tracks</label><select id="count"></select></div>
  <div class="checks">
    <label><input type="checkbox" id="showArtist" checked> Show artist</label>
    <label><input type="checkbox" id="showCounts" checked> Show counts</label>
    <label><input type="checkbox" id="showArt" checked> Show cover art</label>
  </div>
</section>`;

const fmtDur = ms => { const t = Math.round(ms/60000), h = Math.floor(t/60), m = t%60; return h ? `${h}h ${m}m` : `${m}m`; };
function fit(c, text, maxW){
  if(c.measureText(text).width <= maxW) return text;
  let lo = 1, hi = text.length;
  while(lo < hi){ const mid = (lo+hi+1)>>1; if(c.measureText(text.slice(0,mid).trimEnd()+"…").width <= maxW) lo = mid; else hi = mid-1; }
  return text.slice(0,lo).trimEnd() + "…";
}
function maxRows(size, artist){ return Math.floor((SIZES[size].h - LIST_TOP - PAD) / (artist ? 100 : 68)); }

const effArtist = () => $("showArtist").checked && Card.hasSub;
function getOpts(){
  return {
    size:st.size, font:st.font, theme:THEMES[st.theme], accent:$("accent").value,
    bg:st.bg, tex:st.tex, flat:$("flat").value,
    title:$("title").value.trim() || "Top tracks",
    subtitle:$("subtitle").value.trim() || Card.getSubtitle(),
    n:+$("count").value || 5, artist:effArtist(),
    counts:$("showCounts").checked && Card.mode !== "none", by:Card.mode,
    art:$("showArt").checked, round:Card.noun === "artists"
  };
}

/* ---------- cover art: real images when available, generated tiles otherwise ---------- */
const imgs = new Map();
function getImg(url){
  let e = imgs.get(url);
  if(!e){
    e = {img:new Image(), ok:false};
    e.img.crossOrigin = "anonymous";               // keeps the canvas exportable; if the host refuses, we just use a generated tile
    e.img.onload = () => { e.ok = true; Card.schedule(); };
    e.img.onerror = () => { e.fail = true; };
    e.img.src = url; imgs.set(url, e);
  }
  return e.ok ? e.img : null;
}
function shapePath(c, x, y, s, round){
  c.beginPath();
  if(round){ c.arc(x + s/2, y + s/2, s/2, 0, Math.PI*2); return; }
  const r = s * .12;
  c.moveTo(x + r, y); c.arcTo(x + s, y, x + s, y + s, r); c.arcTo(x + s, y + s, x, y + s, r);
  c.arcTo(x, y + s, x, y, r); c.arcTo(x, y, x + s, y, r); c.closePath();
}
function seeded(str){
  let h = 2166136261;
  for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s>>>15, 1|s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; };
}
function drawArt(c, row, x, y, s, round){
  c.save();
  shapePath(c, x, y, s, round); c.clip();
  const e = row.img ? getImg(row.img) : null;
  if(e){
    const side = Math.min(e.naturalWidth, e.naturalHeight) || 1;
    c.drawImage(e, (e.naturalWidth - side)/2, (e.naturalHeight - side)/2, side, side, x, y, s, s);
  } else {
    const rnd = seeded(row.name + "|" + (row.artist || ""));
    const h1 = Math.floor(rnd()*360), h2 = (h1 + 40 + Math.floor(rnd()*90)) % 360;
    const g = c.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, `hsl(${h1}, 62%, 48%)`); g.addColorStop(1, `hsl(${h2}, 66%, 26%)`);
    c.fillStyle = g; c.fillRect(x, y, s, s);
    for(let i = 0; i < 3; i++){
      c.globalAlpha = .12 + rnd()*.14; c.fillStyle = "#fff";
      c.beginPath(); c.arc(x + rnd()*s, y + rnd()*s, s*(.18 + rnd()*.3), 0, Math.PI*2); c.fill();
    }
    c.globalAlpha = .28; c.strokeStyle = "#fff"; c.lineWidth = Math.max(2, s*.05);
    c.beginPath(); c.arc(x + s*(.3 + rnd()*.4), y + s*(.3 + rnd()*.4), s*(.22 + rnd()*.18), 0, Math.PI*2); c.stroke();
  }
  c.restore();
}

const hexRgb = h => [1,3,5].map(i => parseInt(h.slice(i, i+2), 16));
let grainCache = {key:"", cv:null};
function grain(c, W, H, rgb){
  const key = [W, H, rgb.join(",")].join("|");
  if(grainCache.key !== key){
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    const oc = off.getContext("2d"), img = oc.createImageData(W, H), d = img.data;
    let s = 11; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s>>>15, 1|s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; };
    for(let i = 0; i < d.length; i += 4){ d[i] = rgb[0]; d[i+1] = rgb[1]; d[i+2] = rgb[2]; d[i+3] = rnd() * 40; }
    oc.putImageData(img, 0, 0);
    grainCache = {key, cv:off};
  }
  c.drawImage(grainCache.cv, 0, 0);
}
function drawTexture(c, o, W, H){
  c.save();
  if(o.tex === "grooves"){                          // record grooves in the top-right corner
    c.strokeStyle = o.accent; c.lineWidth = 3;
    for(let r = 170; r < 760; r += 44){ c.globalAlpha = .17 * (1 - (r-170)/700); c.beginPath(); c.arc(W-10, -10, r, 0, Math.PI*2); c.stroke(); }
    c.globalAlpha = .95; c.fillStyle = o.accent; c.beginPath(); c.arc(W-10, -10, 112, 0, Math.PI*2); c.fill();
  } else if(o.tex === "grain"){
    grain(c, W, H, hexRgb(o.theme.text));
  } else if(o.tex === "dots"){                      // halftone dots that fade from the top-right corner
    const gap = 38, far = Math.hypot(W, H) * .62;
    c.fillStyle = o.accent; c.globalAlpha = .17;
    for(let y = gap/2; y < H; y += gap){
      for(let x = gap/2 + ((Math.round(y/gap) % 2) * gap/2); x < W; x += gap){
        const f = 1 - Math.hypot(W - x, y) / far;
        if(f <= 0) continue;
        c.beginPath(); c.arc(x, y, Math.pow(f, 1.4) * 10, 0, Math.PI*2); c.fill();
      }
    }
  } else if(o.tex === "stripes"){
    c.strokeStyle = o.theme.text; c.globalAlpha = .07; c.lineWidth = 3;
    for(let x = -H; x < W + H; x += 30){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x + H, H); c.stroke(); }
  }
  c.restore();
}
function drawCard(cv, o, rows){
  const {w:W, h:H} = SIZES[o.size], th = o.theme, F = FONTS[o.font], k = F.k;
  cv.width = W; cv.height = H;
  cv.style.maxWidth = (75 * W / H) + "vh";
  const c = cv.getContext("2d");
  if(o.bg === "flat"){ c.fillStyle = o.flat; }
  else { const g = c.createLinearGradient(0, 0, W*.7, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); c.fillStyle = g; }
  c.fillRect(0, 0, W, H);
  drawTexture(c, o, W, H);

  // header
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  let ts = 78 * k;
  c.font = `700 ${ts}px ${F.css}`;
  const tMax = W - PAD*2 - 120;
  while(ts > 40 && c.measureText(o.title).width > tMax){ ts -= 2; c.font = `700 ${ts}px ${F.css}`; }
  c.fillStyle = th.text; c.fillText(fit(c, o.title, tMax), PAD, PAD + 70);
  c.font = `400 ${34*k}px ${F.css}`; c.fillStyle = th.sub;
  c.fillText(fit(c, o.subtitle, W - PAD*2), PAD, PAD + 70 + 50);

  // list
  const list = rows.slice(0, o.n);
  const bottom = H - PAD, avail = bottom - LIST_TOP;
  if(!list.length){
    c.textAlign = "center"; c.fillStyle = th.sub; c.font = `400 ${40*k}px ${F.css}`;
    c.fillText("No plays in this window", W/2, LIST_TOP + avail/2);
    return;
  }
  const rowH = Math.min(avail / list.length, 180);
  const y0 = bottom - rowH * list.length;
  let t = o.artist ? Math.min(Math.max(rowH * .36, 34), 54) : Math.min(Math.max(rowH * .46, 34), 58);
  if(o.art) t = Math.min(t, 48);                    // leave room for the cover art
  t *= k;
  const aSize = t * .72, art = o.art, artS = art ? Math.min(rowH * .8, 150) : 0, rankW = art ? 84 : 104;
  c.textBaseline = "middle";
  list.forEach((r, i) => {
    const cy = y0 + i*rowH + rowH/2;
    const ty = o.artist ? cy - aSize*.62 : cy;
    c.textAlign = "left"; c.font = `700 ${t*1.1}px ${F.css}`; c.fillStyle = o.accent;
    c.fillText(String(i+1), PAD, ty);
    let cw = 0;
    if(o.counts){
      c.textAlign = "right";
      if(o.by === "plays"){
        const unit = r.n === 1 ? "play" : "plays";
        c.font = `400 ${t*.62}px ${F.css}`; c.fillStyle = th.sub;
        c.fillText(unit, W-PAD, ty + t*.04);
        const uw = c.measureText(unit).width;
        c.font = `700 ${t*1.05}px ${F.css}`; c.fillStyle = th.text;
        const ns = r.n.toLocaleString();
        c.fillText(ns, W-PAD-uw-12, ty);
        cw = uw + 12 + c.measureText(ns).width;
      } else {
        const s = fmtDur(r.ms);
        c.font = `700 ${t}px ${F.css}`; c.fillStyle = th.text;
        c.fillText(s, W-PAD, ty); cw = c.measureText(s).width;
      }
    }
    if(art) drawArt(c, r, PAD + rankW, cy - artS/2, artS, o.round);
    const x = PAD + rankW + (art ? artS + 24 : 0), maxW = W - PAD - x - cw - (cw ? 28 : 0);
    c.textAlign = "left"; c.font = `700 ${t}px ${F.css}`; c.fillStyle = th.text;
    c.fillText(fit(c, r.name, maxW), x, ty);
    if(o.artist){
      c.font = `400 ${aSize}px ${F.css}`; c.fillStyle = th.sub;
      c.fillText(fit(c, r.artist || "Unknown artist", W - PAD - x), x, cy + t*.58);
    }
    if(i < list.length - 1){
      c.save(); c.globalAlpha = .14; c.fillStyle = th.text;
      c.fillRect(PAD, y0 + (i+1)*rowH - 1, W - PAD*2, 2); c.restore();
    }
  });
  cv.setAttribute("aria-label", `${o.title}. ${o.subtitle}. ` + list.map((r,i)=>`${i+1}, ${r.name}${r.artist ? " by " + r.artist : ""}`).join("; "));
}

let tok = 0, raf = 0;
async function render(){
  const my = ++tok, o = getOpts(), F = FONTS[o.font];
  $("subtitle").placeholder = Card.getSubtitle();
  try{ await Promise.all([document.fonts.load(`700 40px "${F.fam}"`), document.fonts.load(`400 40px "${F.fam}"`)]); }catch(e){}
  if(my !== tok) return;
  drawCard($("card"), o, Card.rows);
}
Card.schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };

Card.setRows = (rows, mode, opts) => {
  opts = opts || {};
  Card.rows = rows; Card.mode = mode || "plays"; Card.hasSub = opts.hasSub !== false;
  const auto = "My top " + (opts.noun || "tracks"), ti = $("title");
  if(ti && ti.value === Card.autoTitle) ti.value = auto;
  Card.autoTitle = auto; Card.noun = opts.noun || "tracks";
  const cb = $("showCounts"), sa = $("showArtist");
  if(cb){ cb.disabled = Card.mode === "none"; cb.parentElement.style.opacity = cb.disabled ? .5 : 1; }
  if(sa){ sa.disabled = !Card.hasSub; sa.parentElement.style.opacity = sa.disabled ? .5 : 1; refreshCountOptions(); }
  Card.schedule();
};

function refreshCountOptions(){
  const max = maxRows(st.size, effArtist());
  const opts = [5,10,15,20].filter(n => n <= max);
  if(!opts.includes(max)) opts.push(max);
  opts.sort((a,b)=>a-b);
  const sel = $("count"), prev = +sel.value || 10;
  sel.innerHTML = opts.map(n => `<option value="${n}">Top ${n}</option>`).join("");
  sel.value = String(opts.includes(prev) ? prev : opts.reduce((p,n)=> n <= prev ? n : p, opts[0]));
}
function buildChoice(el, items, key){
  el.innerHTML = "";
  for(const [id, label] of items){
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = label; b.dataset.id = id;
    b.setAttribute("aria-pressed", String(st[key] === id));
    b.onclick = () => {
      st[key] = id;
      [...el.children].forEach(x => x.setAttribute("aria-pressed", String(x.dataset.id === id)));
      if(key === "size") refreshCountOptions();
      if(key === "bg") syncFlat();
      Card.schedule();
    };
    el.appendChild(b);
  }
}
function syncFlat(){
  const f = $("flat"); f.disabled = st.bg !== "flat"; f.parentElement.style.opacity = f.disabled ? .5 : 1;
}
function buildThemes(){
  const el = $("themes"); el.innerHTML = "";
  for(const id of Object.keys(THEMES)){
    const th = THEMES[id], b = document.createElement("button");
    b.type = "button"; b.className = "sw"; b.dataset.id = id; b.title = th.label;
    b.setAttribute("aria-label", th.label + " theme");
    b.style.background = `linear-gradient(135deg, ${th.bg[0]}, ${th.bg[1]})`;
    b.style.color = th.accent; b.textContent = "Aa";
    b.setAttribute("aria-pressed", String(st.theme === id));
    b.onclick = () => {
      st.theme = id; $("accent").value = th.accent; $("flat").value = th.bg[0];
      [...el.children].forEach(x => x.setAttribute("aria-pressed", String(x.dataset.id === id)));
      Card.schedule();
    };
    el.appendChild(b);
  }
}

async function saveImage(){
  const msg = $("saveMsg"); msg.textContent = "";
  await render();
  const blob = await new Promise(res => $("card").toBlob(res, "image/png"));
  if(!blob){ msg.textContent = "The image couldn’t be created. Try fewer tracks."; return; }
  const name = Card.filename() + ".png";
  let DL = null;                                   // used when the page runs inside Claude
  try{ DL = window.claude && window.claude.use ? await window.claude.use("downloads") : null; }catch(e){ DL = null; }
  if(DL){
    try{ await DL.save({filename:name, data:blob}); msg.textContent = "Saved."; }
    catch(e){ if(!e || e.code !== "declined") msg.textContent = "Saving didn’t work here. Take a screenshot of the image instead."; }
    return;
  }
  const file = new File([blob], name, {type:"image/png"});
  const touch = window.matchMedia && matchMedia("(pointer:coarse)").matches;
  if(touch && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file]}); return; }
    catch(e){ if(e && e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  msg.textContent = "Saved to your downloads.";
}

Card.setNote = text => { const n = $("artNote"); if(n) n.textContent = text || ""; };
Card.artOn = () => !!($("showArt") && $("showArt").checked);
Card.visibleCount = () => +($("count") && $("count").value) || 10;

Card.mount = function(container){
  container.insertAdjacentHTML("beforeend", HTML);
  buildChoice($("fonts"), Object.keys(FONTS).map(k => [k, FONTS[k].label]), "font");
  buildChoice($("sizes"), Object.keys(SIZES).map(k => [k, SIZES[k].label]), "size");
  buildThemes();
  buildChoice($("bgs"), Object.entries(BGS), "bg");
  buildChoice($("texs"), Object.entries(TEXS), "tex");
  $("accent").value = THEMES[st.theme].accent;
  $("flat").value = THEMES[st.theme].bg[0];
  syncFlat();
  refreshCountOptions();
  for(const id of ["title","subtitle","accent","flat","count","showCounts","showArt"]) $(id).addEventListener("input", Card.schedule);
  $("showArtist").onchange = () => { refreshCountOptions(); Card.schedule(); };
  $("save").onclick = saveImage;
  Card.schedule();
};

window.Card = Card;
})();
