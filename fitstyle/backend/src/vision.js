const BODY_SHAPE_KEYS = [
  "slim",
  "balanced",
  "curvy",
  "rectangle",
  "pear",
  "inverted_triangle",
  "hourglass"
];

function fallbackShapeFromProfile(profile) {
  const heightM = Number(profile.heightCm) / 100;
  const bmi = Number(profile.weightKg) / (heightM * heightM);

  if (bmi < 18.5) return "slim";
  if (bmi >= 25) return "curvy";
  return "balanced";
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function buildVisionPrompt(profile) {
  return `Analyze this full-body photo for a Vietnamese FitStyle app.

Return ONLY valid JSON. No markdown.

Allowed bodyShape values:
slim, balanced, curvy, rectangle, pear, inverted_triangle, hourglass.

Rules:
- Do not identify the person.
- Do not estimate exact body fat percentage, muscle percentage, measurements, health condition, or attractiveness from the image.
- Only infer visible body shape, posture/outfit fit, rough silhouette, and photo quality.
- Explicitly judge whether the current outfit suits the detected body shape.
- Be respectful, practical, and concise.
- If the photo is not full-body or is too unclear, lower confidence and explain why.
- Outfit score must be strict, not generous:
  0-3 = poor fit or impossible to judge from a bad photo.
  4-5 = has clear problems in fit, proportion, color harmony, or occasion.
  6-7 = normal/acceptable; this should be the default for a decent but ordinary outfit.
  8 = good; outfit clearly suits the body shape with only minor issues.
  9 = excellent; strong fit, proportion, color harmony, and context.
  10 = exceptional/stylist-level; use very rarely, only if every criterion is outstanding.
- Judge these criteria: fit, body proportion, color harmony, context/occasion, and whether it flatters the detected body shape.
- Do not give 9-10 just because the outfit is neat or acceptable.

User data:
age=${profile.age}, gender=${profile.gender}, heightCm=${profile.heightCm}, weightKg=${profile.weightKg}, chestCm=${profile.chestCm || "unknown"}, waistCm=${profile.waistCm || "unknown"}, hipCm=${profile.hipCm || "unknown"}, goal=${profile.goal}.

JSON schema:
{
  "bodyShape": "one allowed value",
  "detailedBodyShape": {
    "label": "Vietnamese detailed body type, e.g. Hình chữ nhật, Tam giác ngược V-shape, Hình thang Trapezoid, Hình tam giác, Hình bầu dục, Đồng hồ cát, Quả lê",
    "description": "Vietnamese explanation based on visible shoulder-waist-hip proportions"
  },
  "confidence": 0.0,
  "photoQuality": "short Vietnamese sentence",
  "observations": ["3-4 Vietnamese observations about silhouette/proportion/outfit fit"],
  "outfitFit": {
    "level": "good | okay | not_ideal | unclear",
    "score": 0,
    "summary": "Vietnamese sentence answering whether the outfit suits this body shape"
  },
  "outfitFeedback": "Vietnamese outfit feedback if clothes are visible, otherwise say not enough outfit detail"
}`;
}

function normalizeVisionResult(parsed, profile, source) {
  const bodyShape = BODY_SHAPE_KEYS.includes(parsed?.bodyShape)
    ? parsed.bodyShape
    : fallbackShapeFromProfile(profile);

  const outfitLevel = parsed?.outfitFit?.level || "unclear";
  const outfitSummary = parsed?.outfitFit?.summary || "Chưa đủ thông tin để kết luận bộ đồ có hợp dáng hay không.";
  const outfitFeedback = parsed?.outfitFeedback || "Chưa có nhận xét outfit từ ảnh.";
  const outfitScore = normalizeOutfitScore(parsed?.outfitFit?.score, outfitLevel, outfitSummary, outfitFeedback);

  return {
    source,
    bodyShape,
    detailedBodyShape: {
      label: parsed?.detailedBodyShape?.label || null,
      description: parsed?.detailedBodyShape?.description || null
    },
    confidence: Math.min(Math.max(Number(parsed?.confidence) || 0.65, 0), 1),
    photoQuality: parsed?.photoQuality || "Chưa đánh giá được chất lượng ảnh.",
    observations: Array.isArray(parsed?.observations) ? parsed.observations.slice(0, 4) : [],
    outfitFit: {
      level: outfitLevel,
      score: outfitScore,
      summary: outfitSummary
    },
    outfitFeedback,
    note: "AI chỉ suy luận dáng người từ ảnh, không chẩn đoán y tế và không ước tính body fat bằng mắt thường."
  };
}

function normalizeOutfitScore(rawScore, level, summary, feedback) {
  const numericScore = Number(rawScore);
  if (!Number.isFinite(numericScore)) return null;

  let score = Math.min(Math.max(Math.round(numericScore), 0), 10);
  const text = `${summary || ""} ${feedback || ""}`.toLowerCase();
  const hasStrongPraise = /(xuất sắc|rất tốt|rất phù hợp|nổi bật|hài hòa|tôn dáng rõ|chuyên nghiệp|stylist|excellent|outstanding)/i.test(text);
  const hasIssue = /(chưa|nhưng|nên|có thể|hơi|thiếu|không|cần|ordinary|acceptable|minor|unclear)/i.test(text);

  if (level === "unclear") return Math.min(score, 5);
  if (level === "not_ideal") return Math.min(score, 6);
  if (level === "okay") return Math.min(Math.max(score, 6), 7);
  if (level === "good" && score >= 9 && (!hasStrongPraise || hasIssue)) return 8;
  if (score === 10 && !hasStrongPraise) return 8;

  return score;
}

function getFallbackResult(file, profile) {
  if (!file) {
    return {
      source: "no_photo",
      bodyShape: fallbackShapeFromProfile(profile),
      detailedBodyShape: {
        label: null,
        description: null
      },
      confidence: 0.35,
      photoQuality: "Chưa có ảnh toàn thân.",
      observations: ["Hệ thống đang suy luận tạm thời từ BMI vì chưa có ảnh."],
      outfitFit: {
        level: "unclear",
        score: null,
        summary: "Chưa có ảnh nên chưa thể đánh giá bộ đồ đang mặc."
      },
      outfitFeedback: "Hãy upload ảnh toàn thân rõ sáng, chụp thẳng người để AI nhận xét outfit tốt hơn.",
      note: "Chưa có ảnh nên kết quả dáng người chỉ là fallback từ BMI."
    };
  }

  return {
    source: "demo_fallback",
    bodyShape: fallbackShapeFromProfile(profile),
    detailedBodyShape: {
      label: null,
      description: null
    },
    confidence: 0.45,
    photoQuality: "Đã nhận ảnh, nhưng backend chưa cấu hình AI API key.",
    observations: ["MVP đang chạy demo: dáng người tạm thời suy luận từ BMI."],
    outfitFit: {
      level: "unclear",
      score: null,
      summary: "Chưa bật AI vision nên chưa thể đánh giá chính xác bộ đồ đang mặc."
    },
    outfitFeedback: "Sau khi thêm GEMINI_API_KEY hoặc OPENAI_API_KEY, AI sẽ đọc ảnh để nhận xét tỉ lệ dáng người và outfit.",
    note: "Thêm GEMINI_API_KEY vào backend/.env để bật AI vision thật."
  };
}

async function analyzeWithGemini(file, profile) {
  const model = process.env.GEMINI_VISION_MODEL || "gemini-3.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let mimeType = file.mimetype || "image/jpeg";
  if (mimeType === "application/octet-stream" || !mimeType.startsWith("image/")) {
    const ext = file.originalname?.toLowerCase().split(".").pop();
    if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "gif") mimeType = "image/gif";
    else mimeType = "image/jpeg";
  }

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
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: file.buffer.toString("base64")
              }
            },
            {
              text: buildVisionPrompt(profile)
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini vision error: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  const parsed = safeJsonParse(text);

  if (!parsed) {
    throw new Error("Gemini vision không trả về JSON hợp lệ.");
  }

  return normalizeVisionResult(parsed, profile, "gemini_vision");
}

async function analyzeWithOpenAI(file, profile) {
  let mimeType = file.mimetype || "image/jpeg";
  if (mimeType === "application/octet-stream" || !mimeType.startsWith("image/")) {
    const ext = file.originalname?.toLowerCase().split(".").pop();
    if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "gif") mimeType = "image/gif";
    else mimeType = "image/jpeg";
  }
  const imageDataUrl = `data:${mimeType};base64,${file.buffer.toString("base64")}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildVisionPrompt(profile)
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "low"
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI vision error: ${errorText}`);
  }

  const data = await response.json();
  const parsed = safeJsonParse(data.output_text || "");

  if (!parsed) {
    throw new Error("OpenAI vision không trả về JSON hợp lệ.");
  }

  return normalizeVisionResult(parsed, profile, "openai_vision");
}

export async function analyzeBodyPhoto(file, profile) {
  if (!file) return getFallbackResult(file, profile);

  const provider = process.env.AI_VISION_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "openai");

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return analyzeWithGemini(file, profile);
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return analyzeWithOpenAI(file, profile);
  }

  return getFallbackResult(file, profile);
}
