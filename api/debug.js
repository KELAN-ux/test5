export default function handler(req, res) { res.status(200).json({ success: true, message: "Debug API工作正常", method: req.method, timestamp: new Date().toISOString() }); }
