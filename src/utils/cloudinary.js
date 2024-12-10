import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {

  try {
    if (!localFilePath) return null
    //upload file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // File has been uploaded successfully
    console.log("File is uploaded on cloudinary", response);
    fs.unlinkSync(localFilePath)   //Remove the locally saved temp file

    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)   //Remove the locally saved temp file
    return null
  }
}

const deleteOldImage = async (oldImagePath) => {
  try {
    if (!oldImagePath) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    return null
  }
}

export { uploadOnCloudinary, deleteOldImage }