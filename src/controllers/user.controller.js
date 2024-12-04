import {handler} from "../utils/handler.js";

const registerUser = handler(async (req,res ) => {
    res.status(200).json({
        message:"ok"
    })
})


export {registerUser}