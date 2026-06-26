import mongoose from "mongoose";

const Connection = async () => {
   try {
    // Disable buffering so we get immediate errors if connection fails
    mongoose.set('bufferCommands', false); 
    
    await mongoose.connect(process.env.Mongo!);
    console.log(`Connected to Database: ${mongoose.connection.host}`);
  } catch (e) {
    console.error("CRITICAL: MongoDB Connection Failed!", e);
  }
};
export default Connection;
