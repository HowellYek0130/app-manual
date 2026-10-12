# App Manual · 软件操作说明书

[打开在线说明书](https://howellyek0130.github.io/app-manual/) · [GitHub 项目](https://github.com/HowellYek0130/app-manual)

可点击、能进入下层页面的 Windows App 教学界面，以及持续追踪官方功能更新的静态网站。第一版针对 ChatGPT Plus、Claude Pro，以最新版为主，保留旧版入口对照。中文解释保留原产品按钮名称，方便对照。

## 使用

打开产品手册，点击模拟按钮进入菜单、设置、弹窗或子页面，右侧显示用途、步骤、结果、适用条件、排错及官方来源。也可以使用功能搜索（Ctrl K）、分步引导、新闻关联入口和完整界面清单。

已探索操作和新闻已读状态保存在浏览器本地。演示消息、文件、授权和设置只影响模拟界面，不调用 OpenAI、Anthropic 或付费模型 API。真实账号功能可能因版本、套餐和逐步开放不同。

每个操作区分“官方文档支持”“实际界面已核验”“待核验”。初版为官方资料整理的教学重建，**尚未实测真实 Windows / Plus / Pro 账户，不能视为全部实时按钮的精确复刻**。界面清单列出了已纳入的页面和控件，后续可以继续补充实际账号证据。

## 本地运行

需要 Node.js 24 和 npm。在 PowerShell 中建议使用 `npm.cmd` / `npx.cmd`，避免更改系统执行策略。

```powershell
npm.cmd ci
npm.cmd run dev
```

打开终端显示的本地地址。构建和验证：

```powershell
npm.cmd run validate
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

浏览器验收使用项目内 Playwright。Windows 的浏览器安装到项目缓存，Linux CI 使用 Playwright 默认缓存。

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.cache\ms-playwright'
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

浏览器测试覆盖子页面、引导、搜索、前进后退、刷新、已读保存、模拟交互及手机布局。测试痕迹和预览截图在被 Git 忽略的 `test-results/`、`output/qa/` 中。

## 自动跟踪与发布

GitHub Actions 默认每天马来西亚时间 **09:17、21:17** 抓取官方来源，并在同一次工作流中验证、保存数据、构建和部署 GitHub Pages。也支持 Actions 页面手动运行。

首次成功检查建立来源基线，后续新条目或正文变化进入更新列表并标记可能受影响的手册操作。源站不可访问时保留原有内容和最后成功时间，网页显示失败来源；不会将空页面当作功能删除。检测脚本不使用 AI：自动记录原标题、日期、链接及变化类型；中文解读由你在 Codex 发起维护后补充。

```powershell
npm.cmd run track -- --dry-run
npm.cmd run track -- --product chatgpt
```

详细解析、核验和失败处理见 [跟踪说明](docs/TRACKING.md)。在网站的“待核验”栏目可以复制适合当前产品的 Codex 更新指令。

首次发布：

1. 用 `gh auth login --hostname github.com --git-protocol https --web` 登录你的 GitHub 账户。
2. 初始化 `main` 分支，创建公开仓库 `app-manual`，推送本项目。
3. 在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
4. 手动运行 **Track and publish App Manual**，检查来源状态与部署结果。

无需 PAT 或模型 API 密钥。当前项目不包含账号凭证。官方帮助站可能拒绝自动请求（例如 HTTP 403），这类来源会明确显示失败；待源站恢复或调整官方可访问来源后重新检查。

## 新增产品

所有产品由文件夹自动发现。以后新增 Vercel、Supabase 时，将该产品资料、配置、界面和适配器全部放入 `products/<id>/`，无需修改公共入口或维护中央注册表。

| 文件 | 内容 |
| --- | --- |
| `product.json` | 产品信息、页面、按钮、说明、导航、引导和新旧差异 |
| `sources.json` | 官方来源、解析类型、可选内容选择器和关键词 |
| `updates.json` | 已收录新闻、原始日期、中文解读状态和关联控件 |
| `tracking.json` | 来源哈希、检查时间、失败状态和待核验控件 |
| `collector.mjs` | 该产品采集适配器；通常复用公共解析器 |
| `evidence/` | 界面版本与证据记录、后续核验图片等 |

字段契约见 [类型定义](src/types.ts)。产品 ID 与文件夹名一致，页面和按钮 ID 在产品内唯一；所有导航、父页面、引导步骤及来源引用必须存在。所有按钮都要填写用途、步骤、结果、条件、排错、来源、证据状态和核验日期。

默认适配器：

```js
export { parseSource } from '../../scripts/tracking-core.mjs';
```

新增产品后执行验证、测试和构建。自定义适配器必须返回哈希及条目元数据；来源正文只在内存用于解析，不公开复制整篇文章。

## 项目技能与参考

已下载官方 Microsoft `playwright-cli` 技能至 `.agents/skills/playwright-cli/`，可被后续项目聊天发现。依赖锁定在 `package-lock.json`，不需要全局安装浏览器 CLI。

- [Driver.js](https://github.com/nilbuild/driver.js)：按钮高亮与分步引导，MIT。
- [Microsoft Playwright](https://github.com/microsoft/playwright)：浏览器验收及技能，Apache-2.0。
- [changedetection.io](https://github.com/dgtlmoon/changedetection.io)：参考网页变化检测思路。
- [Flat Data](https://github.com/githubocto/flat)：参考 Actions 抓取、比较、持久化思路，未作为依赖。

软件品牌与官方来源链接用于帮助读者对照。本站是独立教学项目，模拟界面中的演示账户和内容均为虚构。
