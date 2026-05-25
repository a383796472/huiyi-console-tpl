exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      code: 200,
      message: '上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('上传图片失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
