# content/assets/

存放被 MDX / 检查器引用的图片、流程图导出、系统截图。

- 每个实体一个子目录，例如 `assets/sd-va01/order-screen.png`；
- 文件名 kebab-case，不用中文、空格；
- 截图必须打码，不出现客户名、订单号、系统地址；
- 构建时由脚本复制到 `public/assets/` 并加内容哈希；
- 单图建议 ≤ 300KB，优先 WebP/SVG。
