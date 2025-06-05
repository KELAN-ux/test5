const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const axios = require('axios');
const FormData = require('form-data');
const os = require('os');

// 环境变量配置
const PORT = process.env.PORT || 3000;
const LOCAL_TEMP_DIR = process.env.LOCAL_TEMP_DIR || path.join(os.tmpdir(), 'uploads');
const VPS_API_URL = process.env.VPS_API_URL || 'http://your-vps-ip:3001/api/upload';
const VPS_API_KEY = process.env.VPS_API_KEY || 'your-secret-api-key-change-this';

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

// 确保临时目录存在
if (!fs.existsSync(LOCAL_TEMP_DIR)) {
    fs.mkdirSync(LOCAL_TEMP_DIR, { recursive: true });
}

// 创建临时文件存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, LOCAL_TEMP_DIR);
    },
    filename: function (req, file, cb) {
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

// 生成日期和访客ID
const generateDateAndVisitorId = () => {
    // 生成日期格式 YYYYMMDD
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');

    // 为简单起见，使用时间戳的后6位作为访客ID
    const visitorId = Date.now().toString().slice(-6).padStart(3, '0');
    
    return { dateStr, visitorId };
};

// 处理文件上传并转发到VPS
app.post('/upload', (req, res) => {
    upload.array('files')(req, res, async (err) => {
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

        try {
            // 生成日期和访客ID
            const { dateStr, visitorId } = generateDateAndVisitorId();

            // 创建FormData对象将文件转发到VPS
            const formData = new FormData();
            formData.append('dateStr', dateStr);
            formData.append('visitorId', visitorId);

            // 添加所有文件到formData
            req.files.forEach(file => {
                formData.append('files', fs.createReadStream(file.path), file.originalname);
            });

            // 发送到VPS服务器
            const response = await axios.post(VPS_API_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${VPS_API_KEY}`
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });

            // 删除临时文件
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('临时文件删除失败:', file.path, err);
                });
            });

            // 返回VPS服务器的响应
            return res.status(response.status).json(response.data);
        } catch (error) {
            console.error('VPS文件上传失败:', error);
            
            // 删除临时文件
            if (req.files) {
                req.files.forEach(file => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('临时文件删除失败:', file.path, err);
                    });
                });
            }

            return res.status(500).json({
                success: false,
                message: 'VPS文件上传失败',
                error: error.message
            });
        }
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
    console.log(`临时文件存储路径: ${LOCAL_TEMP_DIR}`);
    console.log(`VPS API URL: ${VPS_API_URL}`);
}); 