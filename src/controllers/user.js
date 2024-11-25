import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError}  from  "../utils/ApiError.js"
import {User} from "../modals/user.modal.js"
import {uploadOnCloudnary} from "../utils/cloudNery.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

// This function generates and returns an access token and refresh token for a given user ID
const generateAccessAndRefreshTokans = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessTokan = user.generateAccessTokan();
        const refreshTokan = user.generateRefreshTokan();

        user.refreshTokan = refreshTokan;
        await user.save({ validateBeforeSave: false });

        return { accessTokan, refreshTokan };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

// This function handles user registration, including validating input, checking for existing users, and storing user data in the database
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log("email", email);

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let covarLocalPath;
    if (req.files && Array.isArray(req.files.covarImage) && req.files.covarImage.length > 0) {
        covarLocalPath = req.files.covarImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudnary(avatarLocalPath);
    const covarImage = covarLocalPath ? await uploadOnCloudnary(covarLocalPath) : null;

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        covarImage: covarImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createUser) {
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered successfully")
    );
});

// This function handles user login by verifying credentials, generating tokens, and returning user data
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessTokan, refreshTokan } = await generateAccessAndRefreshTokans(user._id);

    const loggedUser = await User.findById(user._id).select("-password -refreshTokan");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res.status(200)
        .cookie("accessTokan", accessTokan, options)
        .cookie("refreshTokan", refreshTokan, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedUser, accessTotan, refreshTokan },
                "User logged in successfully"
            )
        );
});

// This function logs out the user by clearing their tokens and removing the refresh token from the database
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshTokan: undefined } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

// This function handles refreshing the access token using a valid refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshTokan = req.cookies.refreshTokan || req.body.refreshTokan;

    if (!incomingRefreshTokan) {
        throw new ApiError(401, "Unauthorized, refresh token required");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshTokan,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshTokan !== user?.refreshTokan) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessTokan, newrefreshTokan } = await generateAccessAndRefreshTokans(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessTokan, options)
            .cookie("refreshtokan", newrefreshTokan, options)
            .json(
                new ApiResponse(
                    200,
                    { accessTokan, refreshTokan: newrefreshTokan },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPaaword} = req.body

  const user = await User.findById(req.user?._id)
 const isPasswordCarrect =  await user.isPasswordCorrect(oldPassword)

 if(!isPasswordCarrect){
    throw new ApiError(400, "invalid password")
 }

 user.password = newPaaword
 await user.save({validateBeforeSave: false})

 return res.status(200)
 .json(new ApiResponse(200, {}, "password changed successfully"))
})


const getCurrectUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "currect user fetched successfylly")

})

const updateAccountDetails = asyncHandler (async (req, res)=>{
    const {fullname, email} = req.body
    
    if(!fullname || email){
        throw new ApiError(400, "all fields are required")
    }

 const user =   User.findByIdAndUpdate(
        req.user?._id,
        {
       $set: {
        fullname,
        email
       }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserAvater = asyncHandler(async(req, res)=>{
   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is mising")
   }

  const avatar =  await uploadOnCloudnary(avatarLocalPath)
  if(avatar.url){
    throw new ApiError(400, "Eroor while uploading on avatar")
  }
const user = await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}
).select("-password")

return res
.status(200)
.json(
   new ApiResponse(200, user, "Avatar updated successfully")
)

})

const updateUserCovarImage = asyncHandler(async(req, res)=>{
    const covarImageLocalPath =  req.file?.path
 
    if(!covarImageLocalPath){
     throw new ApiError(400,"cavarImage file is mising")
    }
 
   const covarImage =  await uploadOnCloudnary(covarImageLocalPathLocalPath)
   if(covarImage.url){
     throw new ApiError(400, "Eroor while uploading on covarImage")
   }
const user = await User.findByIdAndUpdate(
     req.user._id,
     {
         $set:{
             covarImage: covarImage.url
         }
     },
     {new: true}
 ).select("-password")
 

 return res
 .status(200)
 .json(
    new ApiResponse(200, user, "covarImage updated successfully")
 )
 })

const getUserChannaelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params

  if(username?.trim()){
    throw new ApiError(400, "username is mising")
  }

const channel = await User.aggregate([
    {
        $match: {
            username: username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from: "subsciptions",
            localField: "_id",
            foreignField : "channel",
            as: "subscibers"
        }
    },
    {
        $lookup: {
            from: "subsciptions",
            localField: "_id",
            foreignField : "subsciber",
            as: "subscibersTo"
        } 
        
    },
    {
        $addFields:{
            subsciberCount: {
                $size: "subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscibersTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subsciberCount: 1,
            channelSubscribedToCount: 1,
            avatar: 1,
            covarImage: 1,
            email: 1
        }
    }
])


if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
}

return res
.status(200)
.json(
    new ApiResponse(200, channel[0], "user channel fetched succesfully")
)
})

const getWatchHistory = asyncHandler(async(req, res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "wstchHistoty",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner" ,
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

return res
.status(200)
.json(
    new ApiResponse(200, user[0].watchHistory, "watch history fetched succesfully")
)
})


// Exporting the functions for use in other parts of the application
export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrectUser,changeCurrentPassword,
    updateUserAvater,updateUserCovarImage,updateAccountDetails, getUserChannaelProfile, getWatchHistory};


