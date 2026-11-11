// 订单文件上传中间件（内存存储，供导入接口解析后直接写库）
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  defParamCharset: 'utf8', // 中文文件名按 UTF-8 解析，避免乱码
  limits: { fileSize: 30 * 1024 * 1024, files: 20 }
});

const orderUpload = (req, res, next) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? '单个文件不能超过 30MB'
        : err.code === 'LIMIT_FILE_COUNT'
          ? '一次最多上传 20 个文件'
          : err.message || '文件上传失败';
      return res.status(400).json({ code: 400, message });
    }
    next();
  });
};

module.exports = orderUpload;
