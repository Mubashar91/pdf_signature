(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const el = {
    file: $('pdfFile'), upload: $('uploadPanel'), editor: $('editor'), fileName: $('fileName'), fileSize: $('fileSize'),
    changeFile: $('changeFile'), pdfCanvas: $('pdfCanvas'), pageWrap: $('pageWrap'), pageStage: $('pageStage'),
    pageLabel: $('pageLabel'), prev: $('prevPage'), next: $('nextPage'), layer: $('signatureLayer'), preview: $('signaturePreview'),
    create: $('createSignature'), size: $('signatureSize'), sizeValue: $('sizeValue'), remove: $('removeSignature'), download: $('downloadPdf'),
    status: $('status'), editorStatus: $('editorStatus'), dialog: $('signatureDialog'), close: $('closeDialog'), drawTab: $('drawTab'), typeTab: $('typeTab'),
    drawPanel: $('drawPanel'), typePanel: $('typePanel'), drawCanvas: $('drawCanvas'), typedName: $('typedName'), typedPreview: $('typedPreview'),
    clear: $('clearDrawing'), use: $('useSignature'), choose: $('chooseFile'), sample: $('trySample'),
    sampleRow: $('sampleRow'), workspaceStep: $('workspaceStep'), dialogError: $('dialogError')
  };
  const state = { file: null, bytes: null, pdf: null, page: 1, signature: null, placement: null, method: 'draw', drawing: false, hasDrawing: false, renderToken: 0, drag: null, ink: '#213e34', font: 'Caveat', ratio: 4, loading: false, saving: false, renderTask: null, downloaded: false, uploadFromHero: true };
  const drawCtx = el.drawCanvas.getContext('2d');
  drawCtx.strokeStyle = state.ink;
  drawCtx.lineWidth = 5;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';

  function setStatus(message, error = false, context = null) {
    const target = context || (state.pdf ? el.editorStatus : el.status);
    const other = target === el.status ? el.editorStatus : el.status;
    other.textContent = '';
    target.textContent = message;
    target.classList.toggle('error', error);
  }
  function updateControls() {
    const placed = !!state.placement;
    el.size.disabled = !placed || state.saving;
    el.remove.disabled = !placed || state.saving;
    el.download.disabled = !placed || state.saving || state.loading;
    el.prev.disabled = !state.pdf || state.page <= 1 || state.loading;
    el.next.disabled = !state.pdf || state.page >= state.pdf.numPages || state.loading;
    el.choose.disabled = state.loading || state.saving;
    el.sample.disabled = state.loading || state.saving;
    el.changeFile.disabled = state.loading || state.saving;
    el.create.disabled = state.loading || state.saving;
    const step = !state.pdf ? 1 : !placed ? 2 : 3;
    el.workspaceStep.textContent = state.downloaded ? 'ALL DONE. NICE WORK.' : `STEP 0${step} OF 03`;
    document.querySelectorAll('[data-step]').forEach((item) => {
      const number = Number(item.dataset.step);
      item.classList.toggle('active', number === step && !state.downloaded);
      item.classList.toggle('complete', number < step || state.downloaded);
      if (number === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  function updateSignatureButton() {
    el.use.disabled = state.method === 'draw' ? !state.hasDrawing : !el.typedName.value.trim();
    el.dialogError.textContent = '';
  }
  function updateTypedPreview() {
    el.typedPreview.textContent = el.typedName.value.trim() || 'Your name';
    el.typedPreview.style.color = state.ink;
    el.typedPreview.style.fontFamily = `"${state.font}", cursive`;
    el.typedPreview.style.fontStyle = state.font === 'Caveat' ? 'normal' : 'italic';
    el.typedPreview.style.fontSize = `${Math.min(48, Math.max(16, 480 / Math.max(10, el.typedName.value.length) * 2))}px`;
    updateSignatureButton();
  }
  async function loadFile(file) {
    if (!file || state.loading || state.saving) return;
    const uploadStatus = state.uploadFromHero ? el.status : el.editorStatus;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return setStatus('Please choose a PDF file.', true, uploadStatus);
    if (file.size > 25 * 1024 * 1024) return setStatus('Please choose a PDF smaller than 25 MB.', true, uploadStatus);
    if (!window.pdfjsLib || !window.PDFLib) return setStatus('The PDF libraries could not load. Check your connection and refresh the page.', true, uploadStatus);
    setStatus('Opening your PDF…', false, uploadStatus);
    let opened = false;
    state.loading = true; updateControls();
    el.upload.setAttribute('aria-busy', 'true');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('This file does not appear to be a PDF.');
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      if (state.pdf) await state.pdf.destroy();
      state.file = file; state.bytes = bytes; state.pdf = pdf; state.page = 1; state.signature = null; state.placement = null; state.downloaded = false;
      el.size.value = '35'; el.sizeValue.textContent = '35%';
      el.fileName.textContent = file.name;
      el.fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'}`;
      el.editor.classList.remove('hidden');
      $('workspaceSection').classList.remove('hidden');
      await renderPage();
      updateControls();
      setStatus('PDF ready. Create a signature to continue.');
      opened = true;
      $('workspaceSection').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'This PDF could not be opened. Try another file.', true, uploadStatus);
    } finally {
      state.loading = false; state.uploadFromHero = false;
      el.upload.removeAttribute('aria-busy'); updateControls(); el.file.value = '';
      if (opened) el.create.focus({ preventScroll: true });
    }
  }
  async function renderPage() {
    const token = ++state.renderToken;
    if (state.renderTask) {
      state.renderTask.cancel();
      try { await state.renderTask.promise; } catch (_) { /* A newer render replaces this one. */ }
    }
    const pageNumber = state.page;
    const page = await state.pdf.getPage(pageNumber);
    if (token !== state.renderToken) return;
    const base = page.getViewport({ scale: 1 });
    const width = Math.min(520, Math.max(120, el.pageStage.clientWidth - 18));
    const scale = width / base.width;
    const viewport = page.getViewport({ scale: scale * Math.min(window.devicePixelRatio || 1, 2) });
    const canvas = el.pdfCanvas;
    canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
    canvas.style.width = `${width}px`; canvas.style.height = `${base.height * scale}px`;
    el.pageWrap.style.width = `${width}px`; el.pageWrap.style.height = `${base.height * scale}px`;
    state.renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
    try { await state.renderTask.promise; } catch (error) { if (error.name === 'RenderingCancelledException') return; throw error; }
    if (token !== state.renderToken) return;
    el.pageLabel.textContent = `Page ${pageNumber} of ${state.pdf.numPages}`;
    el.pageStage.scrollTop = 0;
    syncLayer(); updateControls();
  }
  function syncLayer() {
    const p = state.placement;
    if (!p || p.page !== state.page) return el.layer.classList.add('hidden');
    clampPlacement();
    if (el.preview.getAttribute('src') !== state.signature) el.preview.src = state.signature;
    el.layer.style.width = `${p.width * 100}%`;
    el.layer.style.left = `${p.x * 100}%`;
    el.layer.style.top = `${p.y * 100}%`;
    el.layer.classList.remove('hidden');
  }
  function clampPlacement() {
    const p = state.placement;
    if (!p) return;
    const pageAspect = el.pageWrap.clientWidth / Math.max(1, el.pageWrap.clientHeight);
    // A tall drawn mark must fit on the page as well as a wide typed name.
    p.width = Math.min(p.width, state.ratio / pageAspect * .9);
    const height = p.width * pageAspect / state.ratio;
    p.x = Math.max(0, Math.min(1 - p.width, p.x));
    p.y = Math.max(0, Math.min(1 - height, p.y));
    el.size.value = String(Math.round(p.width * 100));
    el.sizeValue.textContent = `${Math.round(p.width * 100)}%`;
  }
  function newPlacement() {
    const width = Number(el.size.value) / 100;
    state.placement = { page: state.page, x: (1 - width) / 2, y: .65, width };
    state.downloaded = false;
    syncLayer(); updateControls();
  }
  function setMethod(method) {
    state.method = method;
    const draw = method === 'draw';
    el.drawPanel.classList.toggle('hidden', !draw); el.typePanel.classList.toggle('hidden', draw);
    el.drawTab.classList.toggle('active', draw); el.typeTab.classList.toggle('active', !draw);
    el.drawTab.setAttribute('aria-selected', String(draw)); el.typeTab.setAttribute('aria-selected', String(!draw));
    el.drawTab.tabIndex = draw ? 0 : -1; el.typeTab.tabIndex = draw ? -1 : 0;
    updateSignatureButton();
    if (!draw) el.typedName.focus();
  }
  function pointOnCanvas(event) {
    const rect = el.drawCanvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * el.drawCanvas.width / rect.width, y: (event.clientY - rect.top) * el.drawCanvas.height / rect.height };
  }
  function trimCanvas(source) {
    const ctx = source.getContext('2d');
    const { width, height } = source;
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 12) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    }
    if (maxX < 0) return null;
    const pad = 14, out = document.createElement('canvas');
    out.width = maxX - minX + 1 + pad * 2; out.height = maxY - minY + 1 + pad * 2;
    out.getContext('2d').drawImage(source, minX, minY, maxX - minX + 1, maxY - minY + 1, pad, pad, maxX - minX + 1, maxY - minY + 1);
    return out.toDataURL('image/png');
  }
  function makeTypedSignature() {
    const name = el.typedName.value.trim();
    if (!name) return null;
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 220;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = state.ink; ctx.font = `${state.font === 'Caveat' ? '' : 'italic '}88px "${state.font}", cursive`;
    ctx.textBaseline = 'middle'; ctx.fillText(name, 30, 110, 1130);
    return trimCanvas(canvas);
  }
  async function downloadPdf() {
    if (!state.bytes || !state.signature || !state.placement || state.saving) return;
    state.saving = true; updateControls();
    setStatus('Preparing your signed PDF…');
    try {
      const pdf = await PDFLib.PDFDocument.load(state.bytes);
      const page = pdf.getPage(state.placement.page - 1);
      const image = await pdf.embedPng(state.signature);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const displayWidth = state.placement.width * pageWidth;
      const displayHeight = displayWidth * image.height / image.width;
      const x = state.placement.x * pageWidth;
      const y = pageHeight - state.placement.y * pageHeight - displayHeight;
      page.drawImage(image, { x, y, width: displayWidth, height: displayHeight });
      const output = await pdf.save();
      const blob = new Blob([output], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = state.file.name.replace(/\.pdf$/i, '') + '-signed.pdf';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      state.downloaded = true;
      setStatus('All done! Your signed PDF has been downloaded. A little less paperwork.');
    } catch (err) {
      console.error(err); setStatus('This PDF could not be saved. Some protected PDFs cannot be edited.', true);
    } finally { state.saving = false; updateControls(); }
  }

  async function trySample() {
    state.uploadFromHero = true;
    if (!window.PDFLib) return setStatus('The PDF library could not load. Check your connection and refresh the page.', true, el.status);
    el.sample.disabled = true;
    try {
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const pdf = await PDFDocument.create();
      const serif = await pdf.embedFont(StandardFonts.TimesRoman);
      const sans = await pdf.embedFont(StandardFonts.Helvetica);
      for (let index = 0; index < 2; index++) {
        const page = pdf.addPage([612, 792]);
        const green = rgb(.13, .24, .2), grey = rgb(.49, .53, .45);
        page.drawText('inklet.', { x: 55, y: 726, size: 22, font: serif, color: green });
        page.drawText('SAMPLE DOCUMENT / FOR PRACTICE ONLY', { x: 55, y: 686, size: 9, font: sans, color: grey });
        page.drawText(index === 0 ? 'Good things start here.' : 'A new chapter awaits.', { x: 55, y: 620, size: 32, font: serif, color: green });
        const lines = index === 0 ? [
          'This is your space to try a little digital ink.',
          'Create a signature, move it into place, and download your PDF.',
          'You can also use the page arrows to explore the second page.',
          'This sample is for demonstration only and is not an agreement.'
        ] : [
          'Your signature can go on whichever page you choose.',
          'Draw it by hand or type your name in a style that feels like you.',
          'Try the size slider and drag your mark to its perfect spot.',
          'When you are ready, choose your own PDF using Change file.'
        ];
        lines.forEach((line, n) => page.drawText(line, { x: 55, y: 562 - n * 28, size: 12, font: sans, color: grey }));
        page.drawText('Make your mark below.', { x: 55, y: 319, size: 18, font: serif, color: green });
        page.drawLine({ start: { x: 55, y: 220 }, end: { x: 360, y: 220 }, thickness: 1, color: rgb(.77, .81, .71) });
        page.drawText('YOUR SIGNATURE', { x: 55, y: 199, size: 8, font: sans, color: grey });
        page.drawText(`A little less paperwork. | Sample page ${index + 1} of 2`, { x: 55, y: 50, size: 9, font: sans, color: grey });
      }
      await loadFile(new File([await pdf.save()], 'Inklet-sample.pdf', { type: 'application/pdf' }));
    } catch (error) { setStatus('The sample could not open. Please choose your own PDF or try again.', true, el.status); }
    finally { updateControls(); }
  }

  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  el.file.addEventListener('change', (e) => loadFile(e.target.files[0]));
  el.choose.addEventListener('click', () => { state.uploadFromHero = true; el.file.click(); });
  el.sample.addEventListener('click', trySample);
  el.changeFile.addEventListener('click', () => { state.uploadFromHero = false; el.file.value = ''; el.file.click(); });
  for (const eventName of ['dragenter', 'dragover']) el.upload.addEventListener(eventName, (e) => { e.preventDefault(); el.upload.classList.add('drag-over'); });
  for (const eventName of ['dragleave', 'drop']) el.upload.addEventListener(eventName, (e) => { e.preventDefault(); el.upload.classList.remove('drag-over'); });
  el.upload.addEventListener('drop', (e) => { state.uploadFromHero = true; loadFile(e.dataTransfer.files[0]); });
  el.prev.addEventListener('click', async () => { if (state.page > 1) { state.page--; await renderPage(); } });
  el.next.addEventListener('click', async () => { if (state.page < state.pdf.numPages) { state.page++; await renderPage(); } });
  el.create.addEventListener('click', () => { updateSignatureButton(); el.dialog.showModal(); });
  el.close.addEventListener('click', () => el.dialog.close());
  el.drawTab.addEventListener('click', () => setMethod('draw'));
  el.typeTab.addEventListener('click', () => setMethod('type'));
  el.typedName.addEventListener('input', updateTypedPreview);
  document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
    state.font = button.dataset.font;
    document.querySelectorAll('[data-font]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    updateTypedPreview();
  }));
  document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => {
    state.ink = button.dataset.color;
    if (state.hasDrawing) {
      drawCtx.globalCompositeOperation = 'source-in'; drawCtx.fillStyle = state.ink;
      drawCtx.fillRect(0, 0, el.drawCanvas.width, el.drawCanvas.height); drawCtx.globalCompositeOperation = 'source-over';
    }
    drawCtx.strokeStyle = state.ink;
    document.querySelectorAll('[data-color]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    updateTypedPreview();
  }));
  document.querySelector('.tab-row').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const draw = event.key === 'Home' || (event.key !== 'End' && state.method !== 'draw');
    setMethod(draw ? 'draw' : 'type'); (draw ? el.drawTab : el.typeTab).focus();
  });
  el.dialog.addEventListener('click', (event) => {
    if (event.target !== el.dialog) return;
    const rect = el.dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) el.dialog.close();
  });
  el.drawCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); el.drawCanvas.setPointerCapture(e.pointerId);
    const p = pointOnCanvas(e); drawCtx.beginPath(); drawCtx.moveTo(p.x, p.y); drawCtx.lineTo(p.x + .01, p.y + .01); drawCtx.stroke();
    state.drawing = true; state.hasDrawing = true;
    updateSignatureButton();
  });
  el.drawCanvas.addEventListener('pointermove', (e) => { if (!state.drawing) return; const p = pointOnCanvas(e); drawCtx.lineTo(p.x, p.y); drawCtx.stroke(); });
  for (const eventName of ['pointerup', 'pointercancel']) el.drawCanvas.addEventListener(eventName, () => { state.drawing = false; });
  el.clear.addEventListener('click', () => { drawCtx.clearRect(0, 0, el.drawCanvas.width, el.drawCanvas.height); state.hasDrawing = false; updateSignatureButton(); });
  el.use.addEventListener('click', async () => {
    if (state.method === 'type') await document.fonts.load(`88px "${state.font}"`).catch(() => {});
    const signature = state.method === 'draw' ? (state.hasDrawing ? trimCanvas(el.drawCanvas) : null) : makeTypedSignature();
    if (!signature) { el.dialogError.textContent = 'Draw or type your signature to continue.'; return; }
    const image = new Image(); image.src = signature; await image.decode(); state.ratio = image.naturalWidth / image.naturalHeight;
    state.signature = signature; newPlacement(); el.dialog.close(); setStatus('Drag your signature into place, then download the PDF.');
  });
  el.size.addEventListener('input', () => {
    el.sizeValue.textContent = `${el.size.value}%`;
    if (!state.placement) return;
    const oldWidth = state.placement.width, newWidth = Number(el.size.value) / 100;
    state.placement.x = Math.max(0, Math.min(1 - newWidth, state.placement.x + (oldWidth - newWidth) / 2));
    state.placement.width = newWidth; syncLayer();
  });
  el.remove.addEventListener('click', () => { state.placement = null; state.downloaded = false; el.layer.classList.add('hidden'); updateControls(); setStatus('Signature removed. Create a new one when you are ready.'); });
  el.layer.addEventListener('pointerdown', (e) => {
    e.preventDefault(); el.layer.setPointerCapture(e.pointerId);
    state.drag = { startX: e.clientX, startY: e.clientY, x: state.placement.x, y: state.placement.y };
  });
  el.layer.addEventListener('pointermove', (e) => {
    if (!state.drag || !state.placement) return;
    const rect = el.pageWrap.getBoundingClientRect();
    const heightRatio = el.layer.getBoundingClientRect().height / rect.height;
    state.placement.x = Math.max(0, Math.min(1 - state.placement.width, state.drag.x + (e.clientX - state.drag.startX) / rect.width));
    state.placement.y = Math.max(0, Math.min(1 - heightRatio, state.drag.y + (e.clientY - state.drag.startY) / rect.height));
    syncLayer();
  });
  for (const eventName of ['pointerup', 'pointercancel']) el.layer.addEventListener(eventName, () => { state.drag = null; });
  el.layer.addEventListener('keydown', (e) => {
    if (!state.placement || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const delta = e.shiftKey ? .025 : .005;
    if (e.key === 'ArrowLeft') state.placement.x = Math.max(0, state.placement.x - delta);
    if (e.key === 'ArrowRight') state.placement.x = Math.min(1 - state.placement.width, state.placement.x + delta);
    if (e.key === 'ArrowUp') state.placement.y = Math.max(0, state.placement.y - delta);
    if (e.key === 'ArrowDown') state.placement.y += delta;
    syncLayer();
  });
  el.download.addEventListener('click', downloadPdf);
  let resizeTimer;
  window.addEventListener('resize', () => { if (!state.pdf) return; clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPage, 150); });
  updateControls();
})();
