import multer from 'multer'

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }

    cb(null, true)
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
})

export const uploadProfilePhoto = upload.single('photo')
