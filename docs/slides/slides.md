---
theme: default
title: EchoQuest 回响 · 项目汇报
titleTemplate: '%s'
info: |
  ## 创新工程实践营 · 项目汇报
  EchoQuest 回响：把故事设定编译成可游玩互动叙事
class: text-slate-700
highlighter: shiki
lineNumbers: false
transition: slide-left
colorSchema: light
drawings:
  persist: false
---

<div class="cover">

<div class="kicker">创新工程实践营 · 项目汇报</div>

# EchoQuest 回响

<div class="text-xl opacity-80 mt-2">
把一段故事设定，编译成一场可以亲自走进去的互动叙事
</div>

<div class="mt-8 text-sm muted">
AI 互动叙事生成 Agent · v1.3
</div>
<div class="mt-1 text-xs muted">
在线演示 http://120.26.225.51 ｜ 仓库 github.com/De-xing/ai-text-adventure-game
</div>

</div>

<!--
开场：
"我们不做聊天机器人，我们做一条把故事设定编译成可玩互动叙事的流水线。"
-->

---

## 汇报路线

<div class="grid2 mt-6">
<div class="card"><b>第一部分 · 产品介绍（8 分钟）</b><br/>1 产品设计 → 2 设计原则 → 3 产品实现<br/><span class="muted">其中 3.5.3 智能体设计为重点，约 4 分钟</span></div>
<div class="card"><b>第二部分 · 作品演示（2 分钟）</b><br/>创作 → 生成 → 编辑 → 游玩</div>
<div class="card"><b>第三部分 · 评委问答（5 分钟）</b><br/>已准备核心问题与边界回答</div>
<div class="card"><b>附录（不讲）</b><br/>参考文献、能力边界</div>
</div>

---

## 一句话价值

# 让有故事想法但不会写代码的人，在几分钟内拿到一个能玩的分支故事

<div class="grid4 mt-8">
<div class="card"><b>6–16</b><br/>动态故事节点</div>
<div class="card"><b>2–3 次</b><br/>单篇模型调用</div>
<div class="card"><b>1 或 3</b><br/>可校验结局</div>
<div class="card"><b>10–2000 字</b><br/>输入门槛</div>
</div>

<div class="mt-6 small muted">
不是聊天记录，而是可编辑、可存档的<b>叙事资产</b>：故事图 + 角色属性 + 结局集合。
</div>

---

## 1.1.1 使命 ｜ 1.1.2 口号 ｜ 策略

<div class="grid2 mt-4">
<div class="card" style="border-left-color:#10b981"><b>使命</b><br/>把叙事创作中「结构」这件最费力的体力活交给程序，把「想讲什么」还给创作者。</div>
<div class="card" style="border-left-color:#f59e0b"><b>口号</b><br/>写一段设定，走进你自己的故事。<br/><span class="muted small">Set a world. Walk into it.</span></div>
</div>

<div class="grid3 mt-4">
<div class="card"><b>策略一 · 先结构后文本</b><br/><span class="tiny">先产出可校验的故事图，再填正文。</span></div>
<div class="card"><b>策略二 · 收敛自由度</b><br/><span class="tiny">节点/选项/结局/属性都有边界，校验可穷举。</span></div>
<div class="card"><b>策略三 · 失败可降级</b><br/><span class="tiny">模型失败不白屏，切本地引擎继续玩。</span></div>
</div>

---

## 1.1.3 目标用户

| 画像 | 特征 | 真实诉求 | 使用频次 |
|:--|:--|:--|:--|
| 独立创作者 | 有设定和点子，不会写代码 | 5 分钟内验证设定值不值得继续写 | 每周 2–3 次 |
| 校园写作社团 | 分组共创，老师要能点评结构 | 一节课产出多版对比，看得见分支差异 | 每学期集中 |
| 同人二创作者 | 已有角色卡与世界观，怕 OOC | 角色设定锁死，AI 只填场景 | 高频 |
| 展会 / 品牌互动 | 扫码即玩，5 分钟一个短篇 | 高并发、可控成本、统一调性 | 项目制 |

<div class="mt-3 tiny muted">
首个种子用户群：本校写作社与游戏社；早期做了 3 次共 11 人的非正式访谈。
</div>

---

## 1.1.4 如何获得用户 ｜ 1.1.5 团队优势

<div class="grid2">
<div class="card"><b>获客路径（低成本三角）</b><br/>
① <b>社团共创</b>：给写作社做「30 分钟生成 10 个开场」工作坊，作品页即展示页；<br/>
② <b>作品可见性</b>：导出 Markdown、分享链接，创作即传播；<br/>
③ <b>题材挑战赛</b>：每周一个题目，用同一主题的不同故事图做对比传播。</div>

<div class="card"><b>团队优势</b><br/>
① <b>叙事理解</b>：成员是 TRPG / 互动小说玩家，知道什么叫「选项有代价」；<br/>
② <b>工程质量</b>：Pylint 10.00、22 个 unittest、7 条用户路径；<br/>
③ <b>克制的技术观</b>：项目初期标准库 + 原生前端，不引入框架债；<br/>
④ <b>可替换性</b>：模型只改 baseUrl / model / apiKey 三项。</div>
</div>

---

## 1.1.6 差异化：我们卖的不是“生成”

