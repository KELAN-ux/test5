# 文件上传服务器

这是一个按国家和用户分类存储上传文件的Node.js服务器。

## 目录结构

上传的文件将按以下格式存储：
```
/uploads
   /id (印度尼西亚)
     /628123456789 (用户手机号)
       - id_card.jpg (身份证)
       - holding_id.jpg (手持身份证)
       - face_verification.jpg (人脸验证照片)
       - application_data.json (申请数据)
   /my (马来西亚)
   /th (泰国)
   /ph (菲律宾)
   /vn (越南)
```

## 安装与部署

1. **连接到您的服务器**

   ```bash
   ssh root@110.232.84.204
   ```

2. **安装Node.js和npm（如果尚未安装）**

   ```bash
   # Ubuntu/Debian系统
   curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
   apt-get install -y nodejs

   # CentOS/RHEL系统
   curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
   yum install -y nodejs
   ```

3. **创建项目目录**

   ```bash
   mkdir -p /root/file-upload-server
   cd /root/file-upload-server
   ```

4. **上传服务器文件**
   
   将`upload-server.js`和`package.json`文件上传到服务器，或直接在服务器上创建它们。

   ```bash
   # 创建上传目录
   mkdir -p uploads/{id,my,th,ph,vn}
   ```

5. **安装依赖**

   ```bash
   npm install
   ```

6. **使用PM2来持续运行服务**

   ```bash
   # 安装PM2
   npm install -g pm2

   # 用PM2启动服务
   pm2 start upload-server.js --name "file-upload-server"

   # 设置开机自启
   pm2 startup
   pm2 save
   ```

7. **配置防火墙（如果需要）**

   ```bash
   # 开放3000端口（取决于您的防火墙配置方式）
   ufw allow 3000
   ```

## 测试API

您可以使用以下命令测试API是否正常工作：

```bash
curl -X POST -F "country=id" -F "phoneNumber=628123456789" -F "idCard=@/path/to/test/image.jpg" http://localhost:3000/upload-documents
```

## 安全建议

1. 设置更强的密码
2. 使用HTTPS而不是HTTP
3. 添加API密钥验证
4. 定期备份上传的文件
5. 考虑将服务放在Nginx/Apache后面作为反向代理 