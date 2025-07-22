import jwt from 'jsonwebtoken'
import Users from '../Users/user.interface'
class Tokens{
      createToken(payload:Users){
        const expire:any=process.env.JWT_EXPIRE_DATE 
      return jwt.sign({payload},process.env.JWT_SECRET_KEY!,{expiresIn:expire})
    }
    verifyToken(token:string,){
        jwt.verify(token,process.env.JWT_SECRET_KEY!)
    }
}
const Token=new Tokens()
export default Token