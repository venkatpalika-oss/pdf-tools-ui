/* =====================================================================
   PaperlyTools – in-browser PDF tools
   ---------------------------------------------------------------------
   These tools run entirely on the visitor's device (pdf-lib + pdf.js).
   No upload, no login, no server cost.

   Handled here: merge, split, rotate, organize, page-numbers,
   watermark, jpg-to-pdf, pdf-to-image, compress.
   app.js skips these tool types (see LOCAL_TOOL_TYPES there).
===================================================================== */

export const LOCAL_TOOL_TYPES = [
  "merge", "split", "rotate", "organize", "page-numbers",
  "watermark", "jpg-to-pdf", "pdf-to-image", "compress"
];

const VENDOR = new URL("../vendor/", import.meta.url).href;
const MAX_FILE_MB = 200;

/* ---------------- library loading ---------------- */

const loaded = {};
function loadScript(name) {
  if (!loaded[name]) {
    loaded[name] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = VENDOR + name;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load " + name + ". Check your connection and reload."));
      document.head.appendChild(s);
    });
  }
  return loaded[name];
}

async function pdfLib() {
  await loadScript("pdf-lib.min.js");
  return window.PDFLib;
}

async function pdfJs() {
  await loadScript("pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = VENDOR + "pdf.worker.min.js";
  return window.pdfjsLib;
}

async function fflate() {
  await loadScript("fflate.min.js");
  return window.fflate;
}

/* ---------------- helpers ---------------- */

function track(action, label) {
  try { window.gtag && window.gtag("event", action, { event_category: "tool", event_label: label }); } catch (e) {}
}

function fmtSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(2) + " MB" : (bytes / 1024).toFixed(1) + " KB";
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* Parse "1-3, 5, 8-" into [[1,3],[5,5],[8,total]] (1-based, validated) */
export function parseRanges(text, total) {
  const out = [];
  const parts = String(text || "").split(",").map(p => p.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter pages, for example 1-3, 5");
  for (const p of parts) {
    const m = p.match(/^(\d*)\s*-\s*(\d*)$|^(\d+)$/);
    if (!m) throw new Error(`"${p}" is not a valid page or range`);
    let a, b;
    if (m[3]) { a = b = parseInt(m[3], 10); }
    else { a = m[1] ? parseInt(m[1], 10) : 1; b = m[2] ? parseInt(m[2], 10) : total; }
    if (a < 1 || b < 1 || a > total || b > total) throw new Error(`Page ${a > total ? a : b} doesn't exist – this PDF has ${total} pages`);
    if (a > b) throw new Error(`Range "${p}" goes backwards`);
    out.push([a, b]);
  }
  return out;
}

function rangesToIndexes(ranges) {
  const idx = [];
  for (const [a, b] of ranges) for (let i = a; i <= b; i++) idx.push(i - 1);
  return idx;
}

function download(data, filename, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob;
}

async function zip(files) {
  const { zipSync } = await fflate();
  const obj = {};
  for (const [name, bytes] of files) obj[name] = [bytes, { level: 0 }];
  return zipSync(obj);
}

async function loadPdf(file) {
  const { PDFDocument } = await pdfLib();
  const bytes = await file.arrayBuffer();
  try {
    return await PDFDocument.load(bytes);
  } catch (e) {
    if (/encrypt/i.test(e.message)) {
      throw new Error(`"${file.name}" is password-protected. Remove the password first, then try again.`);
    }
    throw new Error(`"${file.name}" couldn't be read. It may be damaged or not a real PDF.`);
  }
}

function canvasToBytes(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async b => {
      if (!b) return reject(new Error("Couldn't render page image"));
      resolve(new Uint8Array(await b.arrayBuffer()));
    }, type, quality);
  });
}

async function renderPage(pdfjsDoc, pageNo, scale) {
  const page = await pdfjsDoc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const base = page.getViewport({ scale: 1 });
  page.cleanup();
  return { canvas, widthPt: base.width, heightPt: base.height };
}