| 维度 | 通用对话模型 | AI Dungeon 类 | Twine / Ink | EchoQuest |
|:--|:--|:--|:--|:--|
| 产出物 | 聊天记录 | 无限续写文本 | 手工树 | **可玩故事图（资产）** |
| 结构保证 | 无 | 弱 | 强但靠手写 | **程序校验 + 条件修复** |
| 分支/结局 | 无 | 弱 | 有 | **6–16 节点 / 1 或 3 结局** |
| 用户门槛 | 会提问 | 会打字 | 会写脚本 | **写 10–2000 字背景** |
| 单篇成本 | 按 token 累积 | 高（长上下文） | 0 | **2–3 次短调用** |
| 失败兜底 | 无 | 无 | 不适用 | **本地引擎降级不白屏** |

<div class="mt-3 small">
<b>一句话：</b>别人卖「生成」，我们卖「生成之后一定玩得下去」。
</div>

---

## 1.2 产品定义

<div class="card" style="font-size:0.74em; line-height:1.95">
对于 <b>有故事创意但不会写代码的独立创作者与校园写作社团</b><br/>
他们 <b>想把脑内设定快速变成可玩的分支故事，判断值不值得继续写</b><br/>
EchoQuest <b>是一个把自然语言设定编译成可玩互动叙事的生成式 Web 应用</b><br/>
它能够 <b>在几分钟内产出 6–16 节点、带属性与多结局、可逐节点编辑的故事，并立即试玩</b><br/>
不同于 <b>通用对话模型（只有文本、没有结构）和传统创作工具（结构全靠手工）</b><br/>
我们的产品 <b>用「架构 → 校验 → 撰写 → 修复 → 编译」的流水线，保证结构可玩、成本可观测、失败可降级</b>
</div>

---

## 1.2.1 解决的问题

<div class="grid3">
<div class="card"><b>① 结构不可玩</b><br/><span class="small">模型边写边迷路：分支断链、结局不可达、选项数量飘。</span><br/><span class="muted tiny">对策：先图后文 + 拓扑校验 + 条件修复</span></div>
<div class="card"><b>② 产出不可复用</b><br/><span class="small">聊天记录无法编辑、存档、版本化，改一句要整篇重来。</span><br/><span class="muted tiny">对策：编译成节点/选项，支持节点级重写</span></div>
<div class="card"><b>③ 成本与延迟不可控</b><br/><span class="small">一次超长提示词，贵、慢、失败即全废。</span><br/><span class="muted tiny">对策：2–3 次短调用 + 只重跑失败阶段 + 降级</span></div>
</div>

<div class="mt-5 small muted">
三条来自早期用户访谈：大家抱怨的不是“模型不聪明”，而是“生成出来的东西玩不下去”。
</div>

---

## 1.2.2 用户故事

<div class="small">
<b>US-1｜社团展示。</b>作为一个写作社学生，我想把「雨夜图书馆」这个开场变成 5 分钟能玩的分支短篇，以便在社团活动上快速展示三种不同走向。

<b>US-2｜数值验证。</b>作为一个独立游戏爱好者，我想把角色放进有体力、线索、信任三个属性的世界，以便验证这套数值是否真的让人“有取舍”。

<b>US-3｜结构点评。</b>作为一个社团指导老师，我想看到每次生成的结构问题清单，以便判断学生讲的故事“通不通”，而不是只看文笔。
</div>

<div class="mt-4 tiny muted">
三个故事的共同点：价值落在“拿到一个能用的结构”，不是“读了一段好文字”。
</div>

---

## 1.2.3 解决方案形态：Web 应用

<div class="grid3">
<div class="card"><b>形态</b><br/>浏览器 SPA + 服务端 API 代理<br/><span class="tiny muted">index.html + assets，无构建步骤</span></div>
<div class="card"><b>为什么不是 App</b><br/>App 上架审核、多端适配和分发成本高；Web 更适合快速验证核心体验</div>
<div class="card"><b>为什么不是小程序</b><br/>内容审核与未成年人保护要求更重，先用 Web 跑通内容链路</div>
</div>

<div class="mt-5 small">
<b>形态服务目标：</b>扫码/发链接即玩；零安装；老师课堂可本地起一份副本。
</div>

---

## 2. 产品设计原则总览

<div class="grid3 mt-3">
<div class="card"><b>需求</b><br/><span class="tiny">真实需求 &gt; 想象需求，需求要分层</span></div>
<div class="card"><b>信息</b><br/><span class="tiny">一屏一信息，进度必须可见</span></div>
<div class="card"><b>创新</b><br/><span class="tiny">换的不是界面，是抽象层次</span></div>
<div class="card"><b>系统</b><br/><span class="tiny">分层，每层只做一件事</span></div>
<div class="card"><b>收敛</b><br/><span class="tiny">把自由度换成枚举</span></div>
<div class="card"><b>优化</b><br/><span class="tiny">先结构后文本，局部重跑</span></div>
<div class="card"><b>继承</b><br/><span class="tiny">复用协议与基础设施，不重造</span></div>
<div class="card"><b>效益</b><br/><span class="tiny">每次调用都要换来可验收的产物</span></div>
<div class="card"><b>时间</b><br/><span class="tiny">先跑通再优化，三周 MVP</span></div>
<div class="card"><b>定量</b><br/><span class="tiny">通过率/断链率/延迟/成本可测</span></div>
<div class="card"><b>简化</b><br/><span class="tiny">无框架、无运行时第三方依赖</span></div>
<div class="card"><b>审核</b><br/><span class="tiny">结构校验 + 内容审核 + 人工抽检</span></div>
</div>

