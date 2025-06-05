const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 设置跨域请求
app.use(cors());
app.use(express.json());

// 配置文件存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 从请求体中获取国家代码和电话号码
        const country = req.body.country || 'unknown';
        const phoneNumber = req.body.phoneNumber || 'anonymous';
        
        // 创建目录结构: /uploads/国家/手机号/
        const uploadDir = path.join(__dirname, 'uploads', country, phoneNumber);
        
        // 确保目录存在
        fs.mkdirSync(uploadDir, { recursive: true });
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 根据文件类型分配不同的文件名
        let fileName = '';
        
        switch (file.fieldname) {
            case 'idCard':
                fileName = 'id_card.jpg';
                break;
            case 'holdingId':
                fileName = 'holding_id.jpg';
                break;
            case 'selfie':
                fileName = 'face_verification.jpg';
                break;
            default:
                fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
        }
        
        cb(null, fileName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 最大10MB
        files: 5 // 最多5个文件
    },
    fileFilter: (req, file, cb) => {
        // 只接受图像文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图像文件'));
        }
    }
});

// 处理文件上传的路由
app.post('/upload-documents', upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'holdingId', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), (req, res) => {
    try {
        // 检查是否有上传的文件
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: '没有上传文件' });
        }
        
        // 获取用户信息
        const country = req.body.country || 'unknown';
        const phoneNumber = req.body.phoneNumber || 'anonymous';
        
        // 保存申请数据到同一目录
        const applicationData = {
            phoneNumber: req.body.phoneNumber,
            country: req.body.country,
            timestamp: Date.now(),
            files: Object.keys(req.files).map(fieldName => ({
                fieldName,
                filename: req.files[fieldName][0].filename,
                size: req.files[fieldName][0].size
            }))
        };
        
        // 保存应用数据到JSON文件
        const uploadDir = path.join(__dirname, 'uploads', country, phoneNumber);
        fs.writeFileSync(
            path.join(uploadDir, 'application_data.json'),
            JSON.stringify(applicationData, null, 2)
        );
        
        // 记录上传成功
        console.log(`用户 ${country}/${phoneNumber} 成功上传了 ${Object.keys(req.files).length} 个文件`);
        
        // 返回成功响应
        res.json({
            success: true,
            message: '文件上传成功',
            data: {
                country,
                phoneNumber,
                timestamp: applicationData.timestamp
            }
        });
        
    } catch (error) {
        console.error('上传处理错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理文件时出错'
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    if (err instanceof multer.MulterError) {
        // Multer错误处理
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件太大，最大允许10MB'
            });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '上传的文件太多'
            });
        }
    }
    
    // 默认错误处理
    res.status(500).json({
        success: false,
        message: '内部服务器错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`文件上传服务器运行在 http://localhost:${PORT}`);
    
    // 确保上传根目录存在
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // 创建国家子目录（如果不存在）
    ['id', 'my', 'th', 'ph', 'vn'].forEach(country => {
        const countryDir = path.join(uploadsDir, country);
        if (!fs.existsSync(countryDir)) {
            fs.mkdirSync(countryDir, { recursive: true });
        }
    });
    
    console.log(`文件将按国家和用户分类存储在 ${uploadsDir} 目录下`);
}); 