import {Router} from "express"
import { changeCurrentPassword,
         getCurrectUser,
         getUserChannaelProfile,
         getWatchHistory,
         loginUser,
         logoutUser,
         refreshAccessToken,
         regiterUser,
         updateAccountDetails,
         updateUserAvater,
         updateUserCovarImage } from "../controllers/user.js"
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
router.route("/refresh_token".post(refreshAccessToken))
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrectUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails )
router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvater)
router.route("/covarImage").patch(verifyJWT, upload.single("covarImage"),updateUserCovarImage)
router.route("/c/:username").get(verifyJWT, getUserChannaelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router