---

## 2.1 需求 · 信息 · 创新原则

| 原则 | 在本产品中的做法 | 证据 |
|:--|:--|:--|
| 真实需求 | 只做访谈中出现≥2 次的诉求；砍掉多人协作、角色语音 | 早期 11 人访谈，砍掉 4 个功能 |
| 需求分层 | Must：能生成能玩；Should：可编辑；Nice：分享 | 三周 MVP 只做 Must + Should |
| 信息原则 | 生成过程显示阶段、耗时、token、Agent 轨迹 | 生成页固定展示 4 项 |
| 创新原则 | 从“生成文章”换成“编译故事图” | 产物是图，不是文本 |
| 创新有边界 | 不做多 Agent 自治，先保证可验收 | 能力边界页主动说明 |

<div class="mt-3 small"><b>总结：</b>创新点不在“用了大模型”，而在“把大模型放进一个有断言的编译器里”。</div>

---

## 2.2 系统 · 收敛 · 优化原则

<div class="grid3">
<div class="card"><b>系统原则</b><br/>四层：浏览器 → Nginx → Agent 服务 → 模型。<br/><span class="tiny muted">模型只生成内容，边界由程序守</span></div>
<div class="card"><b>收敛原则</b><br/>节点 6–16、选项 2–4、结局 1 或 3、属性 3 个。<br/><span class="tiny muted">自由度收敛 → 校验可穷举</span></div>
<div class="card"><b>优化原则</b><br/>先定图再写文；校验失败只重跑修复，不整篇重生成。<br/><span class="tiny muted">失败阶段可单独定位</span></div>
</div>

<div class="mt-5 small">
<b>反例反思：</b>最初版本让模型边规划边写正文，18 个节点里 4 个断链、2 个结局不可达、单篇约 11 万 token。改成两段式后，结构问题在写正文前被拦下，单篇降到 2–3 次短调用。
</div>

---

## 2.3 继承 · 效益 · 时间 · 定量 · 简化 · 审核

<div class="grid2">
<div class="card"><b>继承</b><br/>OpenAI-compatible 协议、JSON Schema、Nginx + systemd；换模型不改编排。</div>
<div class="card"><b>效益</b><br/>每次模型调用必须换来可验收产物：架构→图、撰写→正文、修复→合格 JSON。</div>
<div class="card"><b>时间</b><br/>三周 MVP：第 1 周链路，第 2 周工坊与游玩，第 3 周质量与部署。</div>
<div class="card"><b>定量</b><br/>JSON 一次通过率、断链率、P95 延迟、单篇 token；Trace 明细已接入，报表按阶段汇总。</div>
<div class="card"><b>简化</b><br/>前端无框架无构建，后端标准库；运行时零第三方依赖。</div>
<div class="card"><b>审核</b><br/>结构校验自动化；内容审核中台未完成，公网运营前必须补。</div>
</div>

---

## 3.1 用户体验设计考虑的因素

<div class="grid2">
<div>
<div class="grid2">
<div class="card"><b>首屏零步进入</b><br/><span class="tiny">首页直接放示例作品，点开就能玩。</span></div>
<div class="card"><b>等待感可见</b><br/><span class="tiny">阶段条 + 耗时 + token + Agent 轨迹。</span></div>
<div class="card"><b>失败不白屏</b><br/><span class="tiny">模型失败自动切本地引擎。</span></div>
<div class="card"><b>一切可逆</b><br/><span class="tiny">节点编辑、整局重生成、存档、回溯。</span></div>
</div>
<div class="note mt-2">早期试用里，7/11 人在“没有任何反馈的 20 秒等待”中退出过页面，所以“等待感可见”优先级最高。</div>
</div>
<figure class="shot">
  <img src="./images/app-home.png" alt="EchoQuest 首页" style="height:270px;object-fit:cover;object-position:top" />
  <figcaption>首页：示例作品 + 零注册进入</figcaption>
</figure>
</div>

---

## 3.2 技术选型（含版本）

| 条目 | 内容 | 版本 | 备注 |
|:--|:--|:--|:--|
| 前端语言 | JavaScript (ES2022) | — | 原生，无构建 |
| 后端语言 | Python | 3.10+（实测 3.13.5） | 运行时零第三方依赖 |
| Web 服务 | `http.server.ThreadingHTTPServer` | stdlib | 轻量 BFF |
| 模型 | `deepseek-chat` | 2026-11 配置 | OpenAI-compatible |
| 网关 | Nginx | 1.18+ | 静态站点 + `/api` 反代 |
| 进程管理 | systemd | — | 自启、崩溃重启 |
| 数据 | 浏览器 localStorage | — | 本地零运维 |
| 质量 | Pylint / Radon / unittest | 4.1.3 / 6.0.1 / stdlib | 22 个用例 |
| CI | GitHub Actions | — | 回归测试 |
| 幻灯片 | Slidev | latest | Markdown 即源码 |

<div class="mt-2 tiny muted">IDE：VS Code；不锁定小版本。完整表格见仓库 README。</div>

---

## 3.2 技术选型理由：不要太重，也不要太轻

