import {Router} from "express"
import { loginUser, logoutUser, regiterUser } from "../controllers/user.js"
import { upload } from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/Auth.js"

const router = Router()

router.route("/register").post(
    upload.fields([
  {
    name: "avatar",
    maxCount: 1
  },
  {
    name: "covarImage",
    maxCount: 1
  }
    ]),
    regiterUser)
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

export default router