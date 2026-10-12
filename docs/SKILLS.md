# 项目技能来源

本项目使用 Microsoft 官方 `playwright-cli` 技能进行浏览器验证；不是第三方重新打包的技能。

- 下载日期：2026-10-12，Asia/Kuala_Lumpur。
- 仓库：[microsoft/playwright](https://github.com/microsoft/playwright)。
- 路径：`packages/playwright-core/src/tools/skills/playwright-cli/`，保留完整 `references/`。
- 本地位置：`.agents/skills/playwright-cli/`。
- 核验 `SKILL.md` 的 Git blob SHA-1：`4e29c62517a04803e45876eb5c16fa658ff78433`，与官方 GitHub contents API 一致。
- 许可证：Apache-2.0，许可证文本随技能保存。
- 本项目锁定运行包：`@playwright/cli 0.1.22` 与 `@playwright/test 1.64.0`。

执行时以项目依赖和已支持的命令为准：不采用技能中的全局安装回退，不使用 kill-all，不修改沙盒，不操作个人浏览器或上传 PR 附件。PowerShell 下使用 `npx.cmd` / `npm.cmd`；Windows 浏览器缓存放入项目 `.cache/ms-playwright/`。测试流程参考技能的 `references/playwright-tests.md`，并由 `playwright.config.ts` 固定测试范围与项目自有浏览器。
