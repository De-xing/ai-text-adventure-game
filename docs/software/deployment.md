# EchoQuest 回响 - Linux 云服务器部署指南

本文档说明如何把 EchoQuest 部署到 Linux 云服务器（以 Ubuntu 22.04 / Debian 12 为例；CentOS/RHEL 将 `apt` 换成 `dnf`）。内容包括部署架构、服务器准备、上线步骤、发布检查单、运维、回滚和常见问题。

> **适用版本：** EchoQuest v1.3（静态前端 + Python Agent API + OpenAI-compatible LLM）。
>
> **当前是原型架构，不是生产级多租户系统。** 作品、存档和结局保存在用户浏览器的 `localStorage`；服务器没有数据库，也没有账号、审核后台和跨设备分享。面向公众开放前，请先阅读第十章的边界和风险。

---

## 一、部署架构

```text
用户浏览器
   │  HTTP/HTTPS
   ▼
Nginx :80 / :443
   ├── /                  → /var/www/echoquest（index.html + assets）
   ├── /assets/*          → /var/www/echoquest/assets
   └── /api/*             → 127.0.0.1:8000（Python Agent API）
                              │
                              ├── .secrets/api.json（服务端 API Key）
                              └── https://api.deepseek.com（外部 LLM）
```

| 组件 | 当前实现 |
|---|---|
| 前端 | 原生 HTML/CSS/JS，Hash 路由，无 Node、无构建步骤 |
| 静态站点 | Nginx 直接托管 `/var/www/echoquest` |
| 后端 | Python 标准库 `ThreadingHTTPServer`，监听 `127.0.0.1:8000` |
| 反向代理 | Nginx，`/api/` 转发到后端 |
| 大模型 | OpenAI-compatible API，当前配置 `deepseek-chat` |
| 运行时依赖 | Python 3.10+，无第三方 Python 包 |
| 服务管理 | systemd：`echoquest.service` |
| 数据 | 浏览器 `localStorage`；服务端只保存 API Key，无数据库 |
| 限流 | 单进程内存计数；每个 IP 每个阶段每小时 8 次，全站每日 300 次模型调用 |
| 并发 | 最多 3 个上游模型请求同时执行 |

### 与“数据库型后端”部署的关键差异

| 项目 | EchoQuest |
|---|---|
| PostgreSQL / MySQL | **不需要**；当前没有数据库 |
| SQLite | 生产不需要；测试和本地数据在浏览器 |
| Node.js / npm | **不需要** |
| Python 虚拟环境 | 可不创建；只用标准库。若后续引入三方包再建 venv |
| 作品备份 | 没有服务端作品数据；清理浏览器数据即丢失作品 |
| 多 worker | **建议只运行 1 个进程**；限流、并发信号量都在进程内，多 worker 不共享 |
| 重启影响 | 重启会清空内存限流计数；不会中断已保存的前端作品（作品在用户浏览器） |

> **重要：** 当前后端没有用户作品数据库。部署完成后，A 用户生成的作品不会出现在 B 用户的浏览器里，也无法通过复制链接跨设备打开。若需要真正的分享/账号/作品库，需要先接入 PostgreSQL 和服务端作品存储，再按第十章扩展。

---

## 二、服务器规格与容量

### 规格建议

| 场景 | CPU | 内存 | 磁盘 | 说明 |
|---|---|---|---|---|
| 演示 / 小范围 | 1–2 核 | 2 GB | 20 GB SSD | Nginx + Python 足够；主要等待外部模型 |
| 公开演示 | 2 核 | 4 GB | 40 GB SSD | 建议加 WAF/限流，防止额度滥用 |
| 正式多人使用 | 4 核+ | 8 GB+ | 100 GB+ | 需要先补齐账号、数据库、审核和任务队列 |

### 资源说明

- 空闲内存占用很小（Python 服务约几十 MB），主要内存由操作系统、Nginx 和并发请求占用。
- 真正的瓶颈是**模型 API 延迟和额度**，不是 CPU。
- 当前没有大文件上传、没有视频转码、没有数据库写入，20 GB 磁盘足够演示。
- 如果后续加入 PostgreSQL 和作品持久化，磁盘、备份和连接数需要重新估算。

