# App Manual 维护规则

- 优先发现 `.agents/skills/**/SKILL.md` 的 name/description，再只读取相关技能。本项目已有 `playwright-cli` 用于浏览器验收。
- 产品专属内容、来源、适配器、新闻、图片和核验记录全部放到 `products/<id>/`。新增产品自动发现，不增加中央注册表。
- `src/types.ts` 为共用接口，`scripts/validate.mjs` 检查 JSON、引用和适配器；修改结构时同步二者。
- 读取待维护产品的 evidence/README.md 与 docs/TRACKING.md。不得重置采集历史或用首次生成脚本覆盖手册。
- 每个模拟按钮需要用途、步骤、结果、条件、排错和官方来源；缺证据明确 needs-review，只有检查过真实指定版本 UI 才能标 ui-verified。
- 发布日期与发现日期分开；新闻摘要不得从标题猜测功能。核验后补充 summaryZh 并设置 interpretation reviewed。
- 抓取失败保留最后有效数据；不将来源缺失视为功能删除。只保存来源元数据及哈希，不公开全文。
- 不加入付费模型 API。模拟操作使用演示数据；学习与已读记录保存浏览器本地。
- 修改后运行 validate、npm test、build；界面或路径变化运行相关 Playwright 验收并检查截图。
- GitHub Pages 由现有工作流部署；保持 main、Asia/Kuala_Lumpur 09:17/21:17、手动运行和同一次工作流直接部署。
