#!/bin/bash
# 服务器文件部署脚本

# 请将服务器IP和密码替换成您自己的
SERVER_IP="110.232.84.204"
SERVER_USER="root"

# 创建远程目录
echo "正在创建远程目录..."
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p /root/file-upload-server/uploads/{id,my,th,ph,vn}"

# 上传文件
echo "正在上传文件到服务器..."
scp upload-server.js package.json ${SERVER_USER}@${SERVER_IP}:/root/file-upload-server/

# 安装依赖
echo "正在安装依赖..."
ssh ${SERVER_USER}@${SERVER_IP} "cd /root/file-upload-server && npm install"

# 安装PM2
echo "正在安装和配置PM2..."
ssh ${SERVER_USER}@${SERVER_IP} "npm install -g pm2"

# 启动服务
echo "正在启动服务..."
ssh ${SERVER_USER}@${SERVER_IP} "cd /root/file-upload-server && pm2 start upload-server.js --name 'file-upload-server' && pm2 save"

# 配置开机自启
echo "配置开机自启..."
ssh ${SERVER_USER}@${SERVER_IP} "pm2 startup"

# 开放防火墙端口
echo "配置防火墙..."
ssh ${SERVER_USER}@${SERVER_IP} "ufw allow 3000 || firewall-cmd --zone=public --add-port=3000/tcp --permanent && firewall-cmd --reload"

echo "部署完成！服务器应该现在已经启动在 http://${SERVER_IP}:3000" 