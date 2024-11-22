import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError}  from  "../utils/ApiError.js"
import {User} from "../modals/user.modal.js"
import {uploadOnCloudnary} from "../utils/cloudNery.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokans = async(userId)=>{
    try {
        const user = await User.findById(userId)
       const accessToken =    user.generateAccessToken()
       const refreshToken =   user.generateRefreshToken()

      user.refreshTokan = refreshToken
     await user.save({validateBeforeSave: false})

     return {accessToken, refreshToken}

    } catch (error) {
      throw new ApiError(500, "something went wrong while generating refresh and access token")  
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log("email", email);

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "all field are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const covarLocalPath = req.files?.covarImage?.[0]?.path || "";

    let covarLocalPath;
    if(req.files && Array.isArray(req.files.covarImage) && req.files.covarImage >0){
        covarLocalPath = req.files.covarImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudnary(avatarLocalPath);
    const covarImage = covarLocalPath ? await uploadOnCloudnary(covarLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        covarImage: covarImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (createUser) {
        throw new ApiError(500, "something went wrong");
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "user registered successfully")
    );
});


const loginUser = asyncHandler(async (req, res)=>{
  

 const { email, username, password} = req.body
  if(!username || !email){
    throw new ApiError(400, "username and email is required")
  }

const user = await User.findOne({
    $or: [{username}, {email}]
  })
  
  if(!user){
    throw new ApiError(404, "user not exsts")
  }

const isPasswordValid =  await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401, "password invalid")
  }

const {accessToken, refreshTokan} =  await generateAccessAndRefreshTokans(user._id)

const loggedUser = await user.findById(user._id)
select("-password -refreshToken" )

const options = {
    httpOnty: true,
    secure: true
}

return res.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshTokan, options )
.json(
    new ApiResponse(
        200, 
        {
            user: loggedUser, accessToken, refreshTokan
        },
        "user logged in successfully"
    )
)
})

const logoutUser = asyncHandler(async(req, res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
            {
                new: true
            }
        
    )
    const options = {
        httpOnty: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"))
})
export { registerUser, loginUser, logoutUser };

