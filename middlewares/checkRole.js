const checkRole = (roles) => {
    return (req, res, next) => {
        if(roles.includes(req.user.role)){
            next()
        }else{
            res.status(403).json({message:"You are not allowed to access this resource"})
        }
    }
}

module.exports = checkRole