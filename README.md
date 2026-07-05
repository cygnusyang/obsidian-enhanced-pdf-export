# Enhanced PDF Export

Obsidian 插件：比默认 PDF export 更强的 Markdown 导出工具。

它适合导出包含 Mermaid、HTML、SVG、表格、Callout 和其他视觉内容的富 Markdown。插件会先调用 Obsidian 自己的 Markdown 渲染器生成预览结果，再通过 Electron 打印成 PDF，尽量保留默认 PDF export 容易丢失的视觉内容。

## 功能特点

- 使用 Obsidian 自己的 Markdown 渲染器生成预览 HTML。
- 支持导出内联 HTML、SVG、Mermaid 等渲染后的视觉内容。
- 导出前等待字体、图片、SVG、Mermaid 渲染稳定。
- 默认生成封面和目录。
- 使用 A4、打印背景和固定页边距输出 PDF。

## 安装方式

### 方式一：用 Git 安装

进入你的 vault 插件目录：

```bash
cd /path/to/your-vault
mkdir -p .obsidian/plugins
git clone https://github.com/cygnusyang/obsidian-enhanced-pdf-export.git .obsidian/plugins/enhanced-pdf-export
```

然后在 Obsidian 中执行：

1. 打开 `Settings -> Community plugins`。
2. 关闭 `Restricted mode`。
3. 点击刷新按钮，或执行命令 `Reload app without saving`。
4. 启用 `Enhanced PDF Export`。

### 方式二：手动下载安装

从 GitHub 下载仓库后，把以下文件放到：

`<your-vault>/.obsidian/plugins/enhanced-pdf-export/`

必需文件：

- `manifest.json`
- `main.js`
- `styles.css`

目录结构应类似：

```text
your-vault/
└── .obsidian/
    └── plugins/
        └── enhanced-pdf-export/
            ├── manifest.json
            ├── main.js
            └── styles.css
```

然后回到 Obsidian 的 `Settings -> Community plugins` 启用插件。

## 使用方式

1. 打开要导出的 Markdown 文件。
2. 点击左侧 ribbon 的导出按钮，或打开命令面板执行 `Enhanced PDF Export: Export active Markdown to PDF`。

也可以在文件列表里右键某个 Markdown 文件，选择 `Export to PDF`。

PDF 会生成在 Markdown 文件同目录，文件名相同，扩展名为 `.pdf`。

## 开发安装

如果你在本地修改插件代码，推荐用软链接安装到 vault：

```bash
mkdir -p /path/to/vault/.obsidian/plugins
ln -s /path/to/enhanced-pdf-export /path/to/vault/.obsidian/plugins/enhanced-pdf-export
```

如果用于调试，推荐安装 `hot-reload`，并在插件目录放置本地 `.hotreload` 标记文件。修改 `main.js`、`styles.css` 或 `manifest.json` 后，Hot Reload 会自动重新加载插件，不需要完整重启 Obsidian。

## 设计目标

插件使用 Obsidian 的 Markdown 渲染器先渲染当前文件，再通过 Electron `printToPDF` 导出。这样内联 HTML、SVG、Mermaid 渲染结果会比 Obsidian 默认 PDF 导出更稳定。

## 限制

- 仅支持 Obsidian Desktop。
- 如果某个第三方插件的渲染依赖交互或异步网络请求，导出时可能需要增加等待时间。
- 当前版本没有设置页，输出路径固定为同目录同名 PDF。
- 当前版本只导出单个 Markdown 文件；旧工具里的批量导出和 Git hook 没有合并进来。
