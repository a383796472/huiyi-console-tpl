// 订单导入控制器：上传文件 → 解析 → 直接写入当前环境数据库
const { importCendFiles, importB2bFiles } = require('../services/order-import.service');

const RANGES = ['today', 'month', 'all'];
const normalizeRange = (v) => (RANGES.includes(v) ? v : 'today');

exports.importCend = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ code: 400, message: '请选择要导入的订单文件' });
    }
    const range = normalizeRange(req.body.range);
    const data = await importCendFiles(files, range);

    const failed = data.files.filter((f) => f.error);
    if (!data.total && failed.length === data.files.length) {
      return res.status(400).json({
        code: 400,
        message: failed[0].error || '文件解析失败',
        data
      });
    }
    res.status(200).json({ code: 200, message: '导入完成', data });
  } catch (error) {
    console.error('C端订单导入失败：', error);
    res.status(500).json({ code: 500, message: '导入失败：' + error.message });
  }
};

exports.importB2b = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ code: 400, message: '请选择要导入的订单文件' });
    }
    const range = normalizeRange(req.body.range);
    const data = await importB2bFiles(files, range);

    const failed = data.files.filter((f) => f.error);
    if (!data.orders && failed.length === data.files.length) {
      return res.status(400).json({
        code: 400,
        message: failed[0].error || '文件解析失败',
        data
      });
    }
    res.status(200).json({ code: 200, message: '导入完成', data });
  } catch (error) {
    console.error('B端订单导入失败：', error);
    res.status(500).json({ code: 500, message: '导入失败：' + error.message });
  }
};