---

## 三、服务器环境准备

```bash
# 1. 基础软件
sudo apt update
sudo apt install -y git nginx python3 curl ufw

# 2. Python 版本：3.10 及以上
python3 --version

# 3. 目录
# /opt/echoquest       后端代码、server.py、.secrets
# /var/www/echoquest   Nginx 静态文件（index.html + assets）
sudo mkdir -p /opt/echoquest /var/www/echoquest
```

### 关于运行用户

统一使用系统已有的 `www-data`：

```bash
id www-data
```

不需要为演示环境新建用户。若企业规范要求专用账号，可创建 `echoquest` 用户，并把下文所有 `www-data` 替换为该用户。

### 端口规划

| 端口 | 用途 | 是否对公网开放 |
|---|---|---|
| 22 | SSH | 仅管理员来源 IP |
| 80 | HTTP | 是（或只开 443） |
| 443 | HTTPS | 有域名和证书时开放 |
| 8000 | Python Agent API | **否**，只监听 127.0.0.1 |
| 5432 | PostgreSQL | 当前不使用；将来也只对本机/内网 |

---

## 四、部署步骤

### 1. 获取代码

```bash
cd /opt
sudo git clone <your-repo-url> echoquest
cd /opt/echoquest
sudo git checkout <release-tag>       # 建议使用明确版本标签
git rev-parse HEAD                    # 记录 Commit SHA
```

如果 `/opt/echoquest` 已存在，改为：

```bash
cd /opt/echoquest
sudo git fetch --tags
sudo git checkout <release-tag>
```

> 不要把 `.secrets/api.json` 提交到 Git。仓库的 `.gitignore` 已包含 `.secrets/`。

### 2. 部署静态文件

Nginx 只读取 `/var/www/echoquest`：

```bash
sudo cp /opt/echoquest/index.html /var/www/echoquest/
sudo rm -rf /var/www/echoquest/assets
sudo cp -a /opt/echoquest/assets /var/www/echoquest/
sudo chown -R www-data:www-data /var/www/echoquest
sudo chmod -R u=rwX,go=rX /var/www/echoquest
```

验证：

```bash
ls -la /var/www/echoquest
test -f /var/www/echoquest/index.html && echo "index ok"
test -f /var/www/echoquest/assets/app.js && echo "assets ok"
```

### 3. 配置 API Key

**推荐：密钥只放在服务器 `.secrets/api.json`。**

```bash
sudo install -d -m 700 -o www-data -g www-data /opt/echoquest/.secrets
sudo tee /opt/echoquest/.secrets/api.json >/dev/null <<'EOF'
{
  "provider": "openai-compatible",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "apiKey": "<YOUR_API_KEY>"
}
EOF
sudo chown www-data:www-data /opt/echoquest/.secrets/api.json
sudo chmod 600 /opt/echoquest/.secrets/api.json
```

检查权限：

```bash
sudo ls -l /opt/echoquest/.secrets/api.json
# -rw------- 1 www-data www-data ... api.json
```

也可以使用环境变量覆盖（适合密钥管理系统或 systemd `EnvironmentFile`）：

```bash
ECHOQUEST_API_KEY=...
ECHOQUEST_BASE_URL=https://api.deepseek.com/v1
ECHOQUEST_MODEL=deepseek-chat
```

配置优先级：

```text
环境变量 > .secrets/api.json > 代码默认值
```

> 不要把 Key 写进 `index.html`、`assets/*.js`、Git、聊天记录、截图或发布日志。若 Key 曾泄露，立即到模型平台轮换。

### 4. systemd 托管后端

仓库已有：

```text
deploy/echoquest.service
```

安装：

```bash
sudo cp /opt/echoquest/deploy/echoquest.service /etc/systemd/system/echoquest.service
sudo systemctl daemon-reload
sudo systemctl enable --now echoquest
sudo systemctl status echoquest --no-pager
```

服务内容应类似：

