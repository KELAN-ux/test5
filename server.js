const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();

// 环境变量配置
const PORT = process.env.PORT || 3000;
const STORAGE_BASE_DIR = process.env.STORAGE_BASE_DIR || 'D:\\LiaoZi\\Indonesia';

// 中间件配置
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// 创建文件存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            // 生成日期格式 YYYYMMDD
            const date = new Date();
            const dateStr = date.getFullYear().toString() +
                (date.getMonth() + 1).toString().padStart(2, '0') +
                date.getDate().toString().padStart(2, '0');
            
            // 确保基础目录存在
            if (!fs.existsSync(STORAGE_BASE_DIR)) {
                fs.mkdirSync(STORAGE_BASE_DIR, { recursive: true });
            }
            
            // 日期目录
            const dateDir = path.join(STORAGE_BASE_DIR, dateStr);
            if (!fs.existsSync(dateDir)) {
                fs.mkdirSync(dateDir);
            }
            
            // 获取当前日期目录下的所有文件夹
            const folders = fs.readdirSync(dateDir)
                .filter(f => fs.statSync(path.join(dateDir, f)).isDirectory())
                .map(f => parseInt(f.replace('visitor_', '')))
                .filter(n => !isNaN(n));
            
            // 计算新的访客编号
            const visitorNum = folders.length > 0 ? Math.max(...folders) + 1 : 1;
            const visitorDir = path.join(dateDir, `visitor_${visitorNum.toString().padStart(3, '0')}`);
            
            // 创建访客目录
            fs.mkdirSync(visitorDir);
            
            cb(null, visitorDir);
        } catch (error) {
            console.error('存储目录创建失败:', error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // 保持原始文件名，添加时间戳避免重名
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

// 文件过滤器，限制上传文件类型
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 配置上传限制
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制10MB
    }
});

// 处理文件上传
app.post('/upload', (req, res) => {
    upload.array('files')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // Multer 错误处理
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        message: '文件过大，最大限制为10MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: '文件上传错误',
                    error: err.message
                });
            }
            
            // 其他错误
            return res.status(500).json({
                success: false,
                message: '服务器错误',
                error: err.message
            });
        }
        
        // 成功处理
        res.json({
            success: true,
            message: '文件上传成功',
            files: req.files.map(file => ({
                filename: file.filename,
                path: file.path
            }))
        });
    });
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已在端口 ${PORT} 上启动`);
    console.log(`存储路径: ${STORAGE_BASE_DIR}`);
}); 