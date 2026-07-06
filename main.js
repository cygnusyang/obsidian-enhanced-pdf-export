const { MarkdownRenderer, Notice, Plugin, TFile } = require("obsidian");

const DEFAULT_SETTINGS = {
  outputSuffix: "",
  openAfterExport: true,
  printBackground: true,
  includeCover: true,
  includeToc: true,
  tocDepth: 3,
  settleMs: 1500,
  pageSize: "A4",
  marginTop: 0.55,
  marginBottom: 0.55,
  marginLeft: 0.55,
  marginRight: 0.55,
};

module.exports = class EnhancedPdfExportPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addRibbonIcon("file-output", "Export active Markdown to PDF", () => {
      const file = this.app.workspace.getActiveFile();
      if (file instanceof TFile && file.extension === "md") {
        this.exportFile(file);
      } else {
        new Notice("Open a Markdown file before exporting PDF.");
      }
    });

    this.addCommand({
      id: "export-active-markdown-to-pdf",
      name: "Export active Markdown to PDF",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const ok = file instanceof TFile && file.extension === "md";
        if (checking) return ok;
        if (ok) this.exportFile(file);
      },
    });

    this.addCommand({
      id: "export-active-markdown-to-pdf-no-open",
      name: "Export active Markdown to PDF without opening",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const ok = file instanceof TFile && file.extension === "md";
        if (checking) return ok;
        if (ok) this.exportFile(file, { openAfterExport: false });
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        menu.addItem((item) => {
          item
            .setTitle("Export to PDF")
            .setIcon("file-output")
            .onClick(() => this.exportFile(file));
        });
      })
    );
  }

  async exportFile(file, overrides = {}) {
    try {
      new Notice(`Exporting PDF: ${file.basename}`);
      const markdown = await this.app.vault.read(file);
      const parsed = this.parseFrontmatter(markdown);
      const rendered = await this.renderMarkdown(file, parsed.body);
      const html = this.buildPrintableHtml(file, rendered, parsed.meta);
      const pdfPath = await this.writePdf(file, html, overrides);
      new Notice(`PDF exported: ${pdfPath}`);
      if (overrides.openAfterExport ?? this.settings.openAfterExport) {
        this.openPath(pdfPath);
      }
    } catch (error) {
      console.error("Enhanced PDF Export failed", error);
      new Notice(`PDF export failed: ${error.message || error}`);
    }
  }

  async renderMarkdown(file, markdown) {
    const root = document.createElement("div");
    root.className = "markdown-reading-view enhanced-pdf-export-render-root";
    const content = root.createDiv({ cls: "markdown-preview-view markdown-rendered" });
    document.body.appendChild(root);
    try {
      const protectedMarkdown = this.protectRawSvgBlocks(markdown);
      await MarkdownRenderer.render(this.app, protectedMarkdown.markdown, content, file.path, this);
      this.restoreRawSvgBlocks(content, protectedMarkdown.blocks);
      await this.waitForRenderSettled(content);
      this.inlineSvgDimensions(content);
      return content.innerHTML;
    } finally {
      root.remove();
    }
  }

  protectRawSvgBlocks(markdown) {
    const blocks = [];
    let protectedMarkdown = markdown.replace(/<figure\b[\s\S]*?<svg\b[\s\S]*?<\/svg>[\s\S]*?<\/figure>/gi, (block) => {
      return this.createRawSvgPlaceholder(blocks, block);
    });

    protectedMarkdown = protectedMarkdown.replace(/<svg\b[\s\S]*?<\/svg>/gi, (block) => {
      return this.createRawSvgPlaceholder(blocks, block);
    });

    return { markdown: protectedMarkdown, blocks };
  }

  createRawSvgPlaceholder(blocks, block) {
    const index = blocks.length;
    blocks.push(block);
    return `<div data-enhanced-pdf-raw-svg="${index}"></div>`;
  }

  restoreRawSvgBlocks(container, blocks) {
    for (const placeholder of Array.from(container.querySelectorAll("[data-enhanced-pdf-raw-svg]"))) {
      const index = Number(placeholder.getAttribute("data-enhanced-pdf-raw-svg"));
      const block = blocks[index];
      if (!block) continue;
      const template = document.createElement("template");
      template.innerHTML = block.trim();
      placeholder.replaceWith(template.content);
    }
  }

  async waitForRenderSettled(container) {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }

    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));

    const hasMermaid = container.querySelector(".mermaid");
    if (hasMermaid && !container.querySelector(".mermaid svg")) {
      await this.waitForSelector(container, ".mermaid svg", 10000);
    }

    await new Promise((resolve) => window.setTimeout(resolve, this.settings.settleMs));
  }

  waitForSelector(container, selector, timeoutMs) {
    if (container.querySelector(selector)) return Promise.resolve();
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (container.querySelector(selector)) {
          observer.disconnect();
          window.clearTimeout(timer);
          resolve();
        }
      });
      const timer = window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeoutMs);
      observer.observe(container, { childList: true, subtree: true });
    });
  }

  inlineSvgDimensions(container) {
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      if (!svg.getAttribute("width")) svg.setAttribute("width", "100%");
      if (!svg.style.maxWidth) svg.style.maxWidth = "100%";
      if (!svg.style.height) svg.style.height = "auto";
    }
  }

  buildPrintableHtml(file, renderedHtml, meta = {}) {
    const titleText = meta.title || this.extractFirstHeading(renderedHtml) || file.basename;
    const title = this.escapeHtml(titleText);
    const prepared = this.prepareContent(renderedHtml);
    const toc = this.settings.includeToc ? this.generateToc(prepared.headings) : "";
    const cover = this.settings.includeCover ? this.generateCover({ ...meta, title: titleText }) : "";
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${this.settings.pageSize};
      margin: ${this.settings.marginTop}in ${this.settings.marginRight}in ${this.settings.marginBottom}in ${this.settings.marginLeft}in;
    }
    * {
      box-sizing: border-box;
    }
    html, body {
      background: #ffffff !important;
      color: #1f2933;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 14px;
      line-height: 1.65;
    }
    body {
      margin: 0;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .pdf-export-cover {
      min-height: calc(100vh - 1.1in);
      display: flex;
      flex-direction: column;
      justify-content: center;
      page-break-after: always;
      break-after: page;
      text-align: center;
    }
    .pdf-export-cover h1 {
      font-size: 32px;
      line-height: 1.35;
      margin: 0 0 18px;
    }
    .pdf-export-cover .subtitle {
      color: #53606f;
      font-size: 17px;
      margin: 0 0 40px;
    }
    .pdf-export-cover .meta {
      color: #667085;
      font-size: 14px;
    }
    .pdf-export-cover .abstract {
      max-width: 620px;
      margin: 56px auto 0;
      text-align: left;
      color: #344054;
      border-top: 1px solid #d8dee9;
      padding-top: 18px;
    }
    .pdf-export-toc {
      page-break-after: always;
      break-after: page;
    }
    .pdf-export-toc h2 {
      margin-top: 0;
    }
    .pdf-export-toc ol {
      list-style: none;
      padding-left: 0;
    }
    .pdf-export-toc li {
      margin: 6px 0;
    }
    .pdf-export-toc .level-3 {
      padding-left: 24px;
      font-size: 13px;
    }
    .print-container {
      max-width: 820px;
      margin: 0 auto;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    p {
      margin: 0 0 12px;
    }
    h1 {
      font-size: 28px;
      line-height: 1.35;
      margin: 0 0 22px;
      color: #101828;
    }
    h2 {
      font-size: 22px;
      line-height: 1.4;
      margin: 34px 0 14px;
      border-bottom: 1px solid #e4e7ec;
      padding-bottom: 6px;
      color: #182230;
    }
    h3 {
      font-size: 17px;
      line-height: 1.45;
      margin: 24px 0 10px;
      color: #293646;
    }
    h4 {
      font-size: 15px;
      line-height: 1.45;
      margin: 18px 0 8px;
      color: #344054;
    }
    ul, ol {
      padding-left: 24px;
      margin: 8px 0 14px;
    }
    li {
      margin: 4px 0;
    }
    a {
      color: #175cd3;
      text-decoration: none;
    }
    svg, img, canvas {
      max-width: 100%;
      height: auto;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      break-inside: auto;
      margin: 12px 0 18px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #d8dee9;
      padding: 6px 8px;
      vertical-align: top;
    }
    th {
      background: #f3f6fa;
    }
    pre, blockquote {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    pre {
      white-space: pre-wrap;
      background: #f6f8fa;
      border: 1px solid #d8dee9;
      padding: 10px 12px;
      border-radius: 6px;
    }
    blockquote {
      margin: 14px 0;
      padding: 8px 14px;
      border-left: 4px solid #98a2b3;
      background: #f8fafc;
      color: #344054;
    }
    h1, h2, h3 {
      break-after: avoid;
      page-break-after: avoid;
    }
    .mermaid {
      text-align: center;
      margin: 18px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .callout {
      border: 1px solid #d0d5dd;
      border-left: 4px solid #2e90fa;
      border-radius: 6px;
      background: #f8fbff;
      padding: 10px 12px;
      margin: 14px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .callout-title {
      font-weight: 700;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <main class="print-container markdown-preview-view markdown-rendered">
    ${cover}
    ${toc}
    ${prepared.html}
  </main>
</body>
</html>`;
  }

  generateCover(meta) {
    const subtitle = meta.subtitle ? `<p class="subtitle">${this.escapeHtml(meta.subtitle)}</p>` : "";
    const author = meta.author ? `<div>${this.escapeHtml(meta.author)}</div>` : "";
    const date = meta.date ? `<div>${this.escapeHtml(this.formatDate(meta.date))}</div>` : "";
    const abstract = meta.abstract
      ? `<section class="abstract"><strong>摘要</strong><p>${this.escapeHtml(meta.abstract)}</p></section>`
      : "";

    return `<section class="pdf-export-cover">
      <h1>${this.escapeHtml(meta.title || "Untitled")}</h1>
      ${subtitle}
      <div class="meta">${author}${date}</div>
      ${abstract}
    </section>`;
  }

  prepareContent(renderedHtml) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderedHtml;
    const headings = Array.from(wrapper.querySelectorAll("h1, h2, h3"))
      .filter((heading) => {
        const level = Number(heading.tagName.slice(1));
        return level <= this.settings.tocDepth;
      })
      .map((heading, index) => {
        if (!heading.id) heading.id = `pdf-export-heading-${index + 1}`;
        return {
          id: heading.id,
          level: Number(heading.tagName.slice(1)),
          text: heading.textContent.trim(),
        };
      })
      .filter((heading) => heading.text);

    return { html: wrapper.innerHTML, headings };
  }

  generateToc(headings) {
    if (headings.length === 0) return "";

    const items = headings.map((heading) => {
      return `<li class="level-${heading.level}"><a href="#${this.escapeAttribute(heading.id)}">${this.escapeHtml(heading.text)}</a></li>`;
    }).join("\n");
    return `<nav class="pdf-export-toc"><h2>目录</h2><ol>${items}</ol></nav>`;
  }

  async writePdf(file, html, overrides = {}) {
    const electron = this.getElectron();
    const outputPath = this.buildOutputPath(file);
    const htmlUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    const BrowserWindow = electron.BrowserWindow || electron.remote?.BrowserWindow;
    if (!BrowserWindow) {
      throw new Error("Electron BrowserWindow is not available in this Obsidian environment.");
    }

    const win = new BrowserWindow({
      show: false,
      width: 1100,
      height: 1400,
      webPreferences: {
        sandbox: false,
        contextIsolation: false,
        nodeIntegration: false,
      },
    });

    try {
      await win.loadURL(htmlUrl);
      await win.webContents.executeJavaScript(`
        Promise.resolve(document.fonts && document.fonts.ready)
          .catch(function () {})
          .then(function () {
            return new Promise(function (resolve) {
              var wait = ${JSON.stringify(this.settings.settleMs)};
              setTimeout(resolve, wait);
            });
          });
      `);
      const contentStats = await win.webContents.executeJavaScript(`
        ({
          textLength: (document.body.innerText || "").trim().length,
          svgCount: document.querySelectorAll("svg").length,
          imageCount: document.querySelectorAll("img").length,
          bodyHtmlLength: document.body.innerHTML.length
        });
      `);
      if (!contentStats.textLength && !contentStats.svgCount && !contentStats.imageCount) {
        throw new Error(`Printable HTML is empty before PDF export. bodyHtmlLength=${contentStats.bodyHtmlLength}`);
      }
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: overrides.printBackground ?? this.settings.printBackground,
        pageSize: this.settings.pageSize,
        preferCSSPageSize: true,
        margins: {
          top: this.settings.marginTop,
          bottom: this.settings.marginBottom,
          left: this.settings.marginLeft,
          right: this.settings.marginRight,
        },
      });
      await this.writeBinaryFile(outputPath, pdfBuffer);
      return outputPath;
    } finally {
      win.close();
    }
  }

  buildOutputPath(file) {
    const dir = file.parent?.path && file.parent.path !== "/" ? `${file.parent.path}/` : "";
    const suffix = this.settings.outputSuffix || "";
    return `${dir}${file.basename}${suffix}.pdf`;
  }

  async writeBinaryFile(path, buffer) {
    const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.vault.adapter.writeBinary(path, data);
      return;
    }
    await this.app.vault.createBinary(path, data);
  }

  openPath(filePath) {
    this.app.workspace.openLinkText(filePath, "", false).catch(() => {});
  }

  getElectron() {
    if (window.require) return window.require("electron");
    throw new Error("Electron APIs are unavailable. This plugin works only in Obsidian Desktop.");
  }

  parseFrontmatter(markdown) {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
    if (!match) return { meta: {}, body: markdown };

    const meta = {};
    for (const line of match[1].split(/\r?\n/)) {
      const parts = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!parts) continue;
      const key = parts[1];
      let value = parts[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (["title", "subtitle", "author", "date", "abstract", "description"].includes(key)) {
        meta[key] = value;
      }
    }
    if (!meta.abstract && meta.description) meta.abstract = meta.description;
    return { meta, body: markdown.slice(match[0].length) };
  }

  extractFirstHeading(renderedHtml) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderedHtml;
    return wrapper.querySelector("h1, h2")?.textContent.trim() || "";
  }

  formatDate(value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    }
    return String(value);
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replace(/'/g, "&#39;");
  }
};
