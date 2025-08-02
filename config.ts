import mongoose from "mongoose";

const Connection = async () => {
  try {
    await mongoose.connect(process.env.DBLINK!);
    console.log("connected to dataBase");
  } catch (e) {
    console.log(e);
  }
};
export default Connection;
