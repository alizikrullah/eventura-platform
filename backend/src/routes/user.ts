import { Router } from 'express'
import { auth } from '../middlewares/auth'
import { uploadProfilePhoto } from '../middlewares/upload'
import { getMe, updateMe, updateMyPassword, updateMyPhoto } from '../controllers/userController'

const router = Router()

router.use(auth)
router.get('/me', getMe)
router.patch('/me', updateMe)
router.patch('/me/password', updateMyPassword)
router.patch('/me/photo', uploadProfilePhoto, updateMyPhoto)

export default router
