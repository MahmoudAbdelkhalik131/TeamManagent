import jwt from "jsonwebtoken";
class Tokens {
  private buildAuthPayload(payload: any) {
    return {
      _id: payload?._id,
      email: payload?.email,
      username: payload?.username,
      role: payload?.role,
    };
  }

  createToken(payload: any) {
    const expire: any = process.env.JWT_EXPIRE_DATE;
    return jwt.sign({ user: this.buildAuthPayload(payload) }, process.env.JWT_SECRET_KEY!, {
      expiresIn: expire,
    });
  }
  createVerificationToken(payload: any) {
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
    return jwt.sign({ user: { _id: user?._id } }, process.env.JWT_SECRET!, { expiresIn: expire });
  };
  verifyTokenCode = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
  };
}

const Token = new Tokens();
export default Token;