<div class="grid2">
<div class="card" style="border-left-color:#10b981"><b>为什么“轻”</b><br/>
① 选型验证的是叙事结构，不是框架能力；<br/>
② 单机 3 并发、每天 300 次调用的量级，标准库足够；<br/>
③ 零依赖 = 老师/评委在自己电脑上 `python server.py` 就能跑。</div>
<div class="card"><b>当前结论</b><br/>
前端：原生 JS + Hash 路由<br/>
后端：Python stdlib<br/>
模型：OpenAI-compatible<br/>
数据：localStorage + SQLite</div>
</div>

<div class="mt-4 small"><b>选型标准：</b>这项技术是否解决当前阶段的唯一瓶颈？当前瓶颈是“模型输出不可控”，所以重心放在校验与编排，不是框架。</div>

---

## 3.3 代码仓库与协作

<div class="grid2" style="align-items:stretch">
<figure class="shot" style="display:flex;flex-direction:column;justify-content:center">
  <img src="./images/pulse.png" alt="GitHub 提交记录" style="height:360px;width:100%;object-fit:contain;background:#fff" />
  <figcaption>GitHub Contributors：De-xing 38 commits / Wirtz696 3 commits</figcaption>
</figure>
<div>
  <div class="card"><b>仓库</b><br/><code>github.com/De-xing/ai-text-adventure-game</code><br/><span class="tiny muted">JavaScript + Python · Web 应用</span></div>
  <div class="card mt-2"><b>提交规范</b><br/>Conventional Commits：<code>feat:</code> / <code>fix:</code> / <code>docs:</code> / <code>refactor:</code><br/><span class="tiny muted">每条提交对应一个可验收改动</span></div>
  <div class="card mt-2"><b>CI / Issues</b><br/>GitHub Actions 跑 22 个 unittest<br/><span class="tiny muted">Issues 作为公开缺陷池；质量报告见 3.6</span></div>
</div>
</div>

<div class="mt-3 tiny">
<b>协作问题修正：</b>原 <code>workflows/tests.yml</code> 放错目录，导致 Actions 实际没执行；已迁移到 <code>.github/workflows/</code>。
</div>

---

## 3.4 全生命周期主要问题与解决

| 阶段 | 问题 | 发生原因 | 解决办法 |
|:--|:--|:--|:--|
| 分析 | “AI 生成故事”不可验收 | 缺可量化标准 | 定义一次通过率/断链率/P95/token |
| 设计 | 想直接上多 Agent 自治 | 高估收益、低估调试成本 | 收敛为固定阶段流水线 |
| 开发 | 模型 JSON 带围栏、尾逗号 | 模型不受 Schema 约束 | `extract_json` 容错 + 校验 + 一次 repair |
| 重构 | 单文件越写越乱，最大复杂度 62 | 职责混杂 | 拆分职责，Pylint 8.98→10.00 |
| 测试 | 单测依赖真实 API，不稳定 | 未打桩 | fixtures + mock LLM，22 用例 |
| 部署 | Key 有进仓库风险 | 配置写代码里 | `.secrets` 600 + Nginx 拒隐藏路径 |
| 运维 | CI 文件放错目录，实际没跑 | 不熟悉 Actions 约定 | 迁到 `.github/workflows/` |

---

## 3.5.0 使用工具

<div class="grid3">
<div class="card"><b>设计与架构</b><br/><span class="tiny">Mermaid（关系/流程草图）<br/>Slidev HTML 组件（架构图、流程条）<br/>不依赖外链图床</span></div>
<div class="card"><b>开发与调试</b><br/><span class="tiny">VS Code / 浏览器 DevTools<br/>Python 3.13.5<br/>Nginx + systemd（部署）</span></div>
<div class="card"><b>质量与协作</b><br/><span class="tiny">Pylint 4.1.3 + Radon 6.0.1<br/>unittest + Playwright（QA）<br/>Git / GitHub Actions</span></div>
</div>

<div class="note mt-3">图都尽量用仓库内的文本/HTML 重绘，不用 PPT 截图；这样改版本时不会出现“图和代码对不上”。</div>

---

## 3.5.1 系统架构图

<div class="dflow">
<div class="dbox"><b>浏览器 SPA</b><span class="s">原生 HTML/CSS/JS<br/>Hash 路由</span></div>
<div class="darrow">──▶</div>
<div class="dbox warn"><b>Nginx :80</b><span class="s">静态资源<br/>/api 反代</span></div>
<div class="darrow">──▶</div>
<div class="dbox llm"><b>Agent 服务</b><span class="s">server.py :8000<br/>同源/限流/编排</span></div>
<div class="darrow">──▶</div>
<div class="dbox llm"><b>LLM</b><span class="s">OpenAI-compatible<br/>deepseek-chat</span></div>
</div>

<div class="dflow">
<div class="dbox local"><b>localStorage</b><span class="s">作品·存档·结局</span></div>
<div class="darrow">◀──</div>
<div class="dbox"><b>浏览器</b><span class="s">与上图同一端</span></div>
<div class="darrow">──▶</div>
<div class="dbox local"><b>本地剧情引擎</b><span class="s">降级兜底</span></div>
<div class="darrow">│</div>
<div class="dbox"><b>.secrets/api.json</b><span class="s">600 · 仅服务端读</span></div>
</div>

