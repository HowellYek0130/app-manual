# Claude 界面与控件清单

清单日期：2026-10-12（Asia/Kuala_Lumpur）。这是官方文档支持的教学模拟覆盖清单，不是登录最新版账号后逐页采集的完整界面。新增或删改页面后，应同步更新此快照；运行时以 product.json 为准。

42 个页面 / 171 个控件 / 5 条引导。documented: 168；needs-review: 3；ui-verified: 0。

| 页面 ID | 页面名称 | 上级页面 | 控件 |
| --- | --- | --- | --- |
| home | What can I help you with? | 首页入口 | New chat (claude-home-new)<br>Recents (claude-home-recents)<br>Projects (claude-home-projects)<br>Artifacts (claude-home-artifacts)<br>Customize (claude-home-customize)<br>Scheduled (claude-home-scheduled)<br>Code (claude-home-code)<br>Settings (claude-home-profile)<br>+ (claude-home-plus)<br>Model (claude-home-model) |
| recents | Recents | home | 访谈主题整理 (claude-recents-conversation)<br>产品简报 · 已完成 (claude-recents-task)<br>Search (claude-recents-search) |
| conversation | 访谈主题整理 | home | Model (claude-conversation-model)<br>+ (claude-conversation-plus)<br>Send (claude-conversation-send)<br>Thinking (claude-conversation-thinking)<br>Output (claude-conversation-output)<br>Manual / Auto (claude-conversation-manual)<br>交付文件与任务进度 (claude-conversation-task)<br>Add to project (claude-conversation-move) |
| model-picker | Model menu | conversation | Claude Sonnet 5.5 (claude-model-picker-sonnet)<br>Claude Opus 5.5 (claude-model-picker-opus)<br>More models (claude-model-picker-more)<br>Effort (claude-model-picker-effort) |
| effort-menu | Effort & Thinking | model-picker | Low / Medium (claude-effort-menu-low)<br>High (claude-effort-menu-high)<br>Extra high / Max (claude-effort-menu-xhigh)<br>Thinking / Extended (claude-effort-menu-thinking) |
| composer-menu | Add context & tools | conversation | Add files or photos (claude-composer-menu-upload)<br>Research (claude-composer-menu-research)<br>Connectors (claude-composer-menu-connectors)<br>Memory (claude-composer-menu-memory)<br>Output (claude-composer-menu-output)<br>Incognito（幽灵图标） (claude-composer-menu-incognito) |
| projects | Projects | home | + New Project (claude-projects-create)<br>产品研究 (claude-projects-open)<br>Archive（项目菜单） (claude-projects-archive) |
| project-create | Create project | projects | Project name & description (claude-project-create-name)<br>Create (claude-project-create-create)<br>Cancel (claude-project-create-cancel) |
| project | 产品研究 | projects | Files / Project knowledge (claude-project-knowledge)<br>Set project instructions (claude-project-instructions)<br>New chat in project (claude-project-chat)<br>Memory (claude-project-memory)<br>Scheduled tasks (claude-project-scheduled)<br>Star (claude-project-star) |
| project-knowledge | Project files & knowledge | project | + Add content (claude-project-knowledge-add)<br>interview-notes.pdf (claude-project-knowledge-open)<br>Remove file (claude-project-knowledge-remove) |
| project-instructions | Set project instructions | project | Instructions (claude-project-instructions-edit)<br>Save instructions (claude-project-instructions-save) |
| artifacts | Artifacts | home | Docs (claude-artifacts-docs)<br>Slides (claude-artifacts-slides)<br>Design (claude-artifacts-design)<br>Dashboards (beta) (claude-artifacts-dashboard)<br>产品研究简报 (claude-artifacts-open) |
| artifact-doc | 产品研究简报 · Claude Docs | artifacts | Edit with Claude (claude-artifact-doc-edit)<br>Formatting toolbar (claude-artifact-doc-format)<br>Add a comment (claude-artifact-doc-comment)<br>Share (claude-artifact-doc-share)<br>Export (claude-artifact-doc-export) |
| artifact-share | Share artifact | artifact-doc | Only you (claude-artifact-share-private)<br>Anyone with the link (claude-artifact-share-link)<br>Latest / specific version (claude-artifact-share-version)<br>Copy link (claude-artifact-share-copy) |
| artifact-export | Export doc | artifact-doc | Word (.docx) (claude-artifact-export-word)<br>PDF (.pdf) (claude-artifact-export-pdf)<br>Markdown (.md) (claude-artifact-export-markdown)<br>Google Docs (claude-artifact-export-google) |
| artifact-slides | Claude Slides | artifacts | Edit slide (claude-artifact-slides-edit)<br>Present (claude-artifact-slides-present)<br>Export (claude-artifact-slides-export)<br>Share (claude-artifact-slides-share) |
| artifact-design | Claude Design | artifacts | Properties (claude-artifact-design-properties)<br>Design system / /design-sync (claude-artifact-design-system)<br>Export / Handoff to Claude Code (claude-artifact-design-export) |
| connectors | Customize · Connectors | home | Skills (claude-connectors-skills)<br>Plugins (claude-connectors-plugins)<br>+ Browse connectors (claude-connectors-browse)<br>Add custom connector (claude-connectors-custom) |
| connector-detail | Connector details & tool access | connectors | Connect (claude-connector-detail-connect)<br>Enable for this conversation (claude-connector-detail-toggle)<br>Tool access · Auto / Always available / On demand (claude-connector-detail-tool)<br>Disconnect (claude-connector-detail-disconnect) |
| connector-auth | Connect · Authorization | connector-detail | Review requested permissions (claude-connector-auth-review)<br>Authorize / Allow（由服务决定） (claude-connector-auth-allow)<br>Cancel (claude-connector-auth-cancel) |
| skills | Customize · Skills | connectors | Connectors (claude-skills-connectors)<br>+ > Browse skills (claude-skills-browse)<br>Enable skill (claude-skills-enable)<br>+ Create skill (claude-skills-create) |
| skill-create | Create skill | skills | Upload a skill (claude-skill-create-upload)<br>Upload (claude-skill-create-add)<br>Cancel (claude-skill-create-cancel) |
| plugins | Customize · Plugins | connectors | Discover (claude-plugins-discover)<br>Add > Add marketplace (claude-plugins-marketplace)<br>Enable plugin (claude-plugins-enable) |
| plugin-detail | Plugin details | plugins | Add (claude-plugin-detail-add)<br>Connectors (claude-plugin-detail-connectors)<br>Remove (claude-plugin-detail-remove) |
| settings-general | Settings · General | home | Instructions for Claude (claude-settings-general-instructions)<br>Appearance (claude-settings-general-appearance)<br>Privacy (claude-settings-general-privacy)<br>Memory (claude-settings-general-memory)<br>Capabilities (claude-settings-general-capabilities)<br>Usage (claude-settings-general-usage)<br>Extensions (claude-settings-general-extensions)<br>This computer / Desktop app (claude-settings-general-desktop) |
| settings-appearance | Settings · Appearance | settings-general | Color mode · Light (claude-settings-appearance-light)<br>Color mode · Match System / Dark (claude-settings-appearance-system)<br>Chat font (claude-settings-appearance-font) |
| settings-privacy | Settings · Privacy | settings-general | Help improve our AI models (claude-settings-privacy-training)<br>Export data (claude-settings-privacy-export) |
| settings-memory | Settings · Memory | settings-general | Generate memory from chats (claude-settings-memory-toggle)<br>Topics · Edit / Delete (claude-settings-memory-topics)<br>Include sensitive topics in memory (claude-settings-memory-sensitive)<br>Pause memory / Reset memory (claude-settings-memory-pause)<br>Import / Export memory (claude-settings-memory-transfer) |
| settings-capabilities | Settings · Capabilities | settings-general | Cloud code execution and file creation (claude-settings-capabilities-code)<br>Allow network egress (claude-settings-capabilities-egress)<br>Manage connectors (claude-settings-capabilities-tools) |
| settings-usage | Settings · Usage | settings-general | Current usage (claude-settings-usage-view)<br>Adjust effort (claude-settings-usage-effort)<br>Usage credits（如账号提供） (claude-settings-usage-credits) |
| settings-extensions | Settings · Extensions | settings-general | Browse extensions (claude-settings-extensions-browse)<br>Install (claude-settings-extensions-install)<br>Advanced settings > Install Extension… (claude-settings-extensions-advanced)<br>Developer · MCP status / logs (claude-settings-extensions-logs) |
| settings-desktop | This computer · System | settings-general | Enable computer use (claude-settings-desktop-computer)<br>Denied apps (claude-settings-desktop-denied)<br>Preferred browser (claude-settings-desktop-browser)<br>Storage folder / Trusted folders (claude-settings-desktop-storage) |
| scheduled | Scheduled | home | New task (claude-scheduled-new)<br>每日产品动态 (claude-scheduled-open)<br>Upcoming / past runs (claude-scheduled-history) |
| schedule-form | Schedule task | scheduled | Task name & instructions (claude-schedule-form-instructions)<br>Schedule / cadence (claude-schedule-form-cadence)<br>Schedule (claude-schedule-form-confirm) |
| task-detail | 每日产品动态 · Task details | scheduled | Edit instructions / cadence (claude-task-detail-edit)<br>Pause / Resume (claude-task-detail-pause)<br>Run now (claude-task-detail-run)<br>Delete task (claude-task-detail-delete) |
| task-running | 产品简报 · Working | conversation | Stop (claude-task-running-stop)<br>Send follow-up (claude-task-running-redirect)<br>Files · 产品研究简报 (claude-task-running-files)<br>App access request (claude-task-running-computer)<br>Built-in browser · side panel (claude-task-browser) |
| computer-permission | App access request | task-running | Control level (claude-computer-permission-review)<br>Allow for this session (claude-computer-permission-allow)<br>Deny (claude-computer-permission-deny) |
| browser-permission | Browser · Site permission | code-session | Allow once (claude-browser-permission-once)<br>Always allow (claude-browser-permission-always)<br>Deny (claude-browser-permission-deny) |
| code-start | Code · Start a session | home | Environment · Local / Cloud / WSL (claude-code-start-environment)<br>Project folder (claude-code-start-folder)<br>Permission mode · Plan (claude-code-start-plan)<br>Start session (claude-code-start-start) |
| code-session | Code · 产品研究网站 | code-start | Diff · +12 −1 (claude-code-session-diff)<br>Comment on diff (claude-code-session-comment)<br>Browser (claude-code-session-browser)<br>Terminal (claude-code-session-terminal)<br>Manual / Accept edits / Auto (claude-code-session-mode)<br>Stop (claude-code-session-stop) |
| built-in-browser | Built-in browser | settings-desktop | Preferred browser (claude-browser-preference)<br>Import cookies (claude-browser-import)<br>Sign in · 网站自己的界面 (claude-browser-signin)<br>Site access · permission request (claude-browser-access) |
| browser-import | Import cookies · Windows | built-in-browser | Firefox (claude-browser-import-firefox)<br>Select sites · 教学站点选择 (claude-browser-import-sites)<br>Import · 教学确认 (claude-browser-import-confirm) |

## 实际界面核验待办

- 使用同一 Windows build 与个人套餐账号，逐页对照当前清单，记录按钮名、进入路径、账号 rollout 差异及截图出处。
- 目前所有模拟布局均未经账号实测；位置尚不确定的控件保留 needs-review，不能因为说明书能点击就升级为 ui-verified。
- 系统文件选择器、第三方 OAuth 页面及未获账号权限的功能不属于已核验覆盖；获得界面证据后再补入对应产品文件夹。
- 新官方来源变化通过 tracking.json 标记相关控件待核验；核验时直接维护 JSON，保留来源哈希和抓取历史。
