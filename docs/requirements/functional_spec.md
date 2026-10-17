# 软件系统功能规格说明书

> 项目名称：AI 互动文字游戏生成平台（AI Text Game Platform）
> 文档版本：v1.0
> 适用阶段：需求分析 / 面向对象分析（OOA）
> 编写依据：GB/T 8567-2006《计算机软件文档编制规范》骨架、ISO/IEC/IEEE 29148 功能性需求条目化、OMG UML 2.x 领域建模规范

---

## 1. 引言

### 1.1 编写目的
本文档面向开发团队、测试团队与课程评审教师，明确"AI 互动文字游戏生成平台"的系统角色、功能性需求边界与领域对象关系，作为后续原型设计、任务拆解与验收的依据。

### 1.2 产品概述
本平台是一个 **用户输入故事背景（世界观、主角、题材、基调），由大语言模型自动生成可交互文字冒险游戏** 的 Web 平台。创作者只需提交一段背景描述与少量参数，系统即自动产出包含剧情节点、分支选项与多结局的文字游戏；玩家进入后通过"阅读剧情 → 做出选择 → AI 实时续写"的方式进行互动。

### 1.3 术语定义
| 术语 | 含义 |
|---|---|
| 背景设定（Background） | 创作者输入的世界观、主角身份、时代、题材、剧情基调等原始描述 |
| 游戏（Game） | 一次 AI 生成 + 后续互动所构成的完整文字冒险作品 |
| 剧情节点（Story Node） | 游戏中一段不可再分的剧情文本单元，玩家读完后面对若干选项 |
| 分支（Branch） | 玩家在节点上做出某选项后延伸出的下一段剧情路径 |
| 结局（Ending） | 剧情树的终止节点，标志游戏通关 |
| 角色属性（Stat） | 影响剧情走向的数值，如生命值、金钱、角色好感度 |
| 存档（Save Slot） | 记录玩家当前进度、属性与已选路径的持久化数据 |

---

## 2. 系统角色（Actor）

* **游戏玩家（Player）**：注册用户，填写故事背景与生成参数，触发 AI 生成游戏，进入游戏阅读剧情、在剧情节点上做出选择，触发 AI 续写；可存档、回退分支、查看他人发布的游戏。
* **AI 生成引擎（AI Engine，系统内服务型 Actor）**：接收创作者背景，产出初始剧情树；在玩家每步选择后续写下一段剧情，维护剧情连贯性与设定一致性。
* **系统管理员（Admin）**：审核公开发布的游戏内容、处置举报、查看用户与 AI 调用统计、配置生成限流与模型参数。

---

## 3. 功能树（Feature Tree）

### 模块一：背景输入与 AI 游戏生成
* FR-1.1：支持创作者以自然语言文本输入背景设定（世界观、主角、时代、题材、情绪基调，不少于 10 字、不超过 2000 字）
* FR-1.2：支持创作者选择生成参数——游戏类型（悬疑/恋爱/冒险/末世/科幻等）、预计剧情长度、结局数量（单结局 / 2~5 个多结局）、是否带角色属性系统
* FR-1.3：系统调用 AI 引擎，依据背景与参数自动生成一份完整可玩游戏，至少包含：开场节点、3 个以上初始可选分支、1 个以上结局节点
* FR-1.4：生成过程以流式方式展示进度，预计生成时间超过 5s 时显示进度提示，失败时给出错误原因并允许重试
* FR-1.5：生成完成后提供"预览模式"，创作者可逐节点查看剧情与选项
* FR-1.6：支持对任意剧情节点点击"重新生成本段"或"手动编辑文案"，人工微调 AI 产出
* FR-1.7：支持整体"重新生成整局"，保留原背景设定与参数

