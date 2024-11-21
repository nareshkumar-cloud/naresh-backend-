import mongoose  from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async ()=>{
    try {
   const connetionInstance  =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  
   console.log(`\n MongoDB cannected DB HOST: ${connetionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB cannection error", error)
        process.exit(1)
    }
}

export default connectDB