```ini
[Unit]
Description=EchoQuest AI Agent proxy and static server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/echoquest
ExecStart=/usr/bin/python3 /opt/echoquest/server.py
Environment=ECHOQUEST_HOST=127.0.0.1
Environment=ECHOQUEST_PORT=8000
Environment=ECHOQUEST_RATE_LIMIT=8
Environment=ECHOQUEST_DAILY_LIMIT=300
Environment=PYTHONDONTWRITEBYTECODE=1
Restart=always
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/opt/echoquest
RestrictSUIDSGID=true

[Install]
WantedBy=multi-user.target
```

说明：

- `127.0.0.1:8000` 只允许本机 Nginx 访问，不对公网开放。
- `ReadOnlyPaths=/opt/echoquest` 防止服务进程修改代码；`.secrets/api.json` 仍然可读。
- 不要使用 `--workers` 启动多进程；当前限流和 `AI_SEMAPHORE` 都是进程内状态。
- 不要用 root 运行服务。

验证后端：

```bash
curl -sS http://127.0.0.1:8000/api/health
```

期望：

```json
{"ok":true,"ai":true,"model":"deepseek-chat","provider":"openai-compatible"}
```

`ai:true` 只代表**服务端检测到 API Key**，不代表上游模型此刻一定有额度；真实生成仍可能失败并触发前端本地降级。

### 5. 安装 Nginx 配置

仓库已有：

```text
deploy/nginx-echoquest.conf
```

安装：

