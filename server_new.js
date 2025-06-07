const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

const app = express();
const port = 3000;

// è®¾ç½®ä¿å­˜ç›®å½•
const uploadDir = 'D:/LiaoZi/Indonesia';

// ç¡®ä¿ä¸Šä¼ ç›®å½•å­˜åœ¨
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// åˆ›å»ºä»Šæ—¥æ—¥æœŸç›®å½•
function getTodayDir() {
    const today = new Date();
    const dateString = format(today, 'yyyy-MM-dd');
    const todayDir = path.join(uploadDir, dateString);
    
    if (!fs.existsSync(todayDir)) {
        fs.mkdirSync(todayDir, { recursive: true });
    }
    
    return todayDir;
}

// é…ç½®æ–‡ä»¶å­˜å‚¨
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const todayDir = getTodayDir();
        cb(null, todayDir);
    },
    filename: function (req, file, cb) {
        // ä½¿ç”¨ç”µè¯å·ç å’Œæ—¶é—´æˆ³å‘½åæ–‡ä»¶
        const phone = req.body.phone || 'unknown';
        const timestamp = new Date().getTime();
        const fileType = req.body.type || 'file';
        const fileExt = path.extname(file.originalname);
        
        cb(null, `${phone}_${fileType}_${timestamp}${fileExt}`);
    }
});

const upload = multer({ storage: storage });

// ä¸­é—´ä»¶
app.use(cors()); // å…è®¸è·¨åŸŸè¯·æ±‚
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// æ–‡ä»¶ä¸Šä¼ è·¯ç”±
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'æ²¡æœ‰æ–‡ä»¶ä¸Šä¼ ' });
    }
    
    console.log('æ–‡ä»¶ä¸Šä¼ æˆåŠŸ:', req.file.path);
    res.json({ 
        success: true,
        filePath: req.file.path,
        fileName: req.file.filename
    });
});

// ä¿å­˜ç”³è¯·æ•°æ®è·¯ç”±
app.post('/saveApplication', (req, res) => {
    const applicationData = req.body;
    if (!applicationData) {
        return res.status(400).json({ error: 'æ²¡æœ‰ç”³è¯·æ•°æ®' });
    }
    
    const todayDir = getTodayDir();
    const phone = applicationData.phoneNumber || 'unknown';
    const timestamp = new Date().getTime();
    const filePath = path.join(todayDir, `${phone}_application_${timestamp}.json`);
    
    // å†™å…¥JSONæ–‡ä»¶
    fs.writeFileSync(filePath, JSON.stringify(applicationData, null, 2));
    
    console.log('ç”³è¯·æ•°æ®ä¿å­˜æˆåŠŸ:', filePath);
    res.json({ 
        success: true,
        filePath: filePath
    });
});

// å¯åŠ¨æœåŠ¡å™¨
app.listen(port, () => {
    console.log(`æœ¬åœ°æœåŠ¡å™¨å·²å¯åŠ¨ï¼Œç›‘å¬ç«¯å£ ${port}`);
    console.log(`æ–‡ä»¶å°†ä¿å­˜åˆ°: ${uploadDir}`);
}); 
