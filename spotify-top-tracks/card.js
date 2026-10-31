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
  harbor:  {label:"Harbor",   bg:["#0c2a49","#1c6491"], text:"#eef7ff", sub:"#a9d0ea", accent:"#ff8a5b"},
  sorbet:  {label:"Sorbet",   bg:["#ffe9d6","#ffc3a0"], text:"#3b1d12", sub:"#8a5a44", accent:"#e8504a"},
  mint:    {label:"Mint",     bg:["#dcf6ec","#a9e4cc"], text:"#0f3b2e", sub:"#3f7d68", accent:"#0c8a67"},
  noir:    {label:"Noir",     bg:["#0b0b0e","#1d1d27"], text:"#f6efe0", sub:"#a49c88", accent:"#d9b45b"},
  cherry:  {label:"Cherry",   bg:["#3d0a1c","#9a2046"], text:"#ffeef2", sub:"#f0b5c4", accent:"#7de0c3"},
  vapor:   {label:"Vapor",    bg:["#2b1055","#7597de"], text:"#ffffff", sub:"#d7ccf5", accent:"#ff71ce"},
  lemon:   {label:"Lemon",    bg:["#fff7b0","#ffe14d"], text:"#2a2300", sub:"#7a6a10", accent:"#2f5bff"}
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
const TEXS = {grooves:"Record grooves", grain:"Grain", dots:"Halftone dots", stripes:"Stripes", blobs:"Soft blobs", sunburst:"Sunburst", waves:"Waves", none:"None"};
const LAYOUTS = {list:"List", spotlight:"#1 spotlight"};
const SHAPES = {auto:"Auto", rounded:"Rounded", square:"Square", circle:"Circle"};
const RANKS = {plain:"Plain", badge:"Badge"};
const FRAMES = {none:"None", line:"Thin line", bold:"Bold"};
const st = {size:"sq", font:"grotesk", theme:"midnight", bg:"gradient", tex:"grooves", layout:"list", artShape:"auto", rank:"plain", frame:"none"};

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

  <h3 class="grp">Content</h3>
  <div class="field"><label for="title">Title</label><input type="text" id="title" value="My top tracks" maxlength="40"></div>
  <div class="field"><label for="subtitle">Subtitle (leave empty to fill it in automatically)</label><input type="text" id="subtitle" maxlength="60"></div>
  <div class="field"><label for="footer">Footer, such as your handle (optional)</label><input type="text" id="footer" maxlength="50" placeholder="@yourname"></div>
  <div class="field"><label for="count">Number of entries</label><select id="count"></select></div>
  <div class="checks">
    <label><input type="checkbox" id="showArtist" checked> Show artist</label>
    <label><input type="checkbox" id="showCounts" checked> Show counts</label>
    <label><input type="checkbox" id="showArt" checked> Show cover art</label>
    <label><input type="checkbox" id="dividers" checked> Show dividers</label>
  </div>

  <h3 class="grp">Layout</h3>
  <div class="field"><span class="lab">Image shape</span><div class="chips" id="sizes"></div></div>
  <div class="field"><span class="lab">Arrangement</span><div class="chips" id="layouts"></div></div>
  <div class="field"><span class="lab">Cover art shape</span><div class="chips" id="shapes"></div></div>
  <div class="field"><span class="lab">Rank numbers</span><div class="chips" id="ranks"></div></div>

  <h3 class="grp">Look</h3>
  <div class="field"><span class="lab">Theme</span><div class="swatches" id="themes"></div></div>
  <div class="field"><label for="accent">Accent color</label><input type="color" id="accent" value="#7c9cff"></div>
  <div class="field"><span class="lab">Background</span><div class="chips" id="bgs"></div></div>
  <div class="field"><label for="flat">Flat background color</label><input type="color" id="flat" value="#12141c"></div>
  <div class="field"><span class="lab">Texture</span><div class="chips" id="texs"></div></div>
  <div class="field"><span class="lab">Frame</span><div class="chips" id="frames"></div></div>
  <div class="field"><span class="lab">Font</span><div class="chips" id="fonts"></div></div>
