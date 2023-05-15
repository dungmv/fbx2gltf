const jwt = require('jsonwebtoken');
const jwtsecretKey = process.env.JWT_TOKEN_SECRET
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 * @returns 
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ').pop();

  if (token == null) return res.status(401).send();

  jwt.verify(token, jwtsecretKey, (err, user) => {
    if (err) return res.status(403).send();
    req.user = user
    next()
  })
}

module.exports = authenticateJWT;