### 模块二：游戏进行与 AI 实时互动
* FR-2.1：玩家在游戏页面阅读当前剧情节点文本，页面下方给出文本框，提示玩家进行下一步操作。
* FR-2.2：玩家输入操作后，系统调用 AI 引擎实时续写下一段剧情文本，并继续给出供玩家输入的文本框
* FR-2.3：AI 续写必须与已有剧情、角色设定、已出现属性保持一致，不得前后矛盾
* FR-2.4：到达结局节点时，页面标注已结束，并提供"从某历史节点重新开始"入口
* FR-2.5：若游戏开启角色属性系统，选项会展示其对属性的影响（如"好感度 +1"），属性数值变化实时可见
* FR-2.6：支持玩家在任意节点"回退"到之前的任一历史节点，从该节点重选（分支回溯），原路径不被删除

### 模块三：存档与进度管理
* FR-3.1：系统自动保存游戏进度（当前节点、属性值、已走过的路径），无需玩家手动操作
* FR-3.2：单局游戏支持最多 5 个手动存档位，玩家可命名、读取、删除存档
* FR-3.4：支持将本局完整剧情记录导出为 Markdown / TXT 文件


### 模块四：用户与系统管理
* FR-4.1：支持邮箱 / 第三方账号注册登录，维护昵称、头像、个人简介
* FR-4.2：管理员后台可查看待审核游戏列表，执行通过 / 驳回 / 下架操作
* FR-4.3：管理员可查看平台统计——注册用户数、生成游戏数、AI token 消耗、日活
* FR-4.4：系统对单用户 AI 调用进行限流（如每日生成次数上限、长上下文续写频率限制），超限给出友好提示
* FR-4.5：系统记录所有 AI 生成调用日志（时间、用户、gameId、token 数、是否成功），便于审计与成本核算
* FR-4.6：管理员可配置切换底层大模型、调整生成 temperature 等参数

---

## 4. 领域模型（Domain Model UML）

```mermaid
classDiagram
    class User {
        +userId: String
        +nickname: String
        +email: String
        +registerTime: Date
        +createGame()
        +playGame()
    }

    class Game {
        +gameId: String
        +title: String
        +genre: Enum[Suspense/Romance/Adventure/PostApocalypse/SciFi]
        +status: Enum[Private/Published/UnderReview/Rejected]
        +createTime: Date
        +publish()
        +regenerate()
    }

    class BackgroundSetting {
        +backgroundId: String
        +worldView: String
        +protagonist: String
        +era: String
        +tone: String
        +rawText: String
    }

    class StoryNode {
        +nodeId: String
        +gameId: String
        +text: String
        +isEnding: Boolean
        +endingType: Enum[Good/Bad/Hidden/None]
        +orderIndex: Int
    }

    class Choice {
        +choiceId: String
        +fromNodeId: String
        +toNodeId: String
        +choiceText: String
        +statDelta: JSON
    }

    class Character {
        +charId: String
        +gameId: String
        +name: String
        +description: String
        +relationship: Enum[Ally/Enemy/Stranger]
    }

    class GameStat {
        +statId: String
        +name: String
        +initialValue: Int
        +minValue: Int
        +maxValue: Int
    }

    class SaveSlot {
        +saveId: String
        +userId: String
        +gameId: String
        +currentNodeId: String
        +snapshotStats: JSON
        +saveName: String
        +saveTime: Date
        +load()
    }

    class Review {
        +reviewId: String
        +gameId: String
        +userId: String
        +rating: Int
        +comment: String
        +createTime: Date
    }

    class AIGenerationTask {
        +taskId: String
        +gameId: String
        +type: Enum[FullGenerate/ContinueBranch/RegenerateNode]
        +prompt: String
        +tokenUsed: Int
        +status: Enum[Pending/Running/Succeeded/Failed]
        +createTime: Date
    }

    User "1" -- "*" Game : 创建 / 拥有
    Game "1" -- "1" BackgroundSetting : 基于
    Game "1" -- "*" StoryNode : 包含
    StoryNode "1" -- "*" Choice : 提供选项
    Choice --> StoryNode : 指向
    Game "1" -- "*" Character : 登场
    Game "1" -- "*" GameStat : 设定属性
    User "1" -- "*" SaveSlot : 保存
    SaveSlot --> Game : 属于
    SaveSlot --> StoryNode : 停留在
    Game "1" -- "*" Review : 收到评论
    User "1" -- "*" Review : 发表
    Game "1" -- "*" AIGenerationTask : 触发生成
