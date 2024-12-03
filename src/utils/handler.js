//utilits means this component is used in many places so we kept it in utils and import where ever we need

const handler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
    }

}

export {handler}
