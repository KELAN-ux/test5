const fs = require('fs'); console.log('脚本开始执行'); let content = fs.readFileSync('public/index.html', 'utf8'); console.log('文件读取成功，长度:', content.length); console.log('修复完成！');
