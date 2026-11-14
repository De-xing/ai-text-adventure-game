# EchoQuest 公网部署

> API Key 只放在服务器 `.secrets/api.json`，不要提交到 Git，也不要打包进网页。

## 目录约定

```text
/opt/echoquest/          服务端程序、前端源码、.secrets/api.json
/var/www/echoquest/      Nginx 对外提供的静态文件
```

## 1. 上传文件

把项目包上传到服务器后：

```bash
sudo mkdir -p /opt/echoquest /var/www/echoquest
sudo cp -r EchoQuest/* /opt/echoquest/
sudo cp index.html /var/www/echoquest/
sudo cp -r assets /var/www/echoquest/
```

`.secrets/api.json` 只放在 `/opt/echoquest/.secrets/api.json`：

```json
{
  "provider": "openai-compatible",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "apiKey": "你的 API Key"
}
```

```bash
sudo mkdir -p /opt/echoquest/.secrets
sudo chown -R www-data:www-data /opt/echoquest/.secrets
sudo chmod 700 /opt/echoquest/.secrets
sudo chmod 600 /opt/echoquest/.secrets/api.json
```

## 2. 启动 Agent 服务

```bash
sudo cp deploy/echoquest.service /etc/systemd/system/echoquest.service
sudo systemctl daemon-reload
sudo systemctl enable --now echoquest
sudo systemctl status echoquest --no-pager
curl -s http://127.0.0.1:8000/api/health
```

应返回：

```json
{"ok":true,"ai":true,"model":"deepseek-chat","provider":"openai-compatible"}
```

## 3. 配置 Nginx

```bash
sudo cp deploy/nginx-echoquest.conf /etc/nginx/sites-available/echoquest
sudo ln -sf /etc/nginx/sites-available/echoquest /etc/nginx/sites-enabled/echoquest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 4. 阿里云安全组

入方向放行：

- TCP 80：`0.0.0.0/0`
- 如需 HTTPS：TCP 443（配置证书后再放行）

然后访问：

```text
http://你的公网IP
```

## 5. 更新前端

```bash
sudo cp index.html /var/www/echoquest/
sudo cp -r assets/* /var/www/echoquest/assets/
sudo systemctl restart echoquest
```

## 限流

默认每个 IP 每个 Agent 步骤每小时 8 次，全站每日 300 次模型调用，可通过环境变量调整：

```bash
sudo systemctl edit echoquest
```

```ini
[Service]
Environment=ECHOQUEST_RATE_LIMIT=6
Environment=ECHOQUEST_DAILY_LIMIT=200
```
