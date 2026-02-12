import jwt from "jsonwebtoken";
import Users from "../Users/user.interface";
class Tokens {
  createToken(payload: any) {
    const expire: any = process.env.JWT_EXPIRE_DATE;
    return jwt.sign({ user: payload }, process.env.JWT_SECRET_KEY!, {
      expiresIn: expire,
    });
  }
  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET_KEY!);
  }
  createTokenCode = (user: any) => {
    const expire: any = process.env.JWT_EXPIRES_IN_CODE!;
    return jwt.sign({ user }, process.env.JWT_SECRET!, { expiresIn: expire });
  };
  verifyTokenCode = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
  };
}

const Token = new Tokens();
export default Token;
