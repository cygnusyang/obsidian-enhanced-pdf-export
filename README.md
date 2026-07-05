# AI Native Export

Obsidian 插件：把 AI 生成的富 Markdown 一键导出为可交付 PDF。

它面向 AI native 的写作方式：正文里可能混合 Markdown、Mermaid、HTML、SVG、表格、Callout 和其他视觉内容。插件会先调用 Obsidian 自己的渲染器生成预览结果，再通过 Electron 打印成 PDF，尽量保留这些视觉内容。

这个插件合并了旧工具 `/Users/cygnus/work/obsidian-pdf` 的核心思路，但不再要求从命令行运行脚本：

- 使用 Obsidian 自己的 Markdown 渲染器生成预览 HTML。
- 导出前等待字体、图片、SVG、Mermaid 渲染稳定。
- 默认生成封面和目录。
- 使用 A4、打印背景和固定页边距输出 PDF。

## 使用方式

1. 重启 Obsidian，或在 `Settings -> Community plugins` 里刷新插件。
2. 启用 `AI Native Export`。
3. 打开要导出的 Markdown 文件。
4. 点击左侧 ribbon 的导出按钮，或打开命令面板执行 `AI Native Export: Export active Markdown to PDF`。

也可以在文件列表里右键某个 Markdown 文件，选择 `Export to PDF`。

## 本地开发安装

可以把这个插件目录复制或软链接到任意 vault：

```bash
mkdir -p /path/to/vault/.obsidian/plugins
ln -s /path/to/ai-native-export /path/to/vault/.obsidian/plugins/ai-native-export
```

或者直接复制：

```bash
cp -R /path/to/ai-native-export /path/to/vault/.obsidian/plugins/ai-native-export
```

如果用于调试，推荐安装 `hot-reload`，并在插件目录放置本地 `.hotreload` 标记文件。修改 `main.js`、`styles.css` 或 `manifest.json` 后，Hot Reload 会自动重新加载插件，不需要完整重启 Obsidian。

注意：第一次新增插件目录时，Obsidian 可能仍需要执行一次 `Reload app without saving` 或重新打开 vault，后续调试修改不需要反复重启。

PDF 会生成在 Markdown 文件同目录，文件名相同，扩展名为 `.pdf`。

## 设计目标

插件使用 Obsidian 的 Markdown 渲染器先渲染当前文件，再通过 Electron `printToPDF` 导出。这样内联 HTML、SVG、Mermaid 渲染结果会比 Obsidian 默认 PDF 导出更稳定。

## 限制

- 仅支持 Obsidian Desktop。
- 如果某个第三方插件的渲染依赖交互或异步网络请求，导出时可能需要增加等待时间。
- 当前版本没有设置页，输出路径固定为同目录同名 PDF。
- 当前版本只导出单个 Markdown 文件；旧工具里的批量导出和 Git hook 没有合并进来。
