const asyncHandler = (requstHander)=>{
    (req, res, next)=>{
        Promise.resolve(requstHander(req, res, next)).catch((err)=>
        next(err)
        )
            
    }
}

export {asyncHandler}

// const asyncHandler = (fn) =>async(req, res, next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 5000).json({
//          message: error.message,
//         success: false
//         })
        
//     }
// }