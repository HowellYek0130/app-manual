# ChatGPT 界面与控件清单

清单日期：2026-10-12（Asia/Kuala_Lumpur）。这是官方文档支持的教学模拟覆盖清单，不是登录最新版账号后逐页采集的完整界面。新增或删改页面后，应同步更新此快照；运行时以 product.json 为准。

60 个页面 / 207 个控件 / 5 条引导。documented: 195；needs-review: 12；ui-verified: 0。

| 页面 ID | 页面名称 | 上级页面 | 控件 |
| --- | --- | --- | --- |
| home | ChatGPT · 首页 | 首页入口 | ChatGPT ▾ (chatgpt-home-switcher)<br>New chat (chatgpt-home-new)<br>Work (chatgpt-home-work)<br>Recents (chatgpt-home-recents)<br>Projects (chatgpt-home-projects)<br>Plugins (chatgpt-home-plugins)<br>Settings (chatgpt-home-settings)<br>App menu (chatgpt-home-app-menu)<br>New temporary chat (chatgpt-home-temporary) |
| switcher | 选择工作视图 | home | ChatGPT · Chat (chatgpt-switch-chat)<br>ChatGPT · Work (chatgpt-switch-work)<br>Codex (chatgpt-switch-codex) |
| recents | Recents · 聊天历史 | home | Search chats (chatgpt-recents-search)<br>旅行规划 · Chat (chatgpt-recents-chat)<br>市场研究 · Work (chatgpt-recents-work)<br>Filter / Sort (chatgpt-recents-filter) |
| chat | Chat · 对话 | home | Model / Reasoning (chatgpt-chat-model)<br>+ Add context (chatgpt-chat-attach)<br>Send (chatgpt-chat-send)<br>Start voice chat (chatgpt-chat-voice)<br>Plugins / Tools (chatgpt-chat-tools)<br>Chat menu · ⋯ (chatgpt-chat-menu) |
| chat-menu | Chat menu · 管理聊天 | chat | Rename chat (chatgpt-chat-rename)<br>Pin chat (chatgpt-chat-pin)<br>Move to project (chatgpt-chat-move)<br>Archive chat (chatgpt-chat-archive)<br>Pop out chat (chatgpt-chat-popout) |
| chat-models | Chat · 模型选择 | chat | GPT-6 Sol (chatgpt-chat-model-sol)<br>Instant (chatgpt-chat-model-instant)<br>Higher reasoning (chatgpt-chat-model-high) |
| attachments | + · 添加上下文 | chat | Add files (chatgpt-attach-file)<br>Add image (chatgpt-attach-image)<br>Add audio (chatgpt-attach-audio)<br>Appshots · 双 Alt (chatgpt-attach-appshot) |
| tools | Tools · 常用工作流 | chat | Web search (chatgpt-tool-search)<br>Deep research (chatgpt-tool-research)<br>Image generation (chatgpt-tool-image)<br>Computer Use (chatgpt-tool-computer) |
| temporary | Temporary chat · 临时对话 | home | Personalized (chatgpt-temporary-personalized)<br>Unpersonalized (chatgpt-temporary-unpersonalized)<br>Save chat (chatgpt-temporary-save) |
| voice | Voice · 语音对话 | chat | Start voice chat (chatgpt-voice-start)<br>Stop voice chat (chatgpt-voice-stop)<br>Voice settings / Hotkey (chatgpt-voice-settings) |
| projects | Projects · 项目列表 | home | New project (chatgpt-projects-create)<br>软件学习 · ChatGPT project (chatgpt-projects-open)<br>Add local project (chatgpt-projects-local) |
| project-create | New project · 新建项目 | projects | Project name (chatgpt-project-create-name)<br>Create project (chatgpt-project-create-submit) |
| project | 软件学习 · 项目 | projects | New chat · Chat (chatgpt-project-chat)<br>New chat · Work (chatgpt-project-work)<br>Sources (chatgpt-project-sources)<br>Project instructions (chatgpt-project-instructions)<br>Project menu · ⋯ (chatgpt-project-menu) |
| project-sources | Sources · 项目资料 | project | Add source (chatgpt-source-upload)<br>Open · product-requirements.pdf (chatgpt-source-open)<br>Remove source (chatgpt-source-remove) |
| project-instructions | Project instructions · 项目指令 | project | Edit instructions (chatgpt-instructions-edit)<br>Save instructions (chatgpt-instructions-save) |
| project-menu | Project menu · 管理项目 | project | Pin project (chatgpt-project-pin)<br>Rename project (chatgpt-project-rename)<br>Archive chats (chatgpt-project-archive-chats) |
| settings | Settings · 设置目录 | home | General (chatgpt-settings-general)<br>Profile (chatgpt-settings-profile)<br>Keyboard Shortcuts (chatgpt-settings-shortcuts)<br>Notifications (chatgpt-settings-notification-settings)<br>Appearance (chatgpt-settings-appearance)<br>Personalization (chatgpt-settings-personalization)<br>Data controls · 账号 (chatgpt-settings-data-controls)<br>Archived chats (chatgpt-settings-archived)<br>Browser (chatgpt-settings-browser-settings)<br>Computer Use (chatgpt-settings-computer-use)<br>Connections (chatgpt-settings-connections)<br>Pets (chatgpt-settings-pets)<br>Git (chatgpt-settings-git)<br>Integrations / MCP (chatgpt-settings-mcp) |
| general | General · 常规 | settings | Enter sends prompts (chatgpt-general-enter)<br>Follow-up behavior (chatgpt-general-followup)<br>In-app updates (chatgpt-general-updates) |
| profile | Profile · 个人资料 | settings | Edit profile (chatgpt-profile-details)<br>Activity insights (chatgpt-profile-activity) |
| shortcuts | Keyboard Shortcuts · 快捷键 | settings | Search command / Keystroke (chatgpt-shortcuts-search)<br>Change binding (chatgpt-shortcuts-bind)<br>Reset shortcuts (chatgpt-shortcuts-reset) |
| notification-settings | Notifications · 通知 | settings | Turn completion (chatgpt-notifications-turn)<br>Permissions and questions (chatgpt-notifications-attention)<br>Activity · 🔔 (chatgpt-notifications-activity) |
| activity | Activity · 任务状态 | home | Needs input · 市场研究 (chatgpt-activity-work)<br>Mark all as read (chatgpt-activity-read) |
| appearance | Appearance · 外观 | settings | Theme · Light / Dark / System (chatgpt-appearance-theme)<br>UI font / Code font (chatgpt-appearance-font) |
| personalization | Personalization · 个性化 | settings | Personal instructions · AGENTS.md (chatgpt-personal-instructions)<br>ChatGPT Memory (chatgpt-personal-chat-memory)<br>Enable Codex memories (chatgpt-personal-codex-memory) |
| chat-memory | Memory · ChatGPT 账号 | personalization | Memory settings (chatgpt-chat-memory-enable)<br>Memory Sources (chatgpt-chat-memory-sources)<br>Delete memory (chatgpt-chat-memory-delete) |
| codex-memory | Memories · 本地 Codex | personalization | Enable Codex memories (chatgpt-codex-memory-enable)<br>/memories (chatgpt-codex-memory-chat)<br>Delete Codex memories (chatgpt-codex-memory-delete) |
| data-controls | Data controls · 账号隐私 | settings | Improve the model for everyone (chatgpt-data-training)<br>Export data (chatgpt-data-export)<br>Temporary chat (chatgpt-data-temporary) |
| archived | Archived chats · 已归档 | settings | 旧版界面学习 (chatgpt-archived-open)<br>Unarchive (chatgpt-archived-restore) |
| browser-settings | Browser · 浏览器设置 | settings | Built-in browser (chatgpt-browser-settings-open)<br>Agent permissions (chatgpt-browser-settings-permissions)<br>Downloads location (chatgpt-browser-settings-downloads)<br>Browsing history / Clear browsing data (chatgpt-browser-history) |
| browser-permissions | Agent permissions · 网站权限 | browser-settings | Browse (chatgpt-browser-perm-browse)<br>Download / Upload (chatgpt-browser-perm-transfer)<br>Remove site exception (chatgpt-browser-perm-reset) |
| connections | Connections · 远程连接 | settings | Control this PC · Set up / Add (chatgpt-connections-setup)<br>Manage connected devices (chatgpt-connections-devices)<br>SSH (chatgpt-connections-ssh) |
| plugins | Plugins · 插件目录 | home | Deep research (chatgpt-plugins-research)<br>Skills (chatgpt-plugins-skills)<br>Computer Use (chatgpt-plugins-computer) |
| plugin-detail | Deep research · 插件详情 | plugins | Install plugin / Enable (chatgpt-plugin-install)<br>Connect account (chatgpt-plugin-connect)<br>Try now (chatgpt-plugin-try)<br>Uninstall plugin (chatgpt-plugin-uninstall) |
| skills | Skills · 可复用技能 | plugins | @skill / $skill (chatgpt-skills-select)<br>skill-creator (chatgpt-skills-create) |
| computer-use | Computer Use · 电脑访问 | settings | Install plugin / Enable (chatgpt-computer-install)<br>Always-allowed apps (chatgpt-computer-apps)<br>Google Chrome / Edge · Manage (chatgpt-computer-browser) |
| browser-extension | Browser extension · 现有浏览器 | computer-use | Install extension (chatgpt-extension-install)<br>@Edge / @Chrome / tab (chatgpt-extension-mention)<br>Manage allowed / blocked websites (chatgpt-extension-sites) |
| work | Work · 任务工作台 | home | Work in (chatgpt-work-environment)<br>Model / Reasoning (chatgpt-work-model)<br>+ Files / Plugins (chatgpt-work-context)<br>Start work (chatgpt-work-send)<br>report.pdf · Open (chatgpt-work-artifact)<br>Scheduled (chatgpt-work-scheduled) |
| work-environment | Work in · 执行位置 | work | This computer (chatgpt-environment-local)<br>Cloud (chatgpt-environment-cloud) |
| work-models | Work / Codex · 模型与思考 | work | GPT-6.1 Sol (chatgpt-work-model-sol)<br>GPT-6 Luna (chatgpt-work-model-luna)<br>Reasoning effort / Power (chatgpt-work-model-effort)<br>Advanced (chatgpt-model-advanced) |
| artifact | report.pdf · 文件预览 | work | Open preview (chatgpt-artifact-open)<br>Comment / Annotate (chatgpt-artifact-comment)<br>Download (chatgpt-artifact-download) |
| browser | Browser · 内置网页预览 | work | New tab / Ctrl+T (chatgpt-browser-new-tab)<br>Comment (chatgpt-browser-comment)<br>@Browser (chatgpt-browser-ask) |
| scheduled | Scheduled · 定时任务 | work | New scheduled task (chatgpt-scheduled-create)<br>Recent runs (chatgpt-scheduled-runs)<br>Pause / Resume (chatgpt-scheduled-pause) |
| schedule-editor | Scheduled task · 编辑 | scheduled | Task prompt / Context (chatgpt-schedule-prompt)<br>Schedule / Time zone (chatgpt-schedule-time)<br>Save task (chatgpt-schedule-save) |
| codex | Codex · 开发视图 | switcher | Add project / Open folder (chatgpt-codex-project)<br>New chat (chatgpt-codex-new)<br>Model / Reasoning (chatgpt-codex-model)<br>Worktree (chatgpt-codex-worktree)<br>Permissions (chatgpt-codex-permissions)<br>Review (chatgpt-codex-review)<br>New tab · Terminal (chatgpt-codex-terminal) |
| codex-project | Local project · app-manual | codex | Open folder / Ctrl+O (chatgpt-codex-project-folder)<br>Add folders (chatgpt-codex-project-add)<br>New project chat (chatgpt-codex-project-chat) |
| codex-worktree | Worktree · 隔离开发 | codex | Start in Worktree (chatgpt-worktree-create)<br>Handoff (chatgpt-worktree-handoff)<br>Review worktree changes (chatgpt-worktree-review) |
| permissions | Permissions · 执行边界 | codex | Ask for approval (chatgpt-permission-ask)<br>Approve for me (chatgpt-permission-auto)<br>Review an approval request (chatgpt-permission-request) |
| approval | Approval · 读取公开网站 | permissions | Allow once (chatgpt-approval-once)<br>Decline (chatgpt-approval-decline) |
| review | Review · 代码审查 | codex | Summary (chatgpt-review-summary)<br>Changes (chatgpt-review-changes)<br>Checks (chatgpt-review-checks) |
| review-diff | Changes · product.json | review | Changed files · product.json (chatgpt-diff-file)<br>Mark as viewed (chatgpt-diff-viewed)<br>Comment / Ask about selection (chatgpt-diff-comment) |
| terminal | Terminal · PowerShell | codex | Terminal / Ctrl+` (chatgpt-terminal-open)<br>Integrated terminal shell (chatgpt-terminal-shell) |
| desktop-menu | App menu · 桌面功能 | home | Settings / Ctrl+, (chatgpt-desktop-settings)<br>Check for Updates (chatgpt-desktop-check-updates)<br>Appshots (chatgpt-desktop-appshot)<br>Show pet (chatgpt-desktop-pet) |
| desktop-updates | Updates · 版本与迁移 | desktop-menu | Check for Updates (chatgpt-updates-check)<br>ChatGPT vs ChatGPT Classic (chatgpt-updates-classic) |
| appshots | Appshots · 当前窗口 | attachments | Both Alt keys (chatgpt-appshots-capture)<br>Appshot destination (chatgpt-appshots-destination) |
| pets | Pets · 浮动控制 | settings | Mini / Choose pet (chatgpt-pets-mini)<br>Show pet · Windows+Alt+P (chatgpt-pets-show)<br>Activity · bell (chatgpt-pets-activity) |
| git-settings | Git · 开发设置 | settings | Review delivery · Inline / Detached (chatgpt-git-review-delivery)<br>Branch naming (chatgpt-git-branch-naming)<br>Force pushes (chatgpt-git-force-push)<br>Commit / pull request prompts (chatgpt-git-message-prompts) |
| mcp-settings | Integrations · MCP | settings | Recommended servers (chatgpt-mcp-recommended)<br>Add MCP server (chatgpt-mcp-add)<br>Authenticate · OAuth (chatgpt-mcp-oauth)<br>config.toml (chatgpt-mcp-config) |
| browser-history | Browser · History & data | browser-settings | Search history (chatgpt-history-search)<br>Open visited page (chatgpt-history-reopen)<br>Clear browsing data (chatgpt-history-clear) |
| popout-chat | Chat · 独立窗口 | chat-menu | Always on top (chatgpt-popout-top)<br>Return to chat · 教学导航 (chatgpt-popout-return) |
| work-advanced | Model · Advanced | work-models | Model (chatgpt-advanced-model)<br>Reasoning effort (chatgpt-advanced-effort)<br>Speed · Standard / Fast (chatgpt-advanced-speed) |

## 实际界面核验待办

- 使用同一 Windows build 与个人套餐账号，逐页对照当前清单，记录按钮名、进入路径、账号 rollout 差异及截图出处。
- 目前所有模拟布局均未经账号实测；位置尚不确定的控件保留 needs-review，不能因为说明书能点击就升级为 ui-verified。
- 系统文件选择器、第三方 OAuth 页面及未获账号权限的功能不属于已核验覆盖；获得界面证据后再补入对应产品文件夹。
- 新官方来源变化通过 tracking.json 标记相关控件待核验；核验时直接维护 JSON，保留来源哈希和抓取历史。
