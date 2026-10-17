# AI Text Adventure C++
A text adventure game written in C++, powered by LLM.

## 项目介绍
这是一款C++开发的AI文字冒险游戏。
游戏核心逻辑（玩家血量、背包、地点、存档）由C++本地管理；
剧情、场景描述、可执行选项由大语言模型生成。

两种运行模式可选：
1. 云端API模式：调用大模型在线接口生成剧情，需要网络与API Key
2. 本地Ollama模式：本地部署大模型，断网离线游玩

> 本项目仅对指定协作者开放代码修改权限。外部用户仅可阅读源码，未经许可不得修改、二次分发或商用。

## 功能特性
- ✅ 玩家状态管理：生命值、背包物品、当前场景记录
- ✅ 对话历史上下文，AI连贯生成剧情
- ✅ 结构化返回，自动解析场景与行动选项
- ✅ 存档/读档功能（可加密存档防止篡改）
- ✅ 控制台文字交互界面

## 环境依赖
### 编译依赖
- C++17 及以上
- libcurl：用于HTTP网络请求
- nlohmann/json：JSON解析库
- CMake（推荐用于构建项目）

### 本地Ollama模式硬件参考
- 推荐内存：16GB RAM
- 推荐显存：≥6GB 独立显存
- 推荐模型：qwen2.5:7b (Q4量化，中文表现优秀)

## 快速构建 & 运行
```bash
# 1.克隆仓库
git clone https://github.com/De-xing/ai-text-adventure-cpp.git
cd ai-text-adventure-cpp

# 2.创建构建目录
mkdir build && cd build
cmake ..
make

# 3.运行程序
./ai-text-adventure