<div class="grid3 mt-3">
<div class="card"><b>分层职责</b><br/><span class="tiny">浏览器：交互与本地数据<br/>服务：同源/限流/编排/校验<br/>模型：只生成内容</span></div>
<div class="card"><b>关键约束</b><br/><span class="tiny">浏览器不接触 Key<br/>模型输出不直接改状态</span></div>
<div class="card"><b>降级路径</b><br/><span class="tiny">上游失败 → 本地引擎<br/>可用性优先</span></div>
</div>

<div class="tiny muted mt-2">3.5.0 制图工具：Mermaid（架构草稿）+ Slidev HTML 组件；图片均为本地素材，不依赖外链。</div>

---

## 3.5.2 基础设施图

<div class="dflow">
<div class="dbox"><b>用户</b><span class="s">浏览器 / 扫码</span></div>
<div class="darrow">──▶</div>
<div class="dbox warn"><b>阿里云 ECS</b><span class="s">单台 · 公网 80</span></div>
<div class="darrow">──▶</div>
<div class="dbox"><b>Nginx</b><span class="s">/var/www/echoquest</span></div>
<div class="darrow">──▶</div>
<div class="dbox llm"><b>systemd</b><span class="s">echoquest.service<br/>127.0.0.1:8000</span></div>
</div>

| 项 | 当前现状 |
|:--|:--|
| 计算 | 单台 ECS，3 并发 |
| 存储 | 浏览器 localStorage + 单机 SQLite |
| 密钥 | `/opt/echoquest/.secrets/api.json`，600 |
| 网络 | 80 端口，安全组最小开放 |
| 可观测 | 日志 + 前端 Agent Trace |

---

## 3.5.3 智能体设计 · 总览

<div class="small mb-2">核心判断：<b>模型只负责“写”，程序负责“准不准、能不能玩、贵不贵”。</b></div>

| 部件 | 当前实现（Demo） |
|:--|:--|
| 任务编排 | 固定流水线 + `/api/agent/plan` 计划图 |
| 工具调用 | `tools/whitelist.json` + `/api/tools/route` 规则路由 |
| 记忆 | SQLite `games/runs/summaries` + `/api/memory/*` |
| 护栏 | 本地 PII/关键词 `/api/safety/check` |
| 知识库 | BM25 + 128 维哈希向量 + 同主题图扩展 |

<div class="note mt-2">五件套 Demo 已落地：计划接口、工具白名单/路由、SQLite 记忆、本地护栏、混合 RAG。</div>

<div class="tiny muted mt-2">代码：<code>agent_runtime.py</code> / <code>memory_store.py</code> / <code>guardrails.py</code> / <code>tools/whitelist.json</code> / <code>knowledge/</code></div>

---

## 3.5.3 为什么不是一次性长提示词

<div class="grid2">
<div class="card" style="border-left-color:#ef4444"><b>最初做法</b><br/><span class="small">
所有要求写进一段 system prompt，让模型一次吐出完整故事 JSON。<br/><br/>
实测失败：18 节点里 4 个断链；2 个结局不可达；选项在 2–6 之间飘；单篇约 11 万 token，失败全废。
</span></div>
<div class="card" style="border-left-color:#10b981"><b>改成两段式</b><br/><span class="small">
模型只产出图（拓扑 + 故事圣经）→ 程序校验 → 模型按图填正文。<br/><br/>
收益：结构问题在写正文前拦下；校验器可单测；失败只重跑修复；成本变成 2–3 次短调用。
</span></div>
</div>

<div class="mt-4 small"><b>根因：</b>模型不能同时解“结构应该长什么样”和“这段文字怎么写”，约束越靠后越容易丢。</div>

---

## 3.5.3 任务编排 · 生成流水线

<div class="dflow" style="gap:4px">
<div class="dbox llm"><b>① 架构</b><span class="s">/architect</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>② 结构校验</b><span class="s">拓扑/选项/结局</span></div>
<div class="darrow">▶</div>
<div class="dbox llm"><b>③ 撰写</b><span class="s">/write</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>④ 一致性校验</b><span class="s">节点/文本/可达</span></div>
<div class="darrow">▶</div>
<div class="dbox warn"><b>⑤ 条件修复</b><span class="s">/repair</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>⑥ 编译</b><span class="s">图→game</span></div>
</div>

| 阶段 | 能否跳过模型 | 失败后的动作 |
|:--|:--:|:--|
| 架构 | 否 | 超时重试 1 次 → 降级 |
| 结构校验 | **是** | 生成 issues，进入修复 |
| 撰写 | 否 | 重试/降级 |
| 条件修复 | 否 | 最多 2 次总调用 |
| 编译 | **是** | 复用已有内容重跑 |

<div class="mt-2 tiny muted">失败路径：超时、429/5xx、JSON 解析失败、断链/选项不足、输出截断；每条都有明确归宿，不静默返回半成品。</div>

---

## 3.5.3 任务编排 · 状态与失败路径

<div class="dflow" style="gap:3px">
<div class="dbox"><b>用户提交</b><span class="s">背景/参数</span></div>
<div class="darrow">▶</div>
<div class="dbox warn"><b>生成锁</b><span class="s">防重复提交</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>健康探测</b><span class="s">/api/health</span></div>
<div class="darrow">▶</div>
<div class="dbox llm"><b>Agent 编排</b><span class="s">架构→校验→撰写</span></div>
<div class="darrow">▶</div>
<div class="dbox warn"><b>条件修复</b><span class="s">issues 非空</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>编译</b><span class="s">game 对象</span></div>
<div class="darrow">▶</div>
<div class="dbox"><b>工坊</b><span class="s">可编辑/可玩</span></div>
</div>