```bash
sudo cp /opt/echoquest/deploy/nginx-echoquest.conf /etc/nginx/sites-available/echoquest
sudo ln -sfn /etc/nginx/sites-available/echoquest /etc/nginx/sites-enabled/echoquest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

配置核心：

```nginx
server {
    listen 80 default_server;
    server_name _;

    root /var/www/echoquest;
    index index.html;

    client_max_body_size 64k;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_send_timeout 180s;
        proxy_buffering off;
    }

    location /assets/ {
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

关键点：

- `/api/` 必须设置 `X-Real-IP` 和 `X-Forwarded-For`，否则所有用户会共用 Nginx 的来源 IP 计数，限流会很快被耗尽。
- `client_max_body_size 64k` 是 Nginx 上限；应用自身还有 **48 KB** 请求体上限，实际以前者中的更小值为准。
- `proxy_read_timeout 180s` 要大于服务端单次模型调用 150 秒；一次生成有架构和撰写两次调用，但它们是两个独立 HTTP 请求，各自计时。
- `proxy_buffering off` 对 SSE 不是必需的（当前是普通 JSON），保留也无害。
- 静态资源当前没有内容哈希文件名，Nginx 又缓存 7 天；**发布新版本后用户可能拿到旧 JS**。更新时需要改资源 URL 的版本参数，或缩短 `expires`，或让用户强制刷新。正式环境建议改为带哈希的文件名。
- `.secrets`、`server.py` 不应由 Nginx 静态目录暴露；Nginx 的 `root` 是 `/var/www/echoquest`，不要指向 `/opt/echoquest`。

### 6. 防火墙与云安全组

Ubuntu 本机：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

阿里云/腾讯云安全组入方向：

| 协议 | 端口 | 来源 | 说明 |
|---|---|---|---|
| TCP | 22 | 管理员固定 IP | 不要对 `0.0.0.0/0` 开放 |
| TCP | 80 | `0.0.0.0/0` | HTTP |
| TCP | 443 | `0.0.0.0/0` | 配置 HTTPS 后 |
| TCP | 8000 | 不开放 | 只监听 127.0.0.1 |
| TCP | 5432 | 不开放 | 当前无数据库 |

> 只开 80、不开 443 时，浏览器只能访问 `http://`。如果用户强制 HTTPS，会连接超时。

### 7. 域名和 HTTPS

#### 方案 A：直接用公网 IP

```text
http://<SERVER_IP>
```

适合短期演示，不需要域名和备案。缺点是没有 HTTPS，且 IP 不好记。

#### 方案 B：绑定域名

在 DNS 服务商添加 A 记录：

```text
echoquest.example.com  →  <SERVER_IP>
```

然后修改 Nginx：

```nginx
server_name echoquest.example.com;
```

重新加载：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

国内服务器注意事项：

- 域名解析到中国大陆服务器并提供 Web 服务，通常需要 **ICP 备案**；未备案可能被云厂商或运营商拦截。
- 使用 HTTPS 需要开放 443，并申请证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d echoquest.example.com
sudo certbot renew --dry-run
```

- 没有域名时，可以使用类似 `echoquest.<SERVER_IP>.sslip.io` 的通配 DNS 别名做临时演示；它**不是正式域名**，不提供 HTTPS，也不应作为长期生产入口。
- 当前演示机曾使用 `http://echoquest.<SERVER_IP>.sslip.io`；换服务器后 IP 变化，别名也要跟着变。

### 8. 首次验证

```bash
# 本机后端
curl -sS http://127.0.0.1:8000/api/health

# 经过 Nginx
curl -sS http://127.0.0.1/api/health

# 首页
curl -I http://127.0.0.1/

# 公网（把 IP 换成实际地址）
curl -I http://<SERVER_IP>/
```

浏览器验证：

1. 打开首页，确认发现页有 4 张故事卡。
2. 打开《雾港来信》，点击选项，确认能进入下一节点。
3. 进入「开始创作」，输入 10 字以上背景，确认能生成并进入工坊。
4. 生成页能看到 Agent 阶段和 token；如果失败，确认是否自动降级到本地引擎。
5. 手机宽度 375px 下确认无横向滚动。

---

## 五、发布检查单

### A. 发布准备

- [ ] 已确认版本标签和 Commit SHA
- [ ] 已在测试环境运行 `python -m unittest discover -s tests -v`，22 个测试通过
- [ ] 已确认 `server.py` 无语法错误：`python3 -m py_compile server.py`
- [ ] 已确认 `assets/`、`index.html`、`deploy/` 完整
- [ ] 已确认本次没有把 `.secrets`、日志、截图或本地测试数据带入发布目录
- [ ] 已确认发布负责人、验证负责人和发布窗口

### B. 配置检查

- [ ] `/opt/echoquest/.secrets/api.json` 存在，权限 `600`，属主 `www-data`
- [ ] Key 有效，服务器可访问模型接口（`curl -sI https://api.deepseek.com`）
- [ ] `baseUrl` 与 `model` 正确，未误用测试 Key
- [ ] `.secrets` 未被 Git 跟踪：`git check-ignore -v .secrets/api.json`
- [ ] 没有把 API Key 写入前端、README、日志或截图
- [ ] 服务以 `www-data` 运行，不以 root 运行
- [ ] `ECHOQUEST_HOST=127.0.0.1`，8000 未对公网开放
- [ ] 限流参数符合预期：`ECHOQUEST_RATE_LIMIT`、`ECHOQUEST_DAILY_LIMIT`

### C. 应用检查

- [ ] `systemctl status echoquest` 为 `active (running)`
- [ ] `curl -sS http://127.0.0.1:8000/api/health` 返回 `ok:true`
- [ ] 静态目录存在：`/var/www/echoquest/index.html`、`/var/www/echoquest/assets/app.js`
- [ ] Nginx `nginx -t` 通过
- [ ] `curl -sS http://127.0.0.1/api/health` 返回与后端一致
- [ ] 首页 `HTTP 200`，JS/CSS/SVG 资源 `HTTP 200`
- [ ] `.secrets` 通过公网访问返回 403/404，不返回文件内容
- [ ] 真实生成一次（会消耗额度）：确认 Agent 轨迹、节点数和结局数正常
- [ ] 断开 API 或把 Key 置空后，确认前端能降级到本地引擎
- [ ] 日志中没有 API Key、请求正文或异常堆栈

### D. 基础设施检查

- [ ] 安全组只开放 22（限制来源）、80、443
- [ ] UFW 规则与安全组一致
- [ ] DNS 已解析到服务器 IP（`dig <DOMAIN>`）
- [ ] 证书有效且自动续期（使用 HTTPS 时）
- [ ] 服务器时间同步：`timedatectl` 显示 `System clock synchronized: yes`
- [ ] 磁盘空间正常：`df -h`
- [ ] Nginx access/error 日志可读
- [ ] `systemctl is-enabled echoquest` 为 `enabled`
- [ ] 没有在服务器上保留旧的压缩包、测试截图或临时密钥

### E. 发布执行

- [ ] 记录当前线上 Commit SHA 和备份位置
- [ ] 保留上一版本代码目录或 Git tag，确认可回滚
- [ ] 拉取/复制新代码
- [ ] 更新静态文件：`index.html` 和整个 `assets/`
- [ ] 如果修改了 systemd 配置：`daemon-reload`
- [ ] 重启：`sudo systemctl restart echoquest`
- [ ] 等待 2–3 秒，确认 `/api/health` 正常
- [ ] 清理/禁用旧缓存策略，确认用户拿到新 JS（必要时加版本参数）
- [ ] 对外公告前完成一次完整生成验证

### F. 发布验证

- [ ] 首页无证书告警（HTTPS 时）
- [ ] 控制台无严重错误
- [ ] 发现页 4 张卡、示例故事可进入
- [ ] 创作页生成成功，进入工坊
- [ ] 工坊故事树显示节点和结局
- [ ] 游玩页选项可点击、存档可打开
- [ ] 预览模式不写 autosave
- [ ] 移动端 375×812 无横向滚动
- [ ] `/api/health` 的 `ai` 为 `true`（Key 已配置）
- [ ] API 失败时前端能降级，不白屏
- [ ] Nginx 无 502/504
- [ ] 没有新增 500 错误

### G. 发布完成

- [ ] 记录最终版本、Commit SHA、发布时间
- [ ] 更新 CHANGELOG
- [ ] 通知相关人员
- [ ] 保留上一版本和配置备份
- [ ] 确认回滚路径仍可用
- [ ] 归档发布记录

---

## 六、日常运维

### 健康检查

| 检查 | 命令 | 说明 |
|---|---|---|
| 服务存活 | `systemctl status echoquest` | 进程是否在运行 |
| 后端健康 | `curl -sS http://127.0.0.1:8000/api/health` | `ai` 表示 Key 是否配置，不探测模型额度 |
| Nginx 代理 | `curl -sS http://127.0.0.1/api/health` | 确认 `/api` 路由 |
| 首页 | `curl -I http://127.0.0.1/` | 静态文件是否可读 |
| 端口 | `ss -lntp \| grep -E ':80\|:8000'` | 8000 应只在 127.0.0.1 |
| 日志 | `journalctl -u echoquest -n 100 --no-pager` | 查看启动和请求错误 |

建议监控：

- `/api/health` 每分钟探测，连续 3 次失败告警。
- Nginx 5xx、上游超时、429 数量。
- 磁盘使用率（当前无数据库，主要是日志）。
- 模型 API 额度/成功率（在模型平台配置）。
- 内存和进程重启次数。

### 限流调整

默认：

```text
每个 IP 每个 Agent 阶段每小时 8 次
全站每日 300 次模型调用
最多 3 个并发上游请求
```

修改 systemd：

```bash
sudo systemctl edit echoquest
```

```ini
[Service]
Environment=ECHOQUEST_RATE_LIMIT=6
Environment=ECHOQUEST_DAILY_LIMIT=200
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart echoquest
```

注意：

- 限流在**进程内存**中，重启后清零；多实例之间不共享。
- 一个生成流程通常调用 2 次模型（架构 + 撰写），修复时可能第 3 次；限流按阶段计数，不是按“故事”计数。
- 当前没有账号体系，无法按用户配额；面向公众时应加 WAF、登录或服务端配额。

### 日志

```bash
# 应用日志
sudo journalctl -u echoquest -f

# Nginx
sudo tail -f /var/log/nginx/echoquest.access.log
sudo tail -f /var/log/nginx/echoquest.error.log
```

不要把完整请求体、API Key 或用户隐私写进日志。当前服务只记录路径、状态和脱敏错误。

### 停止与重启

```bash
sudo systemctl stop echoquest
sudo systemctl start echoquest
sudo systemctl restart echoquest
```

重启会中断正在进行的模型请求；前端会收到失败并降级或提示重试。

---

## 七、更新与回滚

### 更新代码

```bash
cd /opt/echoquest
sudo git fetch --tags
sudo git checkout <new-tag>

# 更新静态文件
sudo cp index.html /var/www/echoquest/
sudo rm -rf /var/www/echoquest/assets
sudo cp -a assets /var/www/echoquest/
sudo chown -R www-data:www-data /var/www/echoquest

# 如果 systemd/nginx 配置有变化
sudo cp deploy/echoquest.service /etc/systemd/system/echoquest.service
sudo cp deploy/nginx-echoquest.conf /etc/nginx/sites-available/echoquest
sudo systemctl daemon-reload
sudo nginx -t && sudo systemctl reload nginx

sudo systemctl restart echoquest
curl -sS http://127.0.0.1:8000/api/health
```

> 静态资源带 7 天缓存，且文件名没有哈希。更新后用户可能仍使用旧 JS。发布时给 `index.html` 的脚本加版本查询参数（例如 `assets/app.js?v=<commit>`），或把 `expires` 调短，或要求用户强制刷新。

### 回滚代码

```bash
cd /opt/echoquest
sudo git checkout <previous-tag>
sudo cp index.html /var/www/echoquest/
sudo rm -rf /var/www/echoquest/assets
sudo cp -a assets /var/www/echoquest/
sudo systemctl restart echoquest
curl -sS http://127.0.0.1:8000/api/health
```

当前没有数据库，所以不需要数据库回滚；作品在用户浏览器中，服务端回滚不会删除它们。

### 配置备份

```bash
sudo tar -czf /root/echoquest-config-$(date +%F).tar.gz \
  /etc/systemd/system/echoquest.service \
  /etc/nginx/sites-available/echoquest
```

`.secrets/api.json` 单独保存在密码管理器或加密介质中，不要放进普通备份压缩包发给他人。

---

## 八、安全与数据边界

### 已实现的保护

- API Key 只在服务器，浏览器不接触。
- Nginx 拒绝 `.secrets` 等隐藏路径。
- 后端限制请求体 48 KB、同源检查、IP 限流、并发限制。
- 错误信息脱敏；日志不输出 Key。
- 前端使用 HTML 转义；模型输出不执行 `eval`。
- systemd 使用非 root 用户，限制系统目录写入。

### 仍然存在的风险

- **没有账号和鉴权**：任何能访问公网的人都能调用生成接口，消耗你的模型额度。
- **没有服务端作品存储**：作品只在用户浏览器，无法跨设备；换浏览器等于丢失。
- **没有内容审核中台**：只有提示词约束；公开运营需要输入/输出审核、举报和下架。
- **没有 PII 自动脱敏**：用户输入的背景会发送给模型供应商；隐私政策需说明。
- **限流是单机内存**：重启清零，无法跨实例；公网高流量需要 WAF/网关。
- **HTTP 无加密**：不配置域名和 HTTPS 时，内容明文传输。
- **无审计后台**：没有管理员操作日志、生成记录和用户配额。

### 生产前至少要做

1. 配置域名和 HTTPS（大陆服务器还要 ICP 备案）。
2. 增加账号、作品持久化和服务端配额。
3. 增加内容审核和 PII 脱敏。
4. 把限流和并发改为 Redis 或网关统一管理。
5. 增加 WAF/云防火墙，限制异常流量。
6. 定期轮换 API Key，并监控额度。

---

## 九、常见问题

| 现象 | 可能原因 | 处理 |
|---|---|---|
| 502 Bad Gateway | Python 服务没启动、崩溃，或 8000 端口不对 | `systemctl status echoquest`；`curl 127.0.0.1:8000/api/health`；`journalctl -u echoquest -n 100` |
| 首页 404 | Nginx `root` 不是 `/var/www/echoquest`，或静态文件未复制 | 检查 `nginx -T`、`ls /var/www/echoquest/index.html` |
| 首页正常，JS 404 | `assets` 没有复制或权限不对 | `ls -l /var/www/echoquest/assets/app.js`；重新 `cp -a assets` |
| `/api/health` 404 | Nginx 没加载站点或 `default` 站点抢占 | `nginx -t`；检查 `sites-enabled`；重载 |
| 403 Forbidden | Origin/Host 不匹配，或 Nginx 隐藏路径规则 | 看 Nginx/后端日志；确认 `Host` 和页面同源；确认使用正确域名/IP |
| 413 Request Entity Too Large | 请求体超过 Nginx 64 KB 或后端 48 KB | 缩短背景；不要超过 2000 字；如确需更大，同时调整 Nginx 和应用上限 |
| 429 Too Many Requests | 单 IP 阶段限流、日额度或并发占满 | 等一小时/明天，或调整 `ECHOQUEST_RATE_LIMIT`；检查是否有共享 IP |
| 504 Gateway Timeout | 模型响应超过 Nginx 180 秒 | 检查上游；增加 `proxy_read_timeout`，但不要无限大；前端会降级 |
| `ai:false` | `.secrets` 未配置、路径错误、权限不对 | 看 `journalctl`；确认 `www-data` 可读；确认 JSON 合法 |
| 页面能开，生成总是本地模板 | `/api/health` 不可用或 Key 失效 | 打开 Network 看 `/api/health`；检查 Key 和额度 |
| 生成失败但页面没白屏 | 前端本地降级生效 | 查看生成页 Agent 轨迹和错误提示；必要时重试 |
| `file://` 打开没有 Agent | 本地文件没有后端和同源 `/api` | 使用 `server.py` 启动或在线地址；单文件只适合离线演示 |
| 修改 JS 后用户仍看到旧版 | Nginx 缓存 `assets` 7 天，文件名无哈希 | 加 `?v=<commit>`；缩短缓存；强制刷新 |
| 公网 IP 打不开 | 安全组/UFW 未放行 80，或 Nginx 未监听 | 检查安全组、`ss -lntp`、`curl 127.0.0.1` |
| HTTPS 打不开 | 443 未放行或证书未配置 | 开 443；`certbot`；`nginx -t` |
| 域名打不开但 IP 可以 | DNS 未解析、备案/云拦截、Nginx `server_name` | `dig`；检查 DNS 和备案；`curl -H 'Host: <domain>'` |
| 日志出现 `[REDACTED]` 但内容异常 | 错误脱敏逻辑命中了 Key 或旧版本 bug | 升级到修复版；检查 `_sanitize_error` |

---

## 十、当前能力边界与后续扩展

### 当前不做

- 不做账号注册、登录、权限和付费。
- 不做服务端作品库、跨设备分享、评论和审核后台。
- 不做 PostgreSQL、Redis、消息队列和向量数据库。
- 不做多人实时协作。
- 不把 API Key 放进前端或单文件 HTML。

### 如果要变成真正的多人产品

建议按以下顺序演进：

1. **持久化**：FastAPI + PostgreSQL + 对象存储，保存用户、作品、节点、存档和版本。
2. **鉴权与配额**：账号、JWT、按用户限额，替代单 IP 内存限流。
3. **审核与隐私**：输入/输出审核、PII 脱敏、举报和下架。
4. **异步任务**：生成任务队列，支持取消、重试、进度和断点恢复。
5. **可观测性**：结构化日志、requestId、模型调用成本、错误率、P95 延迟。
6. **HTTPS 与域名**：证书、WAF、CDN、ICP 合规。

---

## 十一、最终发布检查卡

- **发布前**：测试通过、依赖确认、Key 只在服务器、`.secrets` 权限 600、静态文件已更新、Nginx 配置通过、备份和回滚路径确认。
- **发布中**：`/api/health` 为 `200`、首页 `200`、静态资源无 404、Nginx 无 502/504、真实生成成功一次。
- **发布后**：首页/创作/工坊/游玩无严重错误、移动端无横向滚动、Agent 失败可降级、日志无 Key、监控和告警正常。

> **部署不是一次 `git pull`，而是可重复、可验证、可回滚的流程。** 当前项目的底线是：API Key 不泄露、服务只监听本机、`.secrets` 不可公网访问、失败能降级到本地引擎。
