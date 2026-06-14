import { bodyShapeOptions } from "./catalog.js";

const allowedShapeKeys = bodyShapeOptions.map((shape) => shape.key);

export async function extractProductFromUrl(productUrl) {
  if (!isHttpUrl(productUrl)) {
    const error = new Error("Link Shopee khong hop le.");
    error.statusCode = 400;
    throw error;
  }

  const metadata = await fetchProductMetadata(productUrl);
  const aiProduct = process.env.GEMINI_API_KEY ? await inferProductWithGemini(metadata) : null;
  const fallbackProduct = inferProductWithRules(metadata);

  return {
    ...fallbackProduct,
    ...removeEmptyFields(aiProduct || {}),
    affiliateUrl: productUrl,
    sourceUrl: metadata.finalUrl || productUrl,
    imageUrl: aiProduct?.imageUrl || fallbackProduct.imageUrl || metadata.imageUrl || ""
  };
}

async function fetchProductMetadata(productUrl) {
  try {
    const response = await fetch(productUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
      }
    });

    const html = await response.text();
    return {
      inputUrl: productUrl,
      finalUrl: response.url || productUrl,
      title: cleanTitle(readMeta(html, "og:title") || readMeta(html, "twitter:title") || readTitle(html)),
      description: readMeta(html, "og:description") || readMeta(html, "description") || "",
      imageUrl: readMeta(html, "og:image") || readMeta(html, "twitter:image") || "",
      price: extractPrice(html)
    };
  } catch {
    return {
      inputUrl: productUrl,
      finalUrl: productUrl,
      title: "",
      description: "",
      imageUrl: "",
      price: ""
    };
  }
}

