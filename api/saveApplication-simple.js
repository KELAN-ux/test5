module.exports = (req, res) => { res.status(200).json({ success: true, message: "申请保存成功（模拟）", timestamp: new Date().toISOString() }); };
