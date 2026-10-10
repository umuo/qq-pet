# 参考项目资源

来源：AnkioTomas/qqpet，固定提交 `6e2c8bf976d66192382f86065fdeb76528f6716c`。`manifest.json` 记录已经下载且通过原 Git LFS 大小和 SHA-256 校验的文件。

- QQ 宠物原版 SWF、美术素材版权归腾讯所有。
- `album/*.webp` 旅行照片素材版权归《旅行青蛙·中国之旅》所有。
- 参考项目代码按 GPL-3.0 发布，原许可证保存在 `LICENSE.reference-code.txt`。配置表和接口移植在相关源文件中保留了来源记录。

恢复资源：`node scripts/import-reference-assets.cjs core|album|hd|all`。脚本从固定提交下载，跳过已验证的文件，支持中断后重试，不修改参考工作区。`QQPET_IMPORT_CONCURRENCY` 可设置下载并发数（1～16）。

资源存在不等于已完成玩法接入；集成状态和运行验证见 `docs/reference-project-review.md` / `docs/migration-progress.md`。

高清界面通过 `windows/util/hdImages.js` 与现有资源配对，先核验 PNG/GIF 原图尺寸和高清 PNG 的两倍尺寸，再用 CSS image-set 或图片 srcset 提供 2x 图，保持布局大小。当前 710 个配对可用；无对应原图或尺寸不同的文件不会自动替换。设置中的高清开关默认开启，重开窗口或重启后生效。它改善界面位图，不改变企鹅 SWF 的分辨率。
