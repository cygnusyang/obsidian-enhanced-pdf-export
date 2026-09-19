# Enhanced PDF Export

[English](README.md) | 简体中文

一个更强的 Markdown PDF 导出插件。

Enhanced PDF Export 专为包含富视觉内容的笔记设计，例如 Mermaid 图表、内联 HTML、SVG、表格、Callout 和图片。它会先使用 Obsidian 的预览渲染器渲染当前 Markdown 文件，再通过 Electron 打印功能将渲染结果导出为 PDF。

目标是完整保留默认 PDF 导出器可能遗漏或错误扁平化的视觉内容。

## 功能

- 将当前 Markdown 文件导出为 PDF。
- 保留渲染后的 Mermaid、内联 HTML、SVG、表格、Callout 和图片。
- 打印前等待字体、图片、SVG 和 Mermaid 图表加载完成。
- 可选的封面页和目录。
- 默认使用 A4 纸张、打印背景和稳定的页边距。
- 提供侧边栏按钮、命令面板命令和文件右键菜单入口。

## 安装

### 通过 Git 安装

将本仓库克隆到你的 vault 插件目录：

```bash
cd /path/to/your-vault
mkdir -p .obsidian/plugins
git clone https://github.com/cygnusyang/obsidian-enhanced-pdf-export.git .obsidian/plugins/enhanced-pdf-export
```

然后打开 Obsidian：

1. 进入 `Settings -> Community plugins`。
2. 如有需要，关闭 `Restricted mode`。
3. 重新加载应用，或运行 `Reload app without saving`。
4. 启用 `Enhanced PDF Export`。

### 手动安装

在你的 vault 中创建以下目录：

```text
<your-vault>/.obsidian/plugins/enhanced-pdf-export/
```

下载或复制这些文件到该目录：

- `manifest.json`
- `main.js`
- `styles.css`

最终结构如下：

```text
your-vault/
└── .obsidian/
    └── plugins/
        └── enhanced-pdf-export/
            ├── manifest.json
            ├── main.js
            └── styles.css
```

然后进入 `Settings -> Community plugins` 并启用 `Enhanced PDF Export`。

## 使用

1. 打开要导出的 Markdown 文件。
2. 点击侧边栏的导出按钮，或在命令面板中运行 `Enhanced PDF Export: Export active Markdown to PDF`。

也可以在文件列表中右键点击 Markdown 文件，选择 `Export to PDF`。

导出的 PDF 会写入源 Markdown 文件所在目录，文件名相同，扩展名为 `.pdf`。

## 开发

本地开发时，可以将本仓库软链接到一个测试 vault：

```bash
mkdir -p /path/to/vault/.obsidian/plugins
ln -s /path/to/enhanced-pdf-export /path/to/vault/.obsidian/plugins/enhanced-pdf-export
```

为了快速迭代，可以安装 `hot-reload` 开发插件，并在本插件目录中创建一个空的 `.hotreload` 标记文件。修改 `main.js`、`styles.css` 和 `manifest.json` 后会自动重新加载。

## 已知限制

- 仅支持桌面端。
- 一次只能导出一个 Markdown 文件。
- 输出路径目前固定为源 Markdown 文件所在目录。
- 动态的第三方插件渲染可能需要在导出前额外等待。

---

**Cygnus Yang** · [GitHub](https://github.com/cygnusyang) · [Enhanced PDF Export](https://github.com/cygnusyang/obsidian-enhanced-pdf-export) · MIT License