async function inferProductWithGemini(metadata) {
  const model = process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = `Bạn là stylist và admin catalog cho web FitStyle AI.

Từ metadata sản phẩm Shopee bên dưới, hãy tạo JSON sản phẩm để lưu MongoDB.
Chỉ trả về JSON hợp lệ, không markdown.

Allowed bodyShapeTags: ${allowedShapeKeys.join(", ")}
Allowed gender: unisex, male, female

Quy tắc:
- name ngắn gọn bằng tiếng Việt.
- category là nhóm sản phẩm phổ biến: Áo thun, Áo sơ mi, Áo khoác, Quần dài, Quần short, Chân váy, Váy, Giày, Phụ kiện.
- bodyShapeTags chọn 1-4 dáng phù hợp nhất.
- reason phải giải thích vì sao món này hợp các dáng đó.
- Nếu thiếu thông tin, suy luận bảo thủ từ tên sản phẩm.

Metadata:
title=${metadata.title}
description=${metadata.description}
imageUrl=${metadata.imageUrl}
price=${metadata.price}

JSON schema:
{
  "name": "",
  "brand": "Shopee",
  "category": "",
  "gender": "unisex",
  "price": "",
  "imageUrl": "",
  "bodyShapeTags": [],
  "styleTags": [],
  "occasionTags": [],
  "colors": [],
  "fit": "",
  "reason": ""
}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return safeJsonParse(text);
}

function inferProductWithRules(metadata) {
  const sourceText = `${metadata.title} ${metadata.description}`.toLowerCase();
  const category = inferCategory(sourceText);
  const gender = inferGender(sourceText);
  const bodyShapeTags = inferBodyShapeTags(sourceText, category);

  return {
    name: metadata.title || "",
    brand: "Shopee",
    category,
    gender,
    price: metadata.price || "",
    imageUrl: metadata.imageUrl || "",
    bodyShapeTags,
    styleTags: inferStyleTags(sourceText),
    occasionTags: ["đi học", "đi chơi"],
    colors: inferColors(sourceText),
    fit: inferFit(sourceText),
    reason: inferReason(category, bodyShapeTags)
  };
}

function inferCategory(text) {
  if (/(quần|pants|jean|kaki|trouser)/i.test(text)) return "Quần dài";
  if (/(short|quần đùi)/i.test(text)) return "Quần short";
  if (/(chân váy|skirt)/i.test(text)) return "Chân váy";
  if (/(váy|đầm|dress)/i.test(text)) return "Váy";
  if (/(sơ mi|shirt)/i.test(text)) return "Áo sơ mi";
  if (/(khoác|jacket|blazer|cardigan|hoodie)/i.test(text)) return "Áo khoác";
  if (/(giày|shoe|sneaker)/i.test(text)) return "Giày";
  if (/(túi|belt|thắt lưng|phụ kiện|accessory)/i.test(text)) return "Phụ kiện";
  return "Áo thun";
}

function inferGender(text) {
  if (/(nữ|woman|women|female|girl)/i.test(text)) return "female";
  if (/(nam|men|male|boy)/i.test(text)) return "male";
  return "unisex";
}

function inferBodyShapeTags(text, category) {
  if (/(oversize|boxy|form rộng|rộng)/i.test(text)) return ["slim", "rectangle", "balanced"];
  if (/(cạp cao|nhấn eo|chiết eo|croptop)/i.test(text)) return ["hourglass", "rectangle", "triangle"];
  if (/(ống rộng|wide|suông|straight)/i.test(text)) return ["inverted_triangle", "triangle", "oval", "balanced"];
  if (/(cổ v|v-neck|v neck)/i.test(text)) return ["oval", "inverted_triangle", "balanced"];
  if (category === "Chân váy" || category === "Váy") return ["hourglass", "triangle", "rectangle", "balanced"];
  if (category === "Áo khoác") return ["slim", "rectangle", "oval", "balanced"];
  return ["balanced"];
}

function inferStyleTags(text) {
  const tags = [];
  if (/(basic|trơn|plain)/i.test(text)) tags.push("basic");
  if (/(korean|hàn quốc)/i.test(text)) tags.push("korean");
  if (/(street|oversize|boxy)/i.test(text)) tags.push("street");
  if (/(sơ mi|blazer|formal|công sở)/i.test(text)) tags.push("smart casual");
  return tags.length ? tags : ["casual"];
}

function inferColors(text) {
  const colors = ["đen", "trắng", "xám", "be", "kem", "nâu", "xanh", "hồng"].filter((color) => text.includes(color));
  return colors;
}

function inferFit(text) {
  if (/(oversize|form rộng|rộng)/i.test(text)) return "Oversize vừa";
  if (/(slim|ôm|body)/i.test(text)) return "Ôm vừa cơ thể";
  if (/(straight|suông)/i.test(text)) return "Straight fit";
  if (/(wide|ống rộng)/i.test(text)) return "Ống rộng vừa";
  return "Regular fit";
}

function inferReason(category, bodyShapeTags) {
  if (bodyShapeTags.includes("slim")) return "Tạo thêm độ dày thị giác và giúp dáng mảnh nhìn cân đối hơn.";
  if (bodyShapeTags.includes("rectangle")) return "Giúp tạo điểm nhấn tỉ lệ và làm dáng thẳng bớt đơn điệu.";
  if (bodyShapeTags.includes("triangle")) return "Giúp cân bằng phần hông và tạo tổng thể gọn hơn.";
  if (bodyShapeTags.includes("inverted_triangle")) return "Giúp cân bằng phần vai rộng bằng cách tăng độ nặng thị giác cho phần dưới.";
  if (bodyShapeTags.includes("oval")) return "Form gọn và đường nét đơn giản giúp tổng thể nhẹ, dễ mặc hơn.";
  return `${category} dễ phối, phù hợp nhiều dáng người và dùng tốt cho tủ đồ cơ bản.`;
}

function readMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function readTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s*\|\s*Shopee.*$/i, "")
    .replace(/\s*-\s*Shopee.*$/i, "")
    .trim();
}

function extractPrice(html) {
  const patterns = [
    /"price"\s*:\s*"?([0-9.]+)"?/i,
    /"price_min"\s*:\s*([0-9]+)/i,
    /₫\s?([0-9.,]+)/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return formatPrice(match[1]);
  }

  return "";
}

function formatPrice(rawValue) {
  const digits = String(rawValue).replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.length > 6 ? String(Math.round(Number(digits) / 100000)) : digits;
  return `${Number(normalized).toLocaleString("vi-VN")}đ`;
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function removeEmptyFields(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (Array.isArray(item)) return item.length > 0;
      return item !== null && item !== undefined && item !== "";
    })
  );
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
