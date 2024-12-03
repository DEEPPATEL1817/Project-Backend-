class ApiError extends Error {
    constructor(
        statusCode,
        message="Something is going wrong",
        errors=[],
        stack =""
        //stack is message of multiple messages
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.error=errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}


export{ApiError}

// this is a node error api handling 