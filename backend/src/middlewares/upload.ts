import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Memory storage untuk profile photo (langsung upload ke Cloudinary)
const memoryStorage = multer.memoryStorage()

// Disk storage untuk event images (save locally first, then upload to Cloudinary)
const uploadDir = process.env.UPLOAD_DIR || './uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

// File filter - only images
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'))
    return
  }
  cb(null, true)
}

// Upload instance for profile photo (memory storage)
const uploadProfile = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
})

// Upload instance for event images (disk storage)
const uploadEvent = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
})

/**
 * Middleware untuk profile photo upload
 * Field name: 'photo'
 */
export const uploadProfilePhoto = uploadProfile.single('photo')

/**
 * Middleware untuk event image upload
 * Field name: 'image'
 */
export const uploadEventImage = uploadEvent.single('image')

/**
 * Helper untuk delete local file setelah upload ke Cloudinary
 */
export const deleteLocalFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}
