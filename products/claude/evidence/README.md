# Claude 内容证据与覆盖范围

当前教学覆盖 42 个页面、171 个控件与 5 条引导，完整层级见 [界面清单](../inventory.md)。其中 168 个控件有官方文档支持，3 个需要进一步核对名称或位置；所有布局仍待真实 Windows / Pro 账号实测。

本手册于 2026-10-12 阅读 Claude 官方帮助中心与 Claude Code 官方桌面文档后制作。每个控件有具体来源 ID，链接在上级 `sources.json`。所有控件的 `documented` 指官方资料支持功能与操作路径；**没有登录真实 Claude Pro Windows 账号核验，所以没有 `ui-verified` 记录**。核验日期是资料阅读日期，不是实际桌面版本号。

屏幕和按钮采用教学模拟：文档、文件、任务、插件名称是示例，按钮布局经过简化。操作提示会说明平台、套餐与逐步上线条件。官方资料没有给出完整可见界面清单；当前清单覆盖查到资料的主要层级，不声称覆盖每个账户、系统文件选择器和第三方 OAuth 页面里的每个按钮。未来获得实际账号界面后，需逐页对照补齐并升级证据状态。

主要版本界线：

- 统一 Claude 体验先向 Pro / Max 逐步上线；未迁移账号仍有 Chat / Cowork。主页使用最新体验，`differences` 保留旧路径。
- 2026-10-06 后 Pro / Max 新 Cowork 任务使用云端；旧本地任务和计划可能保留本地。云端任务访问本机文件、内置浏览器和 computer use 仍需要桌面在线。
- 最新统一体验没有 Web search 开关。Research 保留 `+` 或 `/deep-research` 路径。Incognito 仍使用旧聊天体验，不支持运行代码和创建文件。
- 最新 Code 桌面文档将电脑设置写为 `This computer > System`，较早 Cowork 帮助页仍写 `Desktop app > General`。手册明确这一差异，不臆造精确像素位置。
- Windows computer use 已见于当前官方资料，为 Pro / Max beta；不会向 Windows 用户套用 Mac 的 Accessibility / Screen Recording 设置步骤。
- 内置浏览器的 Cookie 导入在 Windows 当前文档只列 Firefox；没有制作从 Windows Chrome / Edge 导入的虚构按钮。
- Motion 模板目前属于 Team / Enterprise，未作为 Pro 可用功能模拟。Dispatch 不向新用户开放；未制作新的 Dispatch 配对流程。
- 新 Artifacts 使用 Share，新共享访问要求 Claude 账号；旧 legacy 成果的 Publish 保留独立规则。Docs 不支持个人套餐按邮箱邀请，所以未添加该按钮。

来源状态初始为 pending：资料浏览不是定时抓取成功，故 lastAttemptAt / lastSuccessAt 初始为 null。5 条编辑初始新闻均是 baseline，日期来自官方发布说明或明确的迁移日期；不冒充新检测到的新闻。当前抓取状态与成功时间以 `tracking.json` 及网站来源状态为准。第一次成功抓取只建立比对快照，后续变化才生成自动更新记录。

公告来源另包括 [Anthropic 官方 Newsroom](https://www.anthropic.com/news)，匹配 Claude / Cowork 关键词，并只读取已经核对存在的 main 内容区。新闻卡片的日期和标题依照对应页面解析，无法识别日期时保留为空，不猜测发布日期。

`product.json`、`sources.json` 和 `updates.json` 是内容维护的权威文件。首版生成脚本已移除，避免维护时意外覆盖已修订说明与抓取历史。`tracking.json` 由采集器更新；编辑手册不要重置其哈希和成功时间。