<div class="grid2 mt-3">
<div class="card"><b>状态控制</b><br/>
<span class="tiny">
① <code>state.generation</code> 锁：生成中禁止二次提交<br/>
② <code>AbortController</code>：用户取消后不再写入作品<br/>
③ 上游最多 3 个并发；每个阶段独立超时<br/>
④ 只有编译成功才进入工坊，避免半成品落库
</span></div>
<div class="card"><b>失败矩阵</b><br/>
<span class="tiny">
超时 → 重试 1 次 → 本地降级<br/>
429/5xx → 退避 2s 重试 1 次<br/>
JSON 非法 → 去围栏/尾逗号 → 条件修复<br/>
断链/选项不足 → issues → 最多 1 次 repair<br/>
用户取消 → 终止请求 → 不产生 game
</span></div>
</div>

<div class="note mt-3">编排的核心不是“让模型多跑几次”，而是让每次失败都有明确归宿：可降级的降级，不可降级的 4xx 拒绝，绝不静默返回半成品。</div>

<div class="tiny muted mt-2">代码入口：<code>app.js: startGeneration()</code> → <code>agent.js: generate()</code> → <code>server.py: do_POST()</code></div>

---

## 3.5.3 工具边界与护栏

<div class="grid2">
<div class="card"><b>模型能做什么</b><br/><span class="small">只产出 JSON 内容；没有数据库、文件系统、网络权限；不能直接改服务端状态。</span><br/><span class="tiny muted">当前是固定阶段接口，不是模型自主 Function Calling。</span></div>
<div class="card"><b>程序必须做什么</b><br/><span class="small">结构校验、选项过滤、结局可达、编译、错误信封、限流、密钥隔离。</span><br/><span class="tiny muted">改结构/改状态/放行内容的动作，一律由程序执行。</span></div>
</div>

<div class="grid4 mt-3">
<div class="card"><b>输入</b><br/><span class="tiny">10–2000 字<br/>HTML/控制字符处理<br/>注入模式检查</span></div>
<div class="card"><b>权限</b><br/><span class="tiny">工具白名单<br/>无 DB/FS/网络<br/>状态变更过编译器</span></div>
<div class="card"><b>输出</b><br/><span class="tiny">只收 JSON<br/>字段/长度限制<br/>HTML 转义，不 eval</span></div>
<div class="card"><b>数据</b><br/><span class="tiny">Key 服务端 600<br/>同源校验<br/>48KB + 限流</span></div>
</div>

<div class="tiny muted mt-2">工具白名单：<code>tools/whitelist.json</code>；启动时校验，未知路由 404；<code>GET /api/tools</code> 可查看。</div>

---

## 3.5.3 记忆与知识：当前实现

<div class="grid2">
<div class="card" style="border-left-color:#10b981"><b>本地实现</b><br/><span class="small">
作品、存档、结局、草稿在 localStorage；每次生成携带故事圣经；上下文只包含当前任务需要的内容；以最小状态闭环支撑完整体验。
</span></div>
<div class="card" style="border-left-color:#6366f1"><b>SQLite 记忆</b><br/><span class="small">
games / runs / summaries；/api/memory/save 与 /api/memory/load；单机持久化，前端仍以 localStorage 为主。
</span></div>
</div>

<div class="grid3 mt-3">
<div class="card"><b>硬约束</b><br/><span class="tiny">世界观/角色底线，全量注入，不交给检索层。</span></div>
<div class="card"><b>RAG</b><br/><span class="tiny">9 篇知识文档，BM25 + 哈希向量 + 图扩展 topK=3，已注入架构与撰写 Prompt。</span></div>
<div class="card"><b>图扩展</b><br/><span class="tiny">按知识文档主题做邻域加分；已接入混合检索。</span></div>
</div>

<div class="mt-3 small"><b>边界：</b>当前是 localStorage + 单机 SQLite；跨设备、多用户记忆不在本版本。</div>


---

## 3.5.3 轻量 RAG：知识如何进入 Prompt

