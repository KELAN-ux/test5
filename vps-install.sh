#!/bin/bash

# 颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 无颜色

# 脚本标题
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}     DaiKuang文件存储服务器安装脚本          ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""

# 检查是否具有root权限
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用root权限运行此脚本${NC}"
  echo "运行: sudo bash $0"
  exit 1
fi

# 系统更新
echo -e "${YELLOW}[1/7] 更新系统...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}"

# 安装Node.js
echo -e "${YELLOW}[2/7] 安装Node.js...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt install -y nodejs git
  echo -e "${GREEN}✓ Node.js 安装完成:${NC} $(node -v)"
else
  echo -e "${GREEN}✓ Node.js 已安装:${NC} $(node -v)"
fi

# 创建存储目录
echo -e "${YELLOW}[3/7] 创建文件存储目录...${NC}"
mkdir -p /var/www/uploads
chmod 755 /var/www/uploads
echo -e "${GREEN}✓ 存储目录创建完成${NC}"

# 询问用户非root运行服务
echo ""
read -p "您希望使用非root用户运行服务吗? (y/n): " nonroot
if [[ "$nonroot" =~ ^[Yy]$ ]]; then
  read -p "请输入用户名: " username
  if id "$username" &>/dev/null; then
    chown $username:$username /var/www/uploads
    echo -e "${GREEN}✓ 目录权限更改为 ${username}${NC}"
  else
    echo -e "${RED}用户 ${username} 不存在，保持root权限${NC}"
  fi
fi

# 询问API密钥
echo ""
echo -e "${YELLOW}[4/7] 配置API密钥...${NC}"
read -p "请设置API密钥 (留空将生成随机密钥): " api_key
if [ -z "$api_key" ]; then
  api_key=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  echo -e "${GREEN}已生成随机API密钥: ${api_key}${NC}"
fi

# 配置环境变量
echo -e "${YELLOW}[5/7] 创建环境变量文件...${NC}"
cat > .env << EOF
PORT=3001
STORAGE_BASE_DIR=/var/www/uploads
API_SECRET_KEY=${api_key}
EOF
echo -e "${GREEN}✓ 环境变量配置完成${NC}"

# 安装PM2
echo -e "${YELLOW}[6/7] 安装PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2安装完成${NC}"

# 询问是否配置防火墙
echo ""
read -p "是否配置UFW防火墙以开放3001端口? (y/n): " configure_ufw
if [[ "$configure_ufw" =~ ^[Yy]$ ]]; then
  apt install -y ufw
  ufw allow ssh
  ufw allow 3001/tcp
  ufw --force enable
  echo -e "${GREEN}✓ 防火墙配置完成${NC}"
fi

# 询问是否安装Nginx
echo ""
read -p "是否安装Nginx作为反向代理? (y/n): " install_nginx
if [[ "$install_nginx" =~ ^[Yy]$ ]]; then
  apt install -y nginx
  systemctl enable nginx
  systemctl start nginx
  
  read -p "请输入域名 (例如: storage.example.com): " domain_name
  if [ -z "$domain_name" ]; then
    domain_name="localhost"
  fi
  
  # 创建Nginx配置
  cat > /etc/nginx/sites-available/file-storage << EOF
server {
    listen 80;
    server_name ${domain_name};

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # 文件上传大小限制
        client_max_body_size 15M;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/file-storage /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo -e "${GREEN}✓ Nginx配置完成${NC}"
  
  # 询问是否配置SSL
  read -p "是否配置SSL (需要域名指向此服务器)? (y/n): " configure_ssl
  if [[ "$configure_ssl" =~ ^[Yy]$ ]]; then
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d ${domain_name} --non-interactive --agree-tos --email admin@${domain_name}
    echo -e "${GREEN}✓ SSL配置完成${NC}"
  fi
fi

# 安装完成
echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}     安装完成！                             ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "文件存储目录: ${YELLOW}/var/www/uploads${NC}"
echo -e "API密钥: ${YELLOW}${api_key}${NC}"
echo -e "请将此密钥设置到Vercel项目的环境变量中: ${YELLOW}VPS_API_KEY${NC}"
echo ""
echo -e "如果您安装了Nginx:"
echo -e "Vercel项目中的VPS_API_URL应设置为: ${YELLOW}http://${domain_name}/api/upload${NC}"
echo ""
echo -e "开始文件存储服务:"
echo -e "${YELLOW}cd ~/test03 && pm2 start file-storage-server.js --name \"file-storage-server\"${NC}"
echo -e "设置PM2自启动:"
echo -e "${YELLOW}pm2 startup && pm2 save${NC}"
echo ""
echo -e "${GREEN}感谢使用本安装脚本！${NC}"
echo "" 