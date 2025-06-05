# VPS文件存储服务器部署指南

本文档指导您如何在VPS上部署文件存储服务器，以配合Vercel上的DaiKuang项目使用。

## 系统要求

- Node.js >= 14.x
- npm >= 6.x
- 至少1GB RAM

## 部署步骤

### 1. 准备服务器环境

登录到您的VPS后，更新系统并安装Node.js:

```bash
# 对于Ubuntu/Debian系统
sudo apt update
sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs git

# 检查Node.js版本
node -v
npm -v
```

### 2. 创建存储目录

```bash
sudo mkdir -p /var/www/uploads
sudo chmod 755 /var/www/uploads
# 如果使用Node.js非root用户运行，需要修改权限
sudo chown your-username:your-username /var/www/uploads
```

### 3. 克隆项目到VPS

```bash
cd ~
git clone https://github.com/KELAN-ux/test03.git
cd test03
npm install
```

### 4. 配置环境变量

创建环境变量文件:

```bash
cat > .env << EOF
PORT=3001
STORAGE_BASE_DIR=/var/www/uploads
API_SECRET_KEY=your-secret-api-key-change-this
EOF
```

注意：请使用安全的API密钥，并确保与Vercel项目中设置的`VPS_API_KEY`相同。

### 5. 使用PM2启动服务

安装PM2并启动服务:

```bash
# 安装PM2
npm install -g pm2

# 启动文件存储服务器
pm2 start file-storage-server.js --name "file-storage-server"

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置防火墙

打开服务器端口:

```bash
# 对于使用UFW的系统
sudo ufw allow 3001/tcp
sudo ufw status
```

### 7. 配置Nginx (可选但推荐)

如果您希望使用域名和HTTPS，可以安装Nginx作为反向代理:

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# 配置Nginx反向代理
sudo nano /etc/nginx/sites-available/file-storage
```

添加以下配置:

```nginx
server {
    listen 80;
    server_name storage.yourdomain.com;  # 替换为您的域名

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 文件上传大小限制
        client_max_body_size 15M;
    }
}
```

启用站点:

```bash
sudo ln -s /etc/nginx/sites-available/file-storage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 添加SSL (推荐)

使用Certbot添加SSL:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d storage.yourdomain.com
```

### 9. 更新Vercel环境变量

在Vercel项目设置中，更新以下环境变量:

- `VPS_API_URL`: 设为`https://storage.yourdomain.com/api/upload`或者`http://your-vps-ip:3001/api/upload`
- `VPS_API_KEY`: 设置为与VPS上相同的API密钥

## 测试

您可以使用以下命令测试文件上传:

```bash
curl -X POST -H "Authorization: Bearer your-secret-api-key" \
  -F "dateStr=20250605" \
  -F "visitorId=001" \
  -F "files=@/path/to/test-image.jpg" \
  http://localhost:3001/api/upload
```

## 故障排除

### 1. 检查服务状态

```bash
pm2 status
pm2 logs file-storage-server
```

### 2. 检查文件权限

```bash
ls -la /var/www/uploads
```

### 3. 检查网络连接

```bash
curl -v http://localhost:3001/api/health
```

### 4. 查看磁盘空间

```bash
df -h
```

## 维护

### 1. 定期清理旧文件

创建自动清理脚本(可选):

```bash
cat > /usr/local/bin/clean-uploads.sh << 'EOF'
#!/bin/bash
find /var/www/uploads -type f -mtime +30 -delete
find /var/www/uploads -type d -empty -delete
EOF

chmod +x /usr/local/bin/clean-uploads.sh

# 添加到crontab
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/clean-uploads.sh") | crontab -
```

### 2. 更新应用

```bash
cd ~/test03
git pull
npm install
pm2 restart file-storage-server
``` 