<div class="dflow" style="gap:4px">
<div class="dbox local"><b>知识文档</b><span class="s">knowledge/*.md</span></div>
<div class="darrow">▶</div>
<div class="dbox"><b>分块</b><span class="s">按段落/标题</span></div>
<div class="darrow">▶</div>
<div class="dbox llm"><b>混合索引</b><span class="s">BM25 + 128维向量</span></div>
<div class="darrow">▶</div>
<div class="dbox warn"><b>TopK=3</b><span class="s">来源 + 分数</span></div>
<div class="darrow">▶</div>
<div class="dbox llm"><b>Prompt 注入</b><span class="s">架构 / 撰写</span></div>
<div class="darrow">▶</div>
<div class="dbox local"><b>生成</b><span class="s">故事图 + 正文</span></div>
</div>

<div class="grid3 mt-3">
<div class="card"><b>知识语料</b><br/><span class="tiny">
9 篇 Markdown：结构、文风、角色、内容安全；悬疑/恋爱/科幻/冒险/末世五类题材。
<br/>共 34 个可检索片段。
</span></div>
<div class="card"><b>检索实现</b><br/><span class="tiny">
<code>server.py: search_knowledge()</code><br/>
中文按 2-gram、英文按词切分；BM25 + 128 维哈希向量 + 同主题图扩展，topK=3，零新增依赖。
</span></div>
<div class="card"><b>注入与可观测</b><br/><span class="tiny">
架构/撰写 Prompt 增加 <code>参考资料</code>；响应 <code>meta.knowledge</code> 返回来源、标题、分数。
</span></div>
</div>

<div class="grid2 mt-3">
<div class="card"><b>接口</b><br/><span class="tiny">
<code>POST /api/knowledge/search</code><br/>
输入 <code>query</code>、<code>topK</code>；返回片段、来源和分数，便于调试与演示。
</span></div>
<div class="card"><b>边界</b><br/><span class="tiny">
当前是本地混合检索（BM25 + 哈希向量 + 同主题图），不依赖外部向量库；硬约束仍然全量注入，不依赖召回。
</span></div>
</div>

<div class="note mt-3">RAG 解决“查得到”，不解决“结构一定对”；结构仍然由校验器与条件修复保证。</div>

---

## 3.5.3 协作架构：硬约束 / 图 / RAG / 记忆

| 组件 | 回答什么问题 | 数据 | 当前状态 |
|:--|:--|:--|:--|
| 硬约束 | 什么绝对不能被改写？ | 角色底线、世界规则 | 故事圣经全量注入 |
| 故事图 | 谁和谁是什么关系？这条路径通不通？ | 节点、选项、角色、地点 | 节点图已编译 |
| RAG | 哪段知识/场景与当前任务最相关？ | Markdown 分块 + BM25 + 哈希向量 + 图扩展 | 已接入 Demo topK=3 |
| 工作记忆 | 这一局玩家做了什么？ | 当前节点、属性、选择 | localStorage |

<div class="small mt-3">
<b>装配顺序：</b>硬约束（全量）→ 当前/相邻节点 → 最近交互 → 图邻域 → RAG topK → 旧摘要。冲突时按这个优先级裁决，不交给模型自由决定。
</div>

<div class="note mt-2">本版本已接入混合 RAG Demo + 工作记忆。</div>

---

## 3.5.4 数据设计：本地存储与 SQLite

<div class="grid2">
<div class="card"><b>本地存储（零运维）</b><br/><span class="small">
<code>echoquest.userGames.v1</code> 作品<br/>
<code>echoquest.saves.v1</code> 手动存档<br/>
<code>echoquest.autosave.v1</code> 自动存档<br/>
<code>echoquest.endings.v1</code> 结局<br/>
<code>echoquest.draft.v1</code> 草稿
</span></div>
<div class="card"><b>SQLite 记忆（Demo）</b><br/><span class="small">
games / runs / summaries<br/>
/api/memory/save 与 /api/memory/load<br/>
单机持久化；与浏览器 localStorage 并存
</span></div>
</div>

<div class="note mt-3">当前使用 localStorage 保存玩家进度，SQLite 保存服务端作品/步骤/摘要；两者都不依赖外部数据库服务。</div>

---

## 3.5.5 接口设计

| 接口 | 功能 | 输入 | 输出 |
|:--|:--|:--|:--|
| `GET /api/health` | 健康检查 | — | `ok, ai, model, provider` |
| `POST /api/agent/architect` | 生成故事蓝图 | background, genre, tone, length, endingCount | blueprint, issues, usage |
| `POST /api/agent/write` | 按图写正文 | bible, background, endingCount | nodes{}, issues, usage |
| `POST /api/agent/repair` | 按 issues 修复 | bible, nodes, issues | nodes{}, issues |

<div class="mt-2 small"><b>统一响应：</b>成功 `{ok:true, data, meta}`；失败 `{ok:false, error, code}`。内容审核与记忆检索按同一包络预留扩展接口，契约与实现同步维护。</div>

---

## 3.5.6 前端设计

<div class="grid3">
<div class="card"><b>技术形态</b><br/><span class="tiny">原生 HTML/CSS/JS<br/>Hash 路由<br/>无框架、无构建</span></div>
<div class="card"><b>模块划分</b><br/><span class="tiny"><code>app.js</code> 路由/业务<br/><code>agent.js</code> Agent 编排/编译<br/><code>story-generator.js</code> 降级<br/><code>data.js</code> 示例/模板</span></div>
<div class="card"><b>安全渲染</b><br/><span class="tiny">统一 <code>escapeHtml</code><br/>不把模型输出拼进属性<br/>不 <code>eval</code></span></div>
<div class="card"><b>状态管理</b><br/><span class="tiny">localStorage 分键<br/>每键版本化</span></div>
<div class="card"><b>可观测</b><br/><span class="tiny">前端 Agent Trace：阶段/耗时/token/失败原因</span></div>
<div class="card"><b>响应式</b><br/><span class="tiny">单列优先、底部操作区、点击区 ≥44px</span></div>
</div>

<div class="mt-3 small"><b>为什么不用 Vue/React：</b>4 个视图、状态集中、无多人协作；页面数翻倍或需要协同编辑时立刻换。</div>

---

## 3.6 软件质量

<div class="grid2">
<div class="card" style="border-left-color:#10b981"><b>重构前后（Pylint + Radon）</b><br/>
<span class="tiny">
Pylint Score：<b>8.98 → 10.00</b><br/>
Code Smells：<b>46 → 0</b><br/>
平均圈复杂度：<b>8.0 → 4.51</b><br/>
最大圈复杂度：<b>62 → 17</b><br/>
测试：<b>22 / 22 通过</b>
</span></div>
<div class="card"><b>3.6.1 质量控制 ｜ 3.6.2 质量工具</b><br/>
<span class="tiny">
① 日志：阶段、耗时、token、错误码，不记密钥/正文<br/>
② 异常：超时/限流/解析/断链/截断都有归宿<br/>
③ Pylint：语义与风格检查；Radon：圈复杂度<br/>
④ 测试：单元 + HTTP 集成 + 同源拒绝<br/>
⑤ CI：GitHub Actions 跑回归
</span></div>
</div>

<div class="grid2 mt-3">
<figure class="shot">
  <img src="./images/quality-report.png" alt="质量报告" style="height:138px;width:100%;object-fit:cover;object-position:top;display:block" />
  <figcaption>质量报告：Pylint 分数、Code Smell、复杂度</figcaption>
</figure>
<figure class="shot">
  <img src="./images/scan-compare.png" alt="重构前后扫描对比" style="height:138px;width:100%;object-fit:contain;display:block" />
  <figcaption>左：重构前 8.98 / 46 smells；右：重构后 10.00 / 0</figcaption>
</figure>
</div>

<div class="tiny muted mt-2">扫描脚本在仓库 <code>qa/</code>，可现场复跑：<code>python qa/run_scan.py after</code>。</div>

---

## 3.7 代码统计

<div class="grid2">
<div class="card"><b>规模（当前仓库实测）</b><br/>
<span class="tiny">
后端：<code>server.py</code> 899 行 / 36.9 KB<br/>
前端：<code>app.js</code> 3,108 行 / 152 KB；<code>styles.css</code> 116 KB；<code>agent.js</code> 410 行 / 19 KB；<code>story-generator.js</code> 49 KB<br/>
测试：2 个测试文件 / 22 个用例<br/>
存储：localStorage（零运维）
</span></div>
<div class="card"><b>模块数</b><br/><span class="tiny">
前端 5 个 JS 模块 + 1 个样式表；后端 1 个服务模块；测试 2 个目录（unit/integration）；数据库 schema 由 memory_store.py 管理。
</span></div>
</div>

<div class="grid2 mt-3">
<div class="card"><b>文档与交付物</b><br/><span class="tiny">架构文档 39 KB；测试用例 50 KB；质量报告 8 KB；部署指南 20 KB；知识库 9 篇 / 34 片段</span></div>
<div class="card"><b>AI 辅助 vs 手写</b><br/><span class="tiny">骨架与重复性代码由 AI 辅助；校验器、状态机、Schema、提示词策略由团队设计与修改。<br/><span class="muted">按文件归属粗估约 60% AI 辅助 / 40% 人工设计与修改；非行级精确统计。</span></span></div>
</div>

---

## 第二部分 · 作品演示（2 分钟）

| 时间 | 动作 | 让评委看到什么 |
|:--|:--|:--|
| 0:00 | 首页点示例作品 | 零注册，首屏即玩 |
| 0:20 | 回创作页，输入 30 字背景 | 门槛就是一段话 |
| 0:30 | 点生成，指阶段条 | 架构→校验→撰写→编译，含耗时/token |
| 1:00 | 工坊改一个节点 | 产物是结构，可局部改 |
| 1:20 | 游玩走两条分支 | 选项有代价，状态常驻 |
| 1:45 | 展示结局/存档/导出 | 叙事资产可保存、可带走 |

<div class="note mt-3"><b>兜底：</b>网络/额度异常时直接演示本地降级引擎——页面仍可生成可玩故事，这不是事故，是设计点。</div>

---

## 三句话总结

<div class="grid3 mt-6">
<div class="card"><b>产品</b><br/><span class="tiny">不是聊天机器人，是把设定编译成可玩叙事的流水线。</span></div>
<div class="card"><b>技术</b><br/><span class="tiny">模型只管写，程序管边界：编排、校验、降级、限流。</span></div>
<div class="card"><b>工程</b><br/><span class="tiny">Pylint 10.00 · 22 用例 · 成本与失败路径可观测 · 边界写清楚。</span></div>
</div>

<div class="mt-10 text-sm muted">
谢谢 · 欢迎提问
</div>
<div class="mt-1 text-xs muted">
demo http://echoquest.120.26.225.51.sslip.io ｜ code github.com/De-xing/ai-text-adventure-game
</div>

---

## 附录 · 参考文献与工具

<div class="tiny">
<b>方法：</b>ReAct（arXiv:2210.03629）、Plan-and-Solve（arXiv:2305.04091）、Self-Refine（arXiv:2303.17651）、GraphRAG（arXiv:2404.16130）、Lost in the Middle（arXiv:2307.03172）、MemGPT（arXiv:2310.08560）<br/><br/>
<b>工程：</b>OpenAI-compatible Chat Completions、JSON Schema 2020-12、Nginx、systemd、Pylint、Radon、unittest、Playwright<br/><br/>
<b>本幻灯片：</b>Slidev；正文即 Markdown，可进 Git、可 review、可 diff。
</div>

<div class="note mt-3">
版本定位：可运行 Web 应用。已接入本地 RAG、SQLite 记忆与本地护栏；聚焦创作、校验、编辑与游玩的完整闭环。
</div>
