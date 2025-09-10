const authorisation = (role_array) => {
    return (req, res, next) => {
        const userRole = req.body.role;
        console.log("User role from request:", userRole);
        console.log("Allowed roles:", role_array);
        
        if (!userRole) {
            return res.status(401).json({ "msg": "Role not found in request" });
        }
        
        if (role_array.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ "msg": "You are not authorized to perform this action" });
        }
    }
}

module.exports = { authorisation }