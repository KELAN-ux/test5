module.exports = (req, res) => { res.status(200).json({ success: true, message: "文件上传成功（模拟）", timestamp: new Date().toISOString() }); };
