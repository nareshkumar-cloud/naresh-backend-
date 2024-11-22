import { User } from "../modals/user.modal";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"



export const verifyJWT = asyncHandler(async(req, res, next)=>{
 try {
    const token =  req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer", "")

 if(!token){
    throw new ApiError(401, "unathorized requst")
 }

 const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

const user = await User.findById(decodedToken?._id)
 .select("-password _refreshToken")

 if(!user){
    throw new ApiError(401, "invalid Access Token")
 }
 req.user = user;
 next()


 } catch (error) {
    throw new ApiError(401, "error?.message" || "Invalid access token")
 }

}) 