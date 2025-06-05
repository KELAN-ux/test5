const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

const app = express();
const port = 3000;

// 设置保存目录
const uploadDir = 'D:/LiaoZi/Indonesia';

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 创建今日日期目录
function getTodayDir() {
    const today = new Date();
    const dateString = format(today, 'yyyy-MM-dd');
    const todayDir = path.join(uploadDir, dateString);
    
    if (!fs.existsSync(todayDir)) {
        fs.mkdirSync(todayDir, { recursive: true });
    }
    
    return todayDir;
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const todayDir = getTodayDir();
        cb(null, todayDir);
    },
    filename: function (req, file, cb) {
        // 使用电话号码和时间戳命名文件
        const phone = req.body.phone || 'unknown';
        const timestamp = new Date().getTime();
        const fileType = req.body.type || 'file';
        const fileExt = path.extname(file.originalname);
        
        cb(null, `${phone}_${fileType}_${timestamp}${fileExt}`);
    }
});

const upload = multer({ storage: storage });

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '没有文件上传' });
    }
    
    console.log('文件上传成功:', req.file.path);
    res.json({ 
        success: true,
        filePath: req.file.path,
        fileName: req.file.filename
    });
});

// 保存申请数据路由
app.post('/saveApplication', (req, res) => {
    const applicationData = req.body;
    if (!applicationData) {
        return res.status(400).json({ error: '没有申请数据' });
    }
    
    const todayDir = getTodayDir();
    const phone = applicationData.phoneNumber || 'unknown';
    const timestamp = new Date().getTime();
    const filePath = path.join(todayDir, `${phone}_application_${timestamp}.json`);
    
    // 写入JSON文件
    fs.writeFileSync(filePath, JSON.stringify(applicationData, null, 2));
    
    console.log('申请数据保存成功:', filePath);
    res.json({ 
        success: true,
        filePath: filePath
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`本地服务器已启动，监听端口 ${port}`);
    console.log(`文件将保存到: ${uploadDir}`);
}); 