# Enhanced PDF Export

A stronger PDF exporter for rendered Markdown.

Enhanced PDF Export is designed for notes that contain rich visual content such as Mermaid diagrams, inline HTML, SVG, tables, callouts, and images. It renders the active Markdown file through the app preview renderer first, then exports that rendered result to PDF with Electron printing.

The goal is to preserve visual content that the default PDF exporter may miss or flatten incorrectly.

## Features

- Exports the active Markdown file to PDF.
- Preserves rendered Mermaid, inline HTML, SVG, tables, callouts, and images.
- Waits for fonts, images, SVG, and Mermaid diagrams before printing.
- Adds an optional cover page and table of contents.
- Uses A4 paper, print backgrounds, and stable margins by default.
- Adds a ribbon action, command palette actions, and a file context menu action.

## Installation

### Install with Git

Clone this repository into your vault's plugins directory:

```bash
cd /path/to/your-vault
mkdir -p .obsidian/plugins
git clone https://github.com/cygnusyang/obsidian-enhanced-pdf-export.git .obsidian/plugins/enhanced-pdf-export
```

Then open the app:

1. Go to `Settings -> Community plugins`.
2. Turn off `Restricted mode` if needed.
3. Reload the app or run `Reload app without saving`.
4. Enable `Enhanced PDF Export`.

### Manual Installation

Create this directory in your vault:

```text
<your-vault>/.obsidian/plugins/enhanced-pdf-export/
```

Download or copy these files into that directory:

- `manifest.json`
- `main.js`
- `styles.css`

The final structure should look like this:

```text
your-vault/
└── .obsidian/
    └── plugins/
        └── enhanced-pdf-export/
            ├── manifest.json
            ├── main.js
            └── styles.css
```

Then go to `Settings -> Community plugins` and enable `Enhanced PDF Export`.

## Usage

1. Open the Markdown file you want to export.
2. Click the ribbon export button, or run `Enhanced PDF Export: Export active Markdown to PDF` from the command palette.

You can also right-click a Markdown file in the file explorer and choose `Export to PDF`.

The PDF is written next to the source Markdown file with the same base name and a `.pdf` extension.

## Development

For local development, symlink this repository into a test vault:

```bash
mkdir -p /path/to/vault/.obsidian/plugins
ln -s /path/to/enhanced-pdf-export /path/to/vault/.obsidian/plugins/enhanced-pdf-export
```

For faster iteration, install the `hot-reload` development plugin and create a local `.hotreload` marker file in this plugin directory. Changes to `main.js`, `styles.css`, and `manifest.json` will reload automatically.

## Limitations

- Desktop only.
- Exports one Markdown file at a time.
- Output path is currently fixed to the same directory as the source Markdown file.
- Dynamic third-party plugin rendering may require additional wait time before export.

## 中文说明

Enhanced PDF Export 是一个更强的 Markdown PDF 导出插件，适合导出包含 Mermaid、HTML、SVG、表格、Callout 和图片的富 Markdown 文档。插件会先使用预览渲染器生成页面，再将渲染后的结果导出为 PDF。

安装方式：把 `manifest.json`、`main.js`、`styles.css` 放到 `<你的 vault>/.obsidian/plugins/enhanced-pdf-export/`，然后在 `Settings -> Community plugins` 中启用 `Enhanced PDF Export`。
