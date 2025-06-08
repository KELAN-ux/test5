# DaiKuang 阿里云OSS集成配置指南

## 🚀 OSS集成已完成的功能

### ✅ 已实现的特性：
1. **阿里云OSS SDK集成** - 使用官方JavaScript SDK
2. **直接前端上传** - 无需中转服务器，直接上传到OSS
3. **智能文件管理** - 按国家和用户自动分文件夹
4. **元数据支持** - 添加文件类型、国家、手机号等元数据
5. **错误处理** - 完善的错误捕获和用户提示
6. **多文件类型支持** - 身份证、手持身份证、人脸验证照片

### 📁 文件存储结构：
```
daikuang-documents/
├── applications/
│   ├── id/          # 印度尼西亚
│   │   └── 628123456789/     # 用户手机号
│   │       └── 1703123456789/    # 时间戳
│   │           ├── id_card_front.jpg
│   │           ├── holding_id_card.jpg
│   │           └── face_verification.jpg
│   ├── my/          # 马来西亚
│   ├── th/          # 泰国
│   ├── ph/          # 菲律宾
│   └── vn/          # 越南
```

## 🔧 OSS配置步骤

### 1. 创建阿里云OSS Bucket
1. 登录阿里云控制台：https://oss.console.aliyun.com/
2. 创建Bucket：
   - **Bucket名称**: `daikuang-documents` (或自定义)
   - **区域**: `新加坡 (oss-ap-southeast-1)` (推荐，适合东南亚用户)
   - **读写权限**: 私有 (推荐) 或 公共读
   - **版本控制**: 关闭
   - **服务端加密**: AES256 (推荐)

### 2. 创建AccessKey
1. 访问：https://ram.console.aliyun.com/users
2. 创建RAM用户，授权OSS权限
3. 生成AccessKey ID和Secret
4. **安全建议**: 使用STS临时凭证而非永久AccessKey

### 3. 配置跨域(CORS)
在OSS控制台设置CORS规则：
```json
{
  "AllowedOrigins": ["https://test5-apqj.vercel.app", "https://yourdomain.com"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "x-oss-version-id"],
  "MaxAgeSeconds": 300
}
```

### 4. 更新代码配置
在 `index.html` 中找到以下配置并替换：

```javascript
const ossConfig = {
    region: 'oss-ap-southeast-1',           // 您的OSS区域
    accessKeyId: 'YOUR_ACCESS_KEY_ID',      // 替换为您的AccessKeyId  
    accessKeySecret: 'YOUR_ACCESS_KEY_SECRET', // 替换为您的AccessKeySecret
    bucket: 'daikuang-documents',           // 替换为您的Bucket名称
    stsToken: '', // 如果使用STS临时凭证
};
```

## 🛡️ 安全建议

### 生产环境安全配置：

1. **使用STS临时凭证**：
```javascript
// 推荐：通过后端API获取临时凭证
async function getSTSToken() {
    const response = await fetch('/api/sts-token');
    return await response.json();
}

// 使用临时凭证初始化OSS
const stsData = await getSTSToken();
const client = new OSS({
    region: 'oss-ap-southeast-1',
    accessKeyId: stsData.AccessKeyId,
    accessKeySecret: stsData.AccessKeySecret,
    stsToken: stsData.SecurityToken,
    bucket: 'daikuang-documents'
});
```

2. **Bucket策略**：
```json
{
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "oss:PutObject",
                "oss:PutObjectAcl"
            ],
            "Resource": "acs:oss:*:*:daikuang-documents/applications/*",
            "Condition": {
                "StringLike": {
                    "oss:ExistingObjectTag/upload-type": [
                        "id-card",
                        "holding-id", 
                        "face-verification"
                    ]
                }
            }
        }
    ],
    "Version": "1"
}
```

## 📊 功能测试清单

- [ ] OSS Bucket创建完成
- [ ] AccessKey配置正确
- [ ] CORS规则设置完成
- [ ] 身份证上传测试
- [ ] 手持身份证上传测试  
- [ ] 人脸验证上传测试
- [ ] 多语言界面测试
- [ ] 移动端响应式测试
- [ ] 文件元数据检查

## 🔗 相关链接

- [阿里云OSS控制台](https://oss.console.aliyun.com/)
- [OSS JavaScript SDK文档](https://help.aliyun.com/document_detail/64041.html)
- [Vercel部署地址](https://test5-apqj.vercel.app/)

## 💡 后续优化建议

1. **后端API集成** - 将申请数据发送到后端数据库
2. **文件处理** - 添加图像压缩和格式转换
3. **安全增强** - 实现STS临时凭证服务
4. **监控告警** - 设置OSS访问监控和费用告警
5. **备份策略** - 配置跨区域备份 