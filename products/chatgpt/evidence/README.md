# ChatGPT 内容证据

官方文档核对日期：2026-10-12（Asia/Kuala_Lumpur）。

当前教学覆盖 60 个页面、207 个控件与 5 条引导，完整层级见 [界面清单](../inventory.md)。其中 195 个控件有官方文档支持，12 个需要进一步核对名称或位置；所有布局仍待真实 Windows / Plus 账号实测。

`product.json` 是教学重建，不是 OpenAI 产品、登录页、逐像素复刻或可调用真实服务的 App。该产品未通过真实最新版 Windows / Plus UI 实测。`documented` 只代表官方文档支持相应能力；入口位置没有实测。位置或名称尚未在来源中明确确认的控件标为 `needs-review`。没有 `ui-verified` 内容。

主要结构依据：[新版迁移说明](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app)、[桌面设置](https://learn.chatgpt.com/docs/reference/settings)、[Projects](https://learn.chatgpt.com/docs/projects) 与各控件列出的官方来源。来源全文未复制入仓库。中文解释是简短原创学习说明。

ChatGPT Classic 不作为最新版桌面的默认模拟。Chat / Work 共用 ChatGPT 视图历史，Codex 历史独立。模型按视图区分；Plus 不提供本手册中的 Pro 专属 Ultrafast 模拟入口。Computer History 为 macOS 功能，未列为 Windows 可用功能。

隐私路径以最新官方 [Data controls](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt)、[Memory](https://help.openai.com/en/articles/8590148-memory-in-chatgpt)、[Temporary chat](https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt) 为准。账号网页端路径与新版 Windows 待核验入口有明确区分。

初始化时 `updates.json` 包含四条已查阅官方发布说明的编辑基线记录，日期是官方发布日期；这些记录的 `detectedAt` 是初始化时间，不表示 Actions 已成功抓取。来源状态初始为 pending，lastAttemptAt / lastSuccessAt 均为 null；当前抓取状态与成功时间以 `tracking.json` 及网站来源状态为准。第一次成功抓取只建立比对快照，后续变化才生成自动更新记录。

公告来源另包括 [OpenAI 官方 RSS](https://openai.com/news/rss.xml)，只匹配 ChatGPT / Codex 关键词，不使用单独的 Work 作为过滤条件。首次配置后保持未检测状态，真实采集成功后才记录时间。

`product.json`、`sources.json` 和 `updates.json` 是内容维护的权威文件。初始生成脚本已移除，避免维护时意外覆盖已修订说明与抓取历史。`tracking.json` 由采集器更新；编辑手册不要重置其哈希和成功时间。

后续真实界面核验应检查同一 Windows build 与个人 Plus 账号，在证据记录中填写菜单路径、账号差异与截图来源，再将相应 guide 改为 ui-verified。未登录、未获功能权限或分批推出的入口应继续标明限制，不能以此认定功能已删除。