async function openWithPdfJs(file) {
  const lib = await pdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    return await lib.getDocument({ data }).promise;
  } catch (e) {
    if (e && e.name === "PasswordException") throw new Error(`"${file.name}" is password-protected. Remove the password first.`);
    throw new Error(`"${file.name}" couldn't be read. It may be damaged or not a real PDF.`);
  }
}

function toRoman(n) {
  const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

/* ---------------- styles ---------------- */

function injectStyles() {
  if (document.getElementById("lt-styles")) return;
  const css = `
  .lt-panel{max-width:760px;margin:22px auto 0;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px;display:none}
  .lt-panel.show{display:block}
  .lt-files{list-style:none;margin:0 0 14px;padding:0}
  .lt-files li{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.05);margin-bottom:6px;font-size:14px}
  .lt-files li .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lt-files li .s{opacity:.6;font-size:12px}
  .lt-ib{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:14px}
  .lt-ib:hover{background:rgba(255,255,255,.18)}
  .lt-ib:disabled{opacity:.3;cursor:default}
  .lt-row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:10px 0}
  .lt-field{display:flex;flex-direction:column;gap:5px;font-size:13px;opacity:.95}
  .lt-field input,.lt-field select{padding:10px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:#14142a;color:#fff;font-size:14px;min-width:150px}
  .lt-hint{font-size:12.5px;opacity:.65;margin:6px 0 0}
  .lt-warn{font-size:13px;background:rgba(255,190,60,.1);border:1px solid rgba(255,190,60,.3);border-radius:10px;padding:9px 12px;margin:10px 0}
  .lt-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
  .lt-go{padding:12px 26px;border:0;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#6c63ff,#00d4ff)}
  .lt-go:disabled{opacity:.5;cursor:wait}
  .lt-sec{padding:12px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;cursor:pointer}
  .lt-status{margin-top:12px;font-size:14px;min-height:20px}
  .lt-status.err{color:#ff8a8a}
  .lt-status.ok{color:#7dffb0}
  .lt-privacy{font-size:12.5px;opacity:.7;margin-top:12px}
  .lt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin:8px 0 4px}
  .lt-card{background:rgba(255,255,255,.05);border-radius:10px;padding:8px;text-align:center;font-size:12px}
  .lt-card canvas{max-width:100%;height:auto;border-radius:4px;background:#fff;display:block;margin:0 auto 6px;transition:transform .2s}
  .lt-card .b{display:flex;justify-content:center;gap:4px}
  .lt-card .b .lt-ib{width:26px;height:26px;font-size:12px}
  `;
  const st = document.createElement("style");
  st.id = "lt-styles";
  st.textContent = css;
  document.head.appendChild(st);
}

/* ---------------- generic UI ---------------- */

function buildPanel(box) {
  const panel = document.createElement("div");
  panel.className = "lt-panel";
  panel.innerHTML = `
    <ul class="lt-files"></ul>
    <div class="lt-opts"></div>
    <div class="lt-actions">
      <button type="button" class="lt-go">Process</button>
      <button type="button" class="lt-sec lt-add">+ Add files</button>
      <button type="button" class="lt-sec lt-reset">Start over</button>
    </div>
    <div class="lt-status" role="status" aria-live="polite"></div>
    <p class="lt-privacy">🔒 Processed in your browser – your files are not uploaded.</p>`;
  box.insertAdjacentElement("afterend", panel);
  return panel;
}

function setStatus(panel, text, cls = "") {
  const s = panel.querySelector(".lt-status");
  s.textContent = text;
  s.className = "lt-status " + cls;
}

/* ---------------- tool definitions ---------------- */

const TOOLS = {

  merge: {
    accept: "application/pdf",
    multiple: true,
    reorder: true,
    button: "Merge PDFs",
    options: () => `<p class="lt-hint">Use the arrows to set the order. Files are joined top to bottom.</p>`,
    validate: files => { if (files.length < 2) throw new Error("Add at least 2 PDF files to merge."); },
    async run(files, panel, progress) {
      const { PDFDocument } = await pdfLib();
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        progress(`Adding file ${i + 1} of ${files.length}…`);
        const src = await loadPdf(files[i]);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out.addPage(p));
      }
      progress("Saving…");
      const bytes = await out.save();
      download(bytes, "merged.pdf", "application/pdf");
      return `Done – merged ${files.length} files into ${out.getPageCount()} pages (${fmtSize(bytes.length)}).`;
    }
  },

  split: {
    accept: "application/pdf",
    button: "Split PDF",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">How to split
          <select data-o="mode">
            <option value="every">Every page as its own PDF (ZIP)</option>
            <option value="extract">Extract chosen pages into one PDF</option>
            <option value="ranges">Each range as a separate PDF (ZIP)</option>
          </select>
        </label>
        <label class="lt-field" data-show="extract ranges">Pages
          <input data-o="pages" placeholder="e.g. 1-3, 5, 8-10" />
        </label>
      </div>
      <p class="lt-hint lt-pagecount"></p>`,
    async run(files, panel, progress, opt) {
      const { PDFDocument } = await pdfLib();
      const file = files[0];
      const src = await loadPdf(file);
      const total = src.getPageCount();
      const name = baseName(file.name);

      const make = async idxs => {
        const d = await PDFDocument.create();
        (await d.copyPages(src, idxs)).forEach(p => d.addPage(p));
        return d.save();
      };

      if (opt.mode === "extract") {
        const idxs = rangesToIndexes(parseRanges(opt.pages, total));
        const bytes = await make(idxs);
        download(bytes, `${name}-pages.pdf`, "application/pdf");
        return `Done – extracted ${idxs.length} page(s).`;
      }

      let groups;
      if (opt.mode === "ranges") groups = parseRanges(opt.pages, total).map(([a, b]) => ({ label: a === b ? `${a}` : `${a}-${b}`, idxs: rangesToIndexes([[a, b]]) }));
      else groups = Array.from({ length: total }, (_, i) => ({ label: `${i + 1}`, idxs: [i] }));

      if (groups.length === 1) {
        download(await make(groups[0].idxs), `${name}-${groups[0].label}.pdf`, "application/pdf");
        return "Done – 1 file created.";
      }
      const entries = [];
      for (let i = 0; i < groups.length; i++) {
        progress(`Creating file ${i + 1} of ${groups.length}…`);
        entries.push([`${name}-page-${groups[i].label}.pdf`, await make(groups[i].idxs)]);
      }
      progress("Packing ZIP…");
      download(await zip(entries), `${name}-split.zip`, "application/zip");
      return `Done – ${groups.length} PDFs in one ZIP file.`;
    }
  },

  rotate: {
    accept: "application/pdf",
    button: "Rotate PDF",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Rotate
          <select data-o="angle">
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="270">90° anticlockwise</option>
          </select>
        </label>
        <label class="lt-field">Pages
          <select data-o="which">
            <option value="all">All pages</option>
            <option value="some">Only some pages</option>
          </select>
        </label>
        <label class="lt-field" data-show-which="some">Which pages
          <input data-o="pages" placeholder="e.g. 1, 3-4" />
        </label>
      </div>
      <p class="lt-hint lt-pagecount"></p>`,
    async run(files, panel, progress, opt) {
      const { degrees } = await pdfLib();
      const file = files[0];
      const doc = await loadPdf(file);
      const total = doc.getPageCount();
      const idxs = opt.which === "some" ? rangesToIndexes(parseRanges(opt.pages, total)) : doc.getPageIndices();
      const add = parseInt(opt.angle, 10);
      idxs.forEach(i => {
        const p = doc.getPage(i);
        p.setRotation(degrees((p.getRotation().angle + add) % 360));
      });
      const bytes = await doc.save();
      download(bytes, `${baseName(file.name)}-rotated.pdf`, "application/pdf");
      return `Done – rotated ${idxs.length} page(s).`;
    }
  },

  organize: {
    accept: "application/pdf",
    button: "Save new PDF",
    options: () => `<p class="lt-hint">Move pages with ◀ ▶, rotate with ⟳, remove with ✕.</p><div class="lt-grid"></div>`,
    async onFiles(files, panel, state) {
      const grid = panel.querySelector(".lt-grid");
      grid.innerHTML = "Loading pages…";
      const doc = await openWithPdfJs(files[0]);
      state.pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const { canvas } = await renderPage(doc, i, 0.35);
        state.pages.push({ index: i - 1, rot: 0, canvas });
      }
      doc.destroy();
      drawGrid(panel, state);
    },
    async run(files, panel, progress, opt, state) {
      const { PDFDocument, degrees } = await pdfLib();
      if (!state.pages || !state.pages.length) throw new Error("There are no pages left to save.");
      const src = await loadPdf(files[0]);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, state.pages.map(p => p.index));
      copied.forEach((p, k) => {
        const r = state.pages[k].rot;
        if (r) p.setRotation(degrees((p.getRotation().angle + r) % 360));
        out.addPage(p);
      });
      const bytes = await out.save();
      download(bytes, `${baseName(files[0].name)}-organized.pdf`, "application/pdf");
      return `Done – saved ${state.pages.length} page(s).`;
    }
  },

  "page-numbers": {
    accept: "application/pdf",
    button: "Add page numbers",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Position
          <select data-o="pos">
            <option value="bottom-center">Bottom centre</option>
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="top-center">Top centre</option>
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
          </select>
        </label>
        <label class="lt-field">Style
          <select data-o="fmt">
            <option value="1">1, 2, 3</option>
            <option value="page">Page 1 of 10</option>
            <option value="01">01, 02, 03</option>
            <option value="roman">I, II, III</option>
          </select>
        </label>
        <label class="lt-field">Start at
          <input data-o="start" type="number" min="1" value="1" style="min-width:90px;width:90px" />
        </label>
        <label class="lt-field">Size
          <select data-o="size"><option value="10">Small</option><option value="12" selected>Medium</option><option value="16">Large</option></select>
        </label>
      </div>`,
    async run(files, panel, progress, opt) {
      const { StandardFonts, rgb } = await pdfLib();
      const file = files[0];
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const size = parseInt(opt.size, 10) || 12;
      const start = Math.max(1, parseInt(opt.start, 10) || 1);
      const pages = doc.getPages();
      const lastNo = start + pages.length - 1;
      const margin = 28;
      pages.forEach((page, i) => {
        const n = start + i;
        let label = String(n);
        if (opt.fmt === "01") label = String(n).padStart(2, "0");
        if (opt.fmt === "roman") label = toRoman(n);
        if (opt.fmt === "page") label = `Page ${n} of ${lastNo}`;
        const w = font.widthOfTextAtSize(label, size);
        const { width, height } = page.getSize();
        const [v, h] = opt.pos.split("-");
        let x = h === "left" ? margin : h === "right" ? width - margin - w : (width - w) / 2;
        let y = v === "top" ? height - margin - size : margin;
        page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      const bytes = await doc.save();
      download(bytes, `${baseName(file.name)}-numbered.pdf`, "application/pdf");
      return `Done – numbered ${pages.length} page(s).`;
    }
  },

  watermark: {
    accept: "application/pdf",
    button: "Add watermark",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Watermark text
          <input data-o="text" value="CONFIDENTIAL" maxlength="60" style="min-width:220px" />
        </label>
        <label class="lt-field">Style
          <select data-o="style"><option value="diagonal">Diagonal, centre</option><option value="flat">Flat, centre</option></select>
        </label>
        <label class="lt-field">Opacity
          <select data-o="opacity"><option value="0.12">Light</option><option value="0.25" selected>Medium</option><option value="0.45">Strong</option></select>
        </label>
        <label class="lt-field">Colour
          <select data-o="color"><option value="grey">Grey</option><option value="red">Red</option><option value="blue">Blue</option></select>
        </label>
      </div>`,
    async run(files, panel, progress, opt) {
      const { StandardFonts, rgb, degrees } = await pdfLib();
      const text = (opt.text || "").trim();
      if (!text) throw new Error("Enter the watermark text.");
      const file = files[0];
      const doc = await loadPdf(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const colors = { grey: rgb(0.45, 0.45, 0.45), red: rgb(0.85, 0.1, 0.1), blue: rgb(0.1, 0.3, 0.85) };
      const safeText = text.replace(/[^\x20-\x7E]/g, "");
      if (!safeText.trim()) throw new Error("Please use English letters, numbers or common symbols for the watermark.");
      doc.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const diag = opt.style === "diagonal";
        const target = diag ? Math.hypot(width, height) * 0.7 : width * 0.7;
        let size = target / font.widthOfTextAtSize(safeText, 1);
        size = Math.min(size, 110);
        const w = font.widthOfTextAtSize(safeText, size);
        const angle = diag ? Math.atan2(height, width) : 0;
        const x = width / 2 - (w / 2) * Math.cos(angle) + (size / 3) * Math.sin(angle);
        const y = height / 2 - (w / 2) * Math.sin(angle) - (size / 3) * Math.cos(angle);
        page.drawText(safeText, {
          x, y, size, font,
          color: colors[opt.color] || colors.grey,
          opacity: parseFloat(opt.opacity) || 0.25,
          rotate: degrees(angle * 180 / Math.PI)
        });
      });
      const bytes = await doc.save();
      download(bytes, `${baseName(file.name)}-watermarked.pdf`, "application/pdf");
      return `Done – watermark added to ${doc.getPageCount()} page(s).`;
    }
  },

  "jpg-to-pdf": {
    accept: "image/jpeg,image/png",
    multiple: true,
    reorder: true,
    button: "Create PDF",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Page size
          <select data-o="size">
            <option value="fit">Same as each image</option>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
        <label class="lt-field" data-show-size="a4 letter">Margin
          <select data-o="margin"><option value="0">None</option><option value="20" selected>Small</option><option value="40">Large</option></select>
        </label>
      </div>
      <p class="lt-hint">JPG and PNG images. Use the arrows to set the page order.</p>`,
    async run(files, panel, progress, opt) {
      const { PDFDocument } = await pdfLib();
      const out = await PDFDocument.create();
      const sizes = { a4: [595.28, 841.89], letter: [612, 792] };
      for (let i = 0; i < files.length; i++) {
        progress(`Adding image ${i + 1} of ${files.length}…`);
        const f = files[i];
        const bytes = new Uint8Array(await f.arrayBuffer());
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        let img;
        try { img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes); }
        catch (e) { throw new Error(`"${f.name}" couldn't be read as a JPG or PNG image.`); }
        if (opt.size === "fit") {
          const page = out.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          let [pw, ph] = sizes[opt.size];
          if (img.width > img.height) [pw, ph] = [ph, pw];
          const m = parseInt(opt.margin, 10) || 0;
          const scale = Math.min((pw - 2 * m) / img.width, (ph - 2 * m) / img.height);
          const w = img.width * scale, h = img.height * scale;
          const page = out.addPage([pw, ph]);
          page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
        }
      }
      const bytes = await out.save();
      download(bytes, files.length === 1 ? `${baseName(files[0].name)}.pdf` : "images.pdf", "application/pdf");
      return `Done – ${files.length} image(s) turned into a PDF (${fmtSize(bytes.length)}).`;
    }
  },

  "pdf-to-image": {
    accept: "application/pdf",
    button: "Convert to images",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Format
          <select data-o="fmt"><option value="jpg">JPG</option><option value="png">PNG</option></select>
        </label>
        <label class="lt-field">Quality
          <select data-o="scale"><option value="1">Normal (72 dpi)</option><option value="2" selected>High (144 dpi)</option><option value="3">Very high (216 dpi)</option></select>
        </label>
      </div>`,
    async run(files, panel, progress, opt) {
      const file = files[0];
      const doc = await openWithPdfJs(file);
      const scale = parseFloat(opt.scale) || 2;
      const type = opt.fmt === "png" ? "image/png" : "image/jpeg";
      const ext = opt.fmt === "png" ? "png" : "jpg";
      const name = baseName(file.name);
      const entries = [];
      for (let i = 1; i <= doc.numPages; i++) {
        progress(`Rendering page ${i} of ${doc.numPages}…`);
        const { canvas } = await renderPage(doc, i, scale);
        entries.push([`${name}-page-${i}.${ext}`, await canvasToBytes(canvas, type, 0.92)]);
        canvas.width = canvas.height = 0;
      }
      doc.destroy();
      if (entries.length === 1) {
        download(entries[0][1], entries[0][0], type);
        return "Done – 1 image created.";
      }
      progress("Packing ZIP…");
      download(await zip(entries), `${name}-images.zip`, "application/zip");
      return `Done – ${entries.length} images in one ZIP file.`;
    }
  },

  compress: {
    accept: "application/pdf",
    button: "Compress PDF",
    options: () => `
      <div class="lt-row">
        <label class="lt-field">Compression
          <select data-o="level">
            <option value="light">Light – keeps text selectable</option>
            <option value="balanced" selected>Balanced – smaller file</option>
            <option value="strong">Strong – smallest file</option>
          </select>
        </label>
      </div>
      <p class="lt-warn" data-show-level="balanced strong">Balanced and Strong turn each page into an image. The file gets much smaller, but text can no longer be selected or searched. Best for scans and photos.</p>`,
    async run(files, panel, progress, opt) {
      const { PDFDocument } = await pdfLib();
      const file = files[0];
      const name = baseName(file.name);
      let bytes;
      if (opt.level === "light") {
        const doc = await loadPdf(file);
        progress("Optimising…");
        bytes = await doc.save({ useObjectStreams: true });
      } else {
        const settings = opt.level === "strong" ? { scale: 1.0, q: 0.5 } : { scale: 1.5, q: 0.7 };
        const src = await openWithPdfJs(file);
        const out = await PDFDocument.create();
        for (let i = 1; i <= src.numPages; i++) {
          progress(`Compressing page ${i} of ${src.numPages}…`);
          const { canvas, widthPt, heightPt } = await renderPage(src, i, settings.scale);
          const jpg = await out.embedJpg(await canvasToBytes(canvas, "image/jpeg", settings.q));
          canvas.width = canvas.height = 0;
          const page = out.addPage([widthPt, heightPt]);
          page.drawImage(jpg, { x: 0, y: 0, width: widthPt, height: heightPt });
        }
        src.destroy();
        bytes = await out.save({ useObjectStreams: true });
      }
      if (bytes.length >= file.size) {
        return `This PDF is already well compressed – ${opt.level === "light" ? "try Balanced for a bigger reduction" : "the result wasn't any smaller, so nothing was downloaded"}.`;
      }
      download(bytes, `${name}-compressed.pdf`, "application/pdf");
      const pct = Math.round((1 - bytes.length / file.size) * 100);
      return `Done – ${fmtSize(file.size)} → ${fmtSize(bytes.length)} (${pct}% smaller).`;
    }
  }
};

/* ---------------- organize grid ---------------- */

function drawGrid(panel, state) {
  const grid = panel.querySelector(".lt-grid");
  grid.innerHTML = "";
  state.pages.forEach((p, k) => {
    const card = document.createElement("div");
    card.className = "lt-card";
    p.canvas.style.transform = `rotate(${p.rot}deg)`;
    card.appendChild(p.canvas);
    const label = document.createElement("div");
    label.textContent = `Page ${p.index + 1}`;
    card.appendChild(label);
    const b = document.createElement("div");
    b.className = "b";
    const mk = (txt, title, fn, dis) => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "lt-ib"; btn.textContent = txt; btn.title = title; btn.disabled = !!dis;
      btn.onclick = () => { fn(); drawGrid(panel, state); };
      b.appendChild(btn);
    };
    mk("◀", "Move left", () => { [state.pages[k - 1], state.pages[k]] = [state.pages[k], state.pages[k - 1]]; }, k === 0);
    mk("⟳", "Rotate", () => { p.rot = (p.rot + 90) % 360; });
    mk("✕", "Remove", () => { state.pages.splice(k, 1); });
    mk("▶", "Move right", () => { [state.pages[k + 1], state.pages[k]] = [state.pages[k], state.pages[k + 1]]; }, k === state.pages.length - 1);
    card.appendChild(b);
    grid.appendChild(card);
  });
  if (!state.pages.length) grid.textContent = "All pages removed. Click “Start over” to reload the file.";
}

/* ---------------- homepage hand-off ----------------
   index.html stores the chosen file(s) in IndexedDB and opens
   the tool page with ?from=home. Pick them up once, then clear. */

function takeHandoff() {
  if (!/[?&]from=home\b/.test(location.search) || !window.indexedDB) return Promise.resolve(null);
  return new Promise(resolve => {
    const req = indexedDB.open("paperly-handoff", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        const get = store.get("pending");
        get.onsuccess = () => {
          store.delete("pending");
          const v = get.result;
          resolve(v && Date.now() - v.at < 10 * 60 * 1000 ? v.files : null);
        };
        get.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    };
  });
}

/* ---------------- wiring ---------------- */

function hideLegacyControls() {
  ["watermarkText", "numberPosition", "levelSelect"].forEach(id => {
    const el = document.getElementById(id);
    const wrap = el && el.parentElement;
    if (wrap && wrap.tagName === "DIV" && !wrap.classList.contains("upload-box")) wrap.style.display = "none";
  });
}

function readOptions(panel) {
  const o = {};
  panel.querySelectorAll("[data-o]").forEach(el => { o[el.dataset.o] = el.value; });
  return o;
}

function syncConditional(panel) {
  const o = readOptions(panel);
  panel.querySelectorAll("[data-show]").forEach(el => { el.style.display = el.dataset.show.split(" ").includes(o.mode) ? "" : "none"; });
  panel.querySelectorAll("[data-show-which]").forEach(el => { el.style.display = el.dataset.showWhich.split(" ").includes(o.which) ? "" : "none"; });
  panel.querySelectorAll("[data-show-size]").forEach(el => { el.style.display = el.dataset.showSize.split(" ").includes(o.size) ? "" : "none"; });
  panel.querySelectorAll("[data-show-level]").forEach(el => { el.style.display = el.dataset.showLevel.split(" ").includes(o.level) ? "" : "none"; });
}

function init() {
  const type = document.body.dataset.tool;
  const tool = TOOLS[type];
  if (!tool) return;
  const box = document.querySelector(".upload-box");
  const input = box && box.querySelector(".file-input");
  if (!box || !input) return;

  injectStyles();
  hideLegacyControls();

  input.accept = tool.accept;
  input.multiple = !!tool.multiple;
  if (type === "jpg-to-pdf") {
    const hint = box.querySelector(".upload-hint");
    if (hint) hint.textContent = "JPG or PNG images – select one or more";
  }
  if (type === "split") {
    const hint = box.querySelector(".upload-hint");
    if (hint) hint.textContent = "Split into single pages or extract the pages you need";
  }

  const panel = buildPanel(box);
  const list = panel.querySelector(".lt-files");
  const go = panel.querySelector(".lt-go");
  const addBtn = panel.querySelector(".lt-add");
  panel.querySelector(".lt-opts").innerHTML = tool.options();
  go.textContent = tool.button;
  if (!tool.multiple) addBtn.style.display = "none";
  panel.addEventListener("change", () => syncConditional(panel));
  syncConditional(panel);

  let files = [];
  let state = {};
  let busy = false;

  const accepts = f => tool.accept.split(",").includes(f.type) ||
    (tool.accept.includes("pdf") && /\.pdf$/i.test(f.name)) ||
    (tool.accept.includes("image") && /\.(jpe?g|png)$/i.test(f.name));

  function renderList() {
    list.innerHTML = "";
    files.forEach((f, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="n">${esc(f.name)}</span><span class="s">${fmtSize(f.size)}</span>`;
      const btn = (txt, title, fn, dis) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lt-ib"; b.textContent = txt; b.title = title; b.disabled = !!dis;
        b.onclick = e => { e.stopPropagation(); fn(); renderList(); };
        li.appendChild(b);
      };
      if (tool.reorder && files.length > 1) {
        btn("↑", "Move up", () => { [files[i - 1], files[i]] = [files[i], files[i - 1]]; }, i === 0);
        btn("↓", "Move down", () => { [files[i + 1], files[i]] = [files[i], files[i + 1]]; }, i === files.length - 1);
      }
      if (tool.multiple) btn("✕", "Remove", () => { files.splice(i, 1); if (!files.length) reset(); });
      list.appendChild(li);
    });
  }

  async function setFiles(newFiles, append) {
    const good = [], bad = [];
    for (const f of newFiles) {
      if (!accepts(f)) bad.push(`${f.name} (wrong file type)`);
      else if (f.size > MAX_FILE_MB * 1024 * 1024) bad.push(`${f.name} (over ${MAX_FILE_MB} MB)`);
      else good.push(f);
    }
    if (!good.length) { if (bad.length) alert("These files can't be used:\n" + bad.join("\n")); return; }
    files = tool.multiple && append ? files.concat(good) : (tool.multiple ? good : [good[0]]);
    box.classList.add("has-file");
    const title = box.querySelector(".upload-title");
    if (title) title.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
    panel.classList.add("show");
    renderList();
    setStatus(panel, bad.length ? "Skipped: " + bad.join(", ") : "");
    const pc = panel.querySelector(".lt-pagecount");
    if (pc && files[0]) {
      try { const d = await loadPdf(files[0]); pc.textContent = `This PDF has ${d.getPageCount()} page(s).`; }
      catch (e) { setStatus(panel, e.message, "err"); }
    }
    if (tool.onFiles) {
      try { await tool.onFiles(files, panel, state); }
      catch (e) { setStatus(panel, e.message, "err"); }
    }
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function reset() {
    files = []; state = {};
    input.value = "";
    panel.classList.remove("show");
    box.classList.remove("has-file", "success", "error", "loading");
    const title = box.querySelector(".upload-title");
    if (title) title.textContent = tool.multiple ? "Choose files or drag & drop here" : "Choose a file or drag & drop here";
    panel.querySelector(".lt-opts").innerHTML = tool.options();
    syncConditional(panel);
    setStatus(panel, "");
  }

  let appendNext = false;
  box.addEventListener("click", () => { appendNext = false; input.click(); });
  addBtn.addEventListener("click", () => { appendNext = true; input.click(); });
  input.addEventListener("change", () => { if (input.files.length) setFiles(Array.from(input.files), appendNext); input.value = ""; });
  ["dragenter", "dragover"].forEach(ev => box.addEventListener(ev, e => { e.preventDefault(); box.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach(ev => box.addEventListener(ev, e => { e.preventDefault(); box.classList.remove("dragging"); }));
  box.addEventListener("drop", e => { if (e.dataTransfer.files.length) setFiles(Array.from(e.dataTransfer.files), !!files.length); });
  panel.querySelector(".lt-reset").addEventListener("click", reset);

  takeHandoff().then(handed => { if (handed && handed.length) setFiles(handed, false); });

  go.addEventListener("click", async () => {
    if (busy || !files.length) return;
    busy = true; go.disabled = true;
    box.classList.add("loading");
    setStatus(panel, "Working…");
    try {
      tool.validate && tool.validate(files);
      const msg = await tool.run(files, panel, t => setStatus(panel, t), readOptions(panel), state);
      setStatus(panel, msg, "ok");
      box.classList.remove("loading"); box.classList.add("success");
      track("tool_complete", type);
    } catch (e) {
      console.error(e);
      setStatus(panel, e.message || "Something went wrong.", "err");
      box.classList.remove("loading");
      track("tool_error", type);
    } finally {
      busy = false; go.disabled = false;
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
