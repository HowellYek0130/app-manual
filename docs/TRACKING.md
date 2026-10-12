# 官方更新追踪与手册核验

## 自动检查

`.github/workflows/manual.yml` 在马来西亚时间每天 09:17、21:17 运行；也可在 GitHub 的 **Actions → Track and publish App Manual → Run workflow** 手动运行，填入 `chatgpt`、`claude` 或留空检查全部产品。`push main` 验证并部署现有数据，不重复抓取。GitHub 的定时任务可能延迟；公开仓库连续 60 天没有活动时，GitHub 可能禁用定时工作流，需要重新启用。

本地运行：

```sh
npm run track -- --dry-run
npm run track -- --product chatgpt
npm run validate
npm test
npm run build
```

`--dry-run` 获取并分析真实来源，输出拟生成结果，**不修改**任何产品文件。每个请求限时 25 秒，最多尝试 3 次，允许最多 5 个公开 HTTPS 重定向，响应上限 8 MiB；每个产品最多同时请求 4 个来源。所有来源失败也会生成失败状态，让网站显示实际检查情况；输入或输出结构错误则阻止写入和部署。

## 数据与解析

每个 `products/<id>/` 包含 `product.json`、`sources.json`、`updates.json`、`tracking.json`、`collector.mjs`，无需中央注册表。ID 必须是小写字母、数字、点、连字符或下划线开头的稳定名称（首字符必须字母或数字）。`collector.mjs` 通常只需：

```js
export { parseSource } from '../../scripts/tracking-core.mjs';
```

来源配置支持 `release-notes`（英文完整日期或 ISO 日期标题，兼容 OpenAI 的 h1 日期、Claude 月份下的 h3 日期，以及 ChatGPT Learn 的 time 日期卡片）、`article`（主要文章）、`rss`（RSS/Atom）和 `announcements`（主要内容中的新闻卡片链接）。月份索引不参与日期条目哈希，普通隐私／帮助链接不作为公告。Learn 卡片使用页面的稳定 anchor ID，保证同一天多条发布分别追踪，标题修改也能识别为编辑。可用 `selector` 指定稳定内容区域；`keywords` 可过滤 RSS/公告，例如只保留含 Claude 的产品公告。页面没有合理内容、日期段落为空、HTML 被验证码拦截、XML 无效或条目数量突然异常缩小时，都将报错并保留上次有效快照；不会据此宣布功能删除。来源栏目已改版时，应先更新解析器或选择器。

正文在内存里规范化、用于匹配和计算 SHA-256；不公开保存原文整篇文章。提交的数据只有标题、来源链接、日期、摘要状态、哈希和检查元数据。导航、脚本、页脚、反馈按钮等被排除，避免无关页面变化产生新闻。每个日期段、文章 URL 或 Feed GUID 形成稳定条目 ID；更新 ID 还包含正文版本哈希，同一版本重复检查不重复发新闻，旧日期段被编辑会产生 `edited` 记录。

`publishedAt` 为来源的发布日期，未知为 `null`，不会用检测日期替代；`detectedAt` 为本次发现时间。每个来源的首次成功只建立哈希及历史条目基线，**不生成历史新闻、不新增待核验控件**，并保留人工整理的启动新闻；首次失败后的第一次成功同样执行基线规则。下一次检查发现的新条目或正文编辑才产生新闻，避免首次导入几十篇帮助文章及多年发布说明挤满更新列表。后续发生变化时，文章类来源标记所有引用该文章的控件；发布说明只标记引用该来源、且标签/`guide.keywords` 与变化内容匹配的控件。新增新闻无法匹配控件时仍进入待整理队列。机器匹配只说明可能受影响，不能确认按钮位置或使用方式。

`tracking.sources` 记录 `lastAttemptAt`、`lastSuccessAt`、`status`、`error` 和上次有效内容哈希/条目。抓取失败不覆盖哈希、旧新闻、核验队列或最后成功时间。写文件前执行完整引用与数据校验；先全部写入临时文件，再分别原子替换生成 JSON。遇到 Windows 文件监视器或杀毒软件造成的 `EPERM`、`EACCES`、`EBUSY`，原子替换最多尝试 6 次，等待 100–500 毫秒，总等待上限 1.5 秒；持续失败则保留原文件、清理临时文件并报错，不删除目标文件或改用非原子覆盖。中途进程被杀可能导致两份 JSON 的检查时间不同，再运行追踪即可恢复；GitHub 工作流不会提交未通过校验的数据。

## 修订手册

在 Codex 请求“更新 ChatGPT 手册”或“更新 Claude 手册”。核验步骤：

1. 阅读该产品 `updates.json` 中 `interpretation: pending` 的变更、`tracking.reviewControlIds`、来源错误，先处理失败的选择器或链接。
2. 根据官方文档及实际可访问的 Windows 个人版界面，核对页面、控件标签、路径、套餐条件和结果。文档支持写 `documented`；只有亲自核对过真实界面才写 `ui-verified`。无法确认时保留 `needs-review`。
3. 更新控件的用途、步骤、结果、条件、排错、来源、核验日期；如有操作路径变化，更新页面/动作并在 `differences` 写明确新旧差异。
4. 确认中文解读后填入新闻的 `summaryZh`，将其 `interpretation` 改为 `reviewed`，补齐 `controlIds`。只有完成对应控件核验，才从 `tracking.reviewControlIds` 移除该 ID。
5. 运行验证、测试、构建，并在浏览器检查新路径。保留历史新闻和发布日期。

新增产品应复制同样的文件结构，为该产品配置自己的官方来源和界面清单，保证每个按钮都有说明及来源；禁止把 ChatGPT/Claude 的推测界面照搬为实际核验结果。验证器检查所有导航、父页面、Tour、来源、更新及核验 ID 引用，并确认采集适配器可用。

## 发布权限

发布与 PR 两个工作流都先运行数据校验和单元测试，再安装 Chromium 并执行 `npm run test:e2e` 的浏览器验收，最后构建。浏览器验收失败会阻止生成数据提交和网站发布。

公开仓库创建后，在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。默认分支使用 `main`。工作流默认只有 `contents: read`；独立持久化 job 仅有 `contents: write`，只暂存 `products/*/tracking.json`、`products/*/updates.json`；发布 job 有 `contents: read`（核对最新提交）、`pages: write` 和 `id-token: write`。不需要 PAT 或付费模型 API。分支保护若禁止机器人直接提交，持久化 job 会失败，需为该仓库按团队规则安排提交权限。

抓取、校验、测试、构建、生成数据提交和 Pages 发布在同一次工作流中完成。机器人提交不会触发下一次部署；本次 run 直接发布自己的构建 artifact。提交前确认 `main` 仍是触发版本，防止覆盖人工更新；部署前再核对 `main` 与本次数据提交（或 push 的触发提交）一致。若主分支已前进则停止发布，下一次 push/run 使用新版本重做。PR 仅验证构建，不抓取、不提交、不发布，也不保留 Git 凭证或可供发布流程使用的缓存。

Actions 以官方发布的完整 commit SHA 固定，版本来源可在相应官方仓库 Release 核查：

- [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)、[setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)
- [upload-pages-artifact v4.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v4.0.0)、[deploy-pages v4.0.5](https://github.com/actions/deploy-pages/releases/tag/v4.0.5)
- [upload-artifact v4.6.2](https://github.com/actions/upload-artifact/releases/tag/v4.6.2)、[download-artifact v4.3.0](https://github.com/actions/download-artifact/releases/tag/v4.3.0)

定时语法及任务限制参考 [GitHub schedule 文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。
