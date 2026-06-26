const PIXELCUT_BASE_URL = "https://api.developer.pixelcut.ai";

function requirePixelcutKey() {
  if (!process.env.PIXELCUT_API_KEY) {
    const error = new Error("Chưa cấu hình PIXELCUT_API_KEY.");
    error.statusCode = 503;
    throw error;
  }
}

function normalizeImageUrl(url) {
  if (!url) return url;

  // Cloudinary allows dynamic format conversion by changing the file extension.
  // We change .webp to .png since Pixelcut does not support fetching/processing .webp images.
  const lowerUrl = url.toLowerCase();
  if (url.includes("cloudinary.com")) {
    if (lowerUrl.endsWith(".webp")) {
      return url.substring(0, url.length - 5) + ".png";
    }
    if (lowerUrl.includes(".webp")) {
      return url.replace(/\.webp($|\?)/i, ".png$1");
    }
  }
  return url;
}

function validateUrl(value, fieldName) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch {
    const error = new Error(`${fieldName} phải là URL ảnh công khai hợp lệ.`);
    error.statusCode = 400;
    throw error;
  }
}

export async function createTryOn({ personImageUrl, garmentImageUrl, removeBackground = false }) {
  requirePixelcutKey();

  const normalizedPerson = normalizeImageUrl(personImageUrl);
  const normalizedGarment = normalizeImageUrl(garmentImageUrl);

  const person_image_url = validateUrl(normalizedPerson, "personImageUrl");
  const garment_image_url = validateUrl(normalizedGarment, "garmentImageUrl");

  const response = await fetch(`${PIXELCUT_BASE_URL}/v1/try-on`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.PIXELCUT_API_KEY
    },
    body: JSON.stringify({
      person_image_url,
      garment_image_url,
      preprocess_garment: "true",
      remove_background: removeBackground ? "true" : "false",
      wait_for_result: "true"
    })
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Pixelcut Try On thất bại.");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}
