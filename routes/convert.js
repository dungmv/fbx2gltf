const express = require('express');
const multer  = require('multer')
const crypto = require('crypto'); 
const fbx2gltf = require('../fbx2gltf');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(err, err ? undefined : raw.toString('hex') + ext)
    })
  }
})

const upload = multer({ storage: storage, fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext == '.fbx') {
    cb(null, true)
  } else {
    cb(new Error('File invalid'), false);
  }
}},)

router.post('/', upload.single('file'), function(req, res, next) {
  const srcFile = req.file.path;
  const destFile = `storage/${crypto.randomUUID()}.glb`;
  fbx2gltf(srcFile, `public/${destFile}`).then(() => {
    res.json({link: `/${destFile}`});
  }, next).catch(next)
});

module.exports = router;
