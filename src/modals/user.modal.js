import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        usename:{
            type: String,
            required: true,
            unique: true,
            lowarcase: true,
            trim: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowarcase: true,
            trim: true,
        },
        fullname:{
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
         type: String,
         required: true,

        },
        covarImage:{
        type: String
        },
        watchHistrory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshTokan:{
            type: String
        }
    },{
        timestamps: true
    }
)

userSchema.pre("save", async function(next){
    if(this.isModifired("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function(password) {
   return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id:this._id,
            email: this.email,
            usename: this.usename,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id:this._id,
            email: this.email,
            usename: this.usename,
            fullname: this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)