</section>`;

const fmtDur = ms => { const t = Math.round(ms/60000), h = Math.floor(t/60), m = t%60; return h ? `${h}h ${m}m` : `${m}m`; };
function fit(c, text, maxW){
  if(c.measureText(text).width <= maxW) return text;
  let lo = 1, hi = text.length;
  while(lo < hi){ const mid = (lo+hi+1)>>1; if(c.measureText(text.slice(0,mid).trimEnd()+"…").width <= maxW) lo = mid; else hi = mid-1; }
  return text.slice(0,lo).trimEnd() + "…";
}
const minRow = artist => artist ? 100 : 68;
function spotGeo(size){                              // the big #1 block of the spotlight layout
  if(SIZES[size].h > 1500){ const S = 640; return {stacked:true, S, heroH:S + 24 + 190 + 36}; }
  const S = SIZES[size].h > 1100 ? 400 : 300; return {stacked:false, S, heroH:S + 36};
}
function maxRows(size, artist, layout){
  const avail = SIZES[size].h - LIST_TOP - PAD;
  if(layout === "spotlight") return 1 + Math.max(0, Math.floor((avail - spotGeo(size).heroH) / minRow(artist)));
  return Math.floor(avail / minRow(artist));
}

const effArtist = () => $("showArtist").checked && Card.hasSub;
function getOpts(){
  return {
    size:st.size, font:st.font, theme:THEMES[st.theme], accent:$("accent").value,
    bg:st.bg, tex:st.tex, flat:$("flat").value,
    title:$("title").value.trim() || "Top tracks",
    subtitle:$("subtitle").value.trim() || Card.getSubtitle(),
    n:+$("count").value || 5, artist:effArtist(),
    counts:$("showCounts").checked && Card.mode !== "none", by:Card.mode,
    art:$("showArt").checked,
    shape:st.artShape === "auto" ? (Card.noun === "artists" ? "circle" : "rounded") : st.artShape,
    layout:st.layout, rank:st.rank, frame:st.frame,
    dividers:$("dividers").checked, footer:$("footer").value.trim()
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
function shapePath(c, x, y, s, shape){
  c.beginPath();
  if(shape === "circle"){ c.arc(x + s/2, y + s/2, s/2, 0, Math.PI*2); return; }
  const r = shape === "square" ? 0 : s * .12;
  c.moveTo(x + r, y); c.arcTo(x + s, y, x + s, y + s, r); c.arcTo(x + s, y + s, x, y + s, r);
  c.arcTo(x, y + s, x, y, r); c.arcTo(x, y, x + s, y, r); c.closePath();
}
function seeded(str){
  let h = 2166136261;
  for(let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s>>>15, 1|s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; };
}
function drawArt(c, row, x, y, s, shape){
  c.save();
  shapePath(c, x, y, s, shape); c.clip();
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
const rgba = (h, a) => { const [r,g,b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const lum = h => { const [r,g,b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*r + .7152*g + .0722*b; };
const onColor = h => lum(h) > .4 ? "#14141a" : "#ffffff";
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
  if(o.tex === "grooves"){                          // record grooves in the top-right corner (the spotlight draws a vinyl instead)
    if(o.layout !== "spotlight"){
    c.strokeStyle = o.accent; c.lineWidth = 3;
    for(let r = 170; r < 760; r += 44){ c.globalAlpha = .17 * (1 - (r-170)/700); c.beginPath(); c.arc(W-10, -10, r, 0, Math.PI*2); c.stroke(); }
    c.globalAlpha = .95; c.fillStyle = o.accent; c.beginPath(); c.arc(W-10, -10, 112, 0, Math.PI*2); c.fill();
    }
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
  } else if(o.tex === "blobs"){
    const rnd = seeded("blobs");
    for(let i = 0; i < 7; i++){
      const x = rnd()*W, y = rnd()*H, r = 260 + rnd()*340, light = lum(o.bg === "flat" ? o.flat : o.theme.bg[0]) > .5, col = i % 2 ? o.accent : (light ? "#ffffff" : o.theme.text);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, .22)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  } else if(o.tex === "sunburst"){
    const ox = W/2, oy = H*.2, R = Math.hypot(W, H), n = 32;
    c.fillStyle = o.accent; c.globalAlpha = .09;
    for(let i = 0; i < n; i += 2){
      const a1 = i/n*Math.PI*2, a2 = (i+1)/n*Math.PI*2;
      c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + R*Math.cos(a1), oy + R*Math.sin(a1)); c.lineTo(ox + R*Math.cos(a2), oy + R*Math.sin(a2)); c.closePath(); c.fill();
    }
  } else if(o.tex === "waves"){
    c.strokeStyle = o.accent; c.globalAlpha = .16; c.lineWidth = 3;
    for(let y0 = 90; y0 < H + 90; y0 += 58){
      c.beginPath();
      for(let x = 0; x <= W; x += 12){ const y = y0 + Math.sin(x/95 + y0/70) * 20; if(x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
  }
  c.restore();
}
function drawVinyl(c, o, cx, cy, R){
  c.save();
  c.fillStyle = "#0d0d12"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI*2); c.fill();
  c.strokeStyle = "#ffffff"; c.lineWidth = 2;
  for(let r = R*.38; r < R*.97; r += R*.065){ c.globalAlpha = .09; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.stroke(); }
  c.globalAlpha = 1; c.fillStyle = o.accent; c.beginPath(); c.arc(cx, cy, R*.3, 0, Math.PI*2); c.fill();
  c.fillStyle = "#0d0d12"; c.beginPath(); c.arc(cx, cy, R*.045, 0, Math.PI*2); c.fill();
  c.restore();
}
function wrapLines(c, text, maxW, maxLines){
  const words = String(text).split(/\s+/), lines = []; let cur = "";
  for(let i = 0; i < words.length; i++){
    const test = cur ? cur + " " + words[i] : words[i];
    if(!cur || c.measureText(test).width <= maxW){ cur = test; continue; }
    lines.push(cur); cur = words[i];
    if(lines.length === maxLines - 1){ cur = words.slice(i).join(" "); break; }
  }
  lines.push(cur);
  return lines.slice(0, maxLines).map(l => fit(c, l, maxW));
}
function countText(o, r){
  if(!o.counts) return "";
  return o.by === "plays" ? `${r.n.toLocaleString()} ${r.n === 1 ? "play" : "plays"}` : fmtDur(r.ms);
}

function rowMetrics(c, o, F, k, rowH){
  const boost = Math.min(1.5, Math.max(1, rowH / 170));
  let t = o.artist ? Math.min(Math.max(rowH*.36, 34), 54) : Math.min(Math.max(rowH*.46, 34), 58);
  t *= boost;
  if(o.art) t = Math.min(t, 48 * boost);
  const tall = rowH >= 230 && o.counts;
  if(tall) t = Math.min(t, 60);                       // keep names readable and untruncated in Story
  t *= k;
  const artS = o.art ? Math.min(rowH * .8, 150 * boost) : 0;
  const badge = o.rank === "badge", d = t * 1.45;
  c.font = `700 ${t*1.1}px ${F.css}`;
  const rankW = Math.max(o.art ? 84 : 104, badge ? d + 18 : c.measureText("00").width + 22);
  return {t, aSize:t*.72, artS, rankW, badge, d, tall};
}
function drawRow(c, o, F, th, m, r, rank, yTop, rowH, divider){
  const W = SIZES[o.size].w, cy = yTop + rowH/2, t = m.t;
  // tall rows (Story) stack name, artist and count so names keep their full width
  const nameH = t * 1.25, artH = o.artist ? m.aSize * 1.4 : 0, cntH = (m.tall && o.counts) ? t * .8 * 1.3 : 0;
  const total = nameH + artH + cntH;
  const ty = m.tall ? cy - total/2 + nameH/2 : (o.artist ? cy - m.aSize*.62 : cy);
  c.textBaseline = "middle";
  if(m.badge){
    c.fillStyle = o.accent; c.beginPath(); c.arc(PAD + m.d/2, ty, m.d/2, 0, Math.PI*2); c.fill();
    c.textAlign = "center"; c.fillStyle = onColor(o.accent); c.font = `700 ${t*.9}px ${F.css}`;
    c.fillText(String(rank), PAD + m.d/2, ty + t*.03);
  } else {
    c.textAlign = "left"; c.font = `700 ${t*1.1}px ${F.css}`; c.fillStyle = o.accent;
    c.fillText(String(rank), PAD, ty);
  }
  let cw = 0;
  if(o.counts && !m.tall){
    c.textAlign = "right";
    if(o.by === "plays"){
      const unit = r.n === 1 ? "play" : "plays", ns = r.n.toLocaleString();
      c.font = `400 ${t*.62}px ${F.css}`; c.fillStyle = th.sub;
      c.fillText(unit, W-PAD, ty + t*.04);
      const uw = c.measureText(unit).width;
      c.font = `700 ${t*1.05}px ${F.css}`; c.fillStyle = th.text;
      c.fillText(ns, W-PAD-uw-12, ty);
      cw = uw + 12 + c.measureText(ns).width;
    } else {
      const s = fmtDur(r.ms);
      c.font = `700 ${t}px ${F.css}`; c.fillStyle = th.text;
      c.fillText(s, W-PAD, ty); cw = c.measureText(s).width;
    }
  }
  if(o.art) drawArt(c, r, PAD + m.rankW, cy - m.artS/2, m.artS, o.shape);
  const x = PAD + m.rankW + (o.art ? m.artS + 24 : 0), maxW = W - PAD - x - cw - (cw ? 28 : 0);
  c.textAlign = "left"; c.textBaseline = "middle"; c.font = `700 ${t}px ${F.css}`; c.fillStyle = th.text;
  c.fillText(fit(c, r.name, maxW), x, ty);
  if(o.artist){
    c.font = `400 ${m.aSize}px ${F.css}`; c.fillStyle = th.sub;
    const ay = m.tall ? ty + nameH/2 + artH/2 : cy + t*.58;
    c.fillText(fit(c, r.artist || "Unknown artist", W - PAD - x), x, ay);
  }
  if(cntH){
    c.font = `700 ${t*.8}px ${F.css}`; c.fillStyle = o.accent;
    c.fillText(countText(o, r), x, ty + nameH/2 + artH + cntH/2);
  }
  if(divider && o.dividers){
    c.save(); c.globalAlpha = .14; c.fillStyle = th.text;
    c.fillRect(PAD, yTop + rowH - 1, W - PAD*2, 2); c.restore();
  }
}

function drawHero(c, o, F, th, k, r, y0){
  const W = SIZES[o.size].w, g = spotGeo(o.size), S = g.S;
  const peek = o.tex === "grooves" ? S * .2 : 0;
  const ct = countText(o, r);
  c.textBaseline = "middle";
  if(g.stacked){
    const ax = (W - S - peek) / 2, ay = y0 + 4;
    if(peek) drawVinyl(c, o, ax + S/2 + peek, ay + S/2, S/2);
    drawArt(c, r, ax, ay, S, o.shape);
    c.textAlign = "center";
    let yy = ay + S + 24;
    c.font = `700 ${66*k}px ${F.css}`; c.fillStyle = th.text;
    c.fillText(fit(c, r.name, W - PAD*2), W/2, yy + 36); yy += 76;
    if(o.artist){ c.font = `400 ${38*k}px ${F.css}`; c.fillStyle = th.sub; c.fillText(fit(c, r.artist || "Unknown artist", W - PAD*2), W/2, yy + 20); yy += 52; }
    if(ct){ c.font = `700 ${46*k}px ${F.css}`; c.fillStyle = o.accent; c.fillText(ct, W/2, yy + 24); }
  } else {
    const ax = PAD, ay = y0;
    if(peek) drawVinyl(c, o, ax + S/2 + peek, ay + S/2, S/2);
    drawArt(c, r, ax, ay, S, o.shape);
    const x = ax + S + peek + 40, maxW = W - PAD - x;
    c.textAlign = "left"; c.font = `700 ${54*k}px ${F.css}`;
    const lines = wrapLines(c, r.name, maxW, 2);
    const hh = 44 + lines.length * 62 + (o.artist ? 46 : 0) + (ct ? 60 : 0);
    let yy = ay + (S - hh) / 2;
    c.font = `700 ${34*k}px ${F.css}`; c.fillStyle = o.accent; c.fillText("#1", x, yy + 17); yy += 44;
    c.font = `700 ${54*k}px ${F.css}`; c.fillStyle = th.text;
    for(const l of lines){ c.fillText(l, x, yy + 31); yy += 62; }
    if(o.artist){ c.font = `400 ${34*k}px ${F.css}`; c.fillStyle = th.sub; c.fillText(fit(c, r.artist || "Unknown artist", maxW), x, yy + 23); yy += 46; }
    if(ct){ c.font = `700 ${42*k}px ${F.css}`; c.fillStyle = o.accent; c.fillText(ct, x, yy + 30); }
  }
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

  if(o.frame !== "none"){
    const bold = o.frame === "bold", m = bold ? 26 : 30, r = 44;
    c.save(); c.strokeStyle = o.accent; c.lineWidth = bold ? 12 : 3;
    c.beginPath();
    c.moveTo(m + r, m); c.arcTo(W - m, m, W - m, H - m, r); c.arcTo(W - m, H - m, m, H - m, r);
    c.arcTo(m, H - m, m, m, r); c.arcTo(m, m, W - m, m, r); c.closePath(); c.stroke(); c.restore();
  }

  // header
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  let ts = 78 * k;
  c.font = `700 ${ts}px ${F.css}`;
  const tMax = W - PAD*2 - 120;
  while(ts > 40 && c.measureText(o.title).width > tMax){ ts -= 2; c.font = `700 ${ts}px ${F.css}`; }
  c.fillStyle = th.text; c.fillText(fit(c, o.title, tMax), PAD, PAD + 70);
  c.font = `400 ${34*k}px ${F.css}`; c.fillStyle = th.sub;
  c.fillText(fit(c, o.subtitle, W - PAD*2), PAD, PAD + 70 + 50);

  if(o.footer){
    c.textAlign = "center"; c.textBaseline = "middle"; c.font = `400 ${28*k}px ${F.css}`; c.fillStyle = th.sub;
    c.fillText(fit(c, o.footer, W - PAD*2), W/2, H - PAD/2 - 4);
  }

  const list = rows.slice(0, o.n);
  const bottom = H - PAD - (o.footer ? 30 : 0), avail = bottom - LIST_TOP;
  if(!list.length){
    c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = th.sub; c.font = `400 ${40*k}px ${F.css}`;
    c.fillText("No plays in this window", W/2, LIST_TOP + avail/2);
    return;
  }

  if(o.layout === "spotlight"){
    drawHero(c, o, F, th, k, list[0], LIST_TOP);
    const rest = list.slice(1), top = LIST_TOP + spotGeo(o.size).heroH, area = bottom - top;
    if(rest.length){
      const rowH = Math.min(area / rest.length, 190), m = rowMetrics(c, o, F, k, rowH);
      rest.forEach((r, i) => drawRow(c, o, F, th, m, r, i + 2, top + i*rowH, rowH, i < rest.length - 1));
    }
  } else {
    const rowH = Math.min(avail / list.length, 340), y0 = bottom - rowH * list.length;
    const m = rowMetrics(c, o, F, k, rowH);
    list.forEach((r, i) => drawRow(c, o, F, th, m, r, i + 1, y0 + i*rowH, rowH, i < list.length - 1));
  }
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
  const max = maxRows(st.size, effArtist(), st.layout);
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
      if(key === "size" || key === "layout") refreshCountOptions();
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

function confetti(){
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const btn = $("save"); if(!btn || !btn.animate) return;
  const r = btn.getBoundingClientRect(), colors = ["#ff5c8a","#ffd23f","#3ddbb0","#5b3df5","#ffffff"];
  for(let i = 0; i < 26; i++){
    const p = document.createElement("span"), size = 6 + Math.random()*7;
    Object.assign(p.style, {position:"fixed", left:(r.left + r.width/2) + "px", top:(r.top + r.height/2) + "px", width:size + "px",
      height:size*(Math.random() < .5 ? 1 : .45) + "px", background:colors[i % colors.length], borderRadius:Math.random() < .4 ? "50%" : "2px",
      pointerEvents:"none", zIndex:9999});
    document.body.appendChild(p);
    const ang = Math.random()*Math.PI*2, dist = 90 + Math.random()*170, dx = Math.cos(ang)*dist, dy = Math.sin(ang)*dist - 70;
    p.animate([{transform:"translate(0,0) rotate(0deg)", opacity:1},
               {transform:`translate(${dx}px,${dy + 130}px) rotate(${Math.random()*720}deg)`, opacity:0}],
              {duration:900 + Math.random()*500, easing:"cubic-bezier(.2,.7,.3,1)"}).onfinish = () => p.remove();
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
    try{ await DL.save({filename:name, data:blob}); msg.textContent = "Saved."; confetti(); }
    catch(e){ if(!e || e.code !== "declined") msg.textContent = "Saving didn’t work here. Take a screenshot of the image instead."; }
    return;
  }
  const file = new File([blob], name, {type:"image/png"});
  const touch = window.matchMedia && matchMedia("(pointer:coarse)").matches;
  if(touch && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file]}); confetti(); return; }
    catch(e){ if(e && e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  msg.textContent = "Saved to your downloads."; confetti();
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
  buildChoice($("layouts"), Object.entries(LAYOUTS), "layout");
  buildChoice($("shapes"), Object.entries(SHAPES), "artShape");
  buildChoice($("ranks"), Object.entries(RANKS), "rank");
  buildChoice($("frames"), Object.entries(FRAMES), "frame");
  $("accent").value = THEMES[st.theme].accent;
  $("flat").value = THEMES[st.theme].bg[0];
  syncFlat();
  refreshCountOptions();
  for(const id of ["title","subtitle","footer","accent","flat","count","showCounts","showArt","dividers"]) $(id).addEventListener("input", Card.schedule);
  $("showArtist").onchange = () => { refreshCountOptions(); Card.schedule(); };
  $("save").onclick = saveImage;
  Card.schedule();
};

window.Card = Card;
})();
