# ai-text-adventure-game
AI powered text adventure game. A text game driven by large language model API.

## 项目介绍
AI文字冒险游戏。
游戏玩家状态（血量、背包、场景、存档）由本地代码管理；剧情、场景描述、行动选项由大语言模型API动态生成。

两种运行模式：
1. 云端API模式：联网调用大模型接口生成剧情，需要网络和API密钥
2. Ollama本地离线模式：本地部署大模型，断网游玩

> 本项目仅对指定协作者开放代码修改权限。外部用户仅可阅读源码，未经许可不得修改、二次分发或商用。

## 功能
- 玩家状态管理：生命值、背包物品、当前地点
- 保存对话上下文，AI连贯生成剧情
- 结构化输出，自动解析场景和行动选项
- 存档、读档功能

## 依赖
- C++17
- libcurl：HTTP网络请求
- nlohmann/json：JSON解析
- CMake构建工具

### Ollama本地硬件参考
- RAM内存 ≥16GB
- 独立显存 ≥6GB
- 推荐模型：qwen2.5:7b Q4量化

## 编译运行
```bash
git clone https://github.com/De-xing/ai-text-adventure-game.git
cd ai-text-adventure-game

mkdir build && cd build
cmake ..
make
