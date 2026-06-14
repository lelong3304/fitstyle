import { v2 as cloudinary } from "cloudinary";

function requireCloudinaryConfig() {
  if (!process.env.CLOUDINARY_URL) {
    const error = new Error("Chưa cấu hình CLOUDINARY_URL.");
    error.statusCode = 503;
    throw error;
  }

  const parsed = new URL(process.env.CLOUDINARY_URL);

  cloudinary.config({
    cloud_name: parsed.hostname,
    api_key: decodeURIComponent(parsed.username),
    api_secret: decodeURIComponent(parsed.password),
    secure: true
  });
}

function uploadBuffer(file, folder) {
  requireCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

export async function uploadTryOnImage(file, kind) {
  if (!file) return null;

  const result = await uploadBuffer(file, `fitstyle-ai/try-on/${kind}`);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}
