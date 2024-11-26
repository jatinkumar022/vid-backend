import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`Connected Successfuly!, DB instance: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.error("Error while connecting Db :", error)
    process.exit(1)
  }
}