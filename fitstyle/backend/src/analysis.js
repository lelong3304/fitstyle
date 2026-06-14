const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
};

const BODY_SHAPE_LABELS = {
  slim: "Dáng gầy",
  balanced: "Dáng cân đối",
  curvy: "Dáng đầy đặn",
  rectangle: "Dáng chữ nhật",
  pear: "Dáng quả lê",
  inverted_triangle: "Dáng tam giác ngược",
  hourglass: "Dáng đồng hồ cát"
};

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) {
    return {
      key: "underweight",
      label: "Thiếu cân",
      tone: "warning",
      summary: "Bạn nên ưu tiên tăng cân lành mạnh và cải thiện sức mạnh cơ bắp."
    };
  }

  if (bmi < 23) {
    return {
      key: "normal",
      label: "Cân nặng bình thường",
      tone: "success",
      summary: "Bạn đang ở vùng BMI tốt theo chuẩn thường dùng cho người châu Á."
    };
  }

  if (bmi < 25) {
    return {
      key: "overweight_risk",
      label: "Nguy cơ thừa cân",
      tone: "notice",
      summary: "Bạn nên kiểm soát khẩu phần và tăng vận động để giữ vóc dáng cân đối."
    };
  }

  return {
    key: "overweight",
    label: "Thừa cân",
    tone: "warning",
    summary: "Bạn nên giảm cân chậm, bền vững và theo dõi tiến trình theo tuần."
  };
}

function getGoalAdvice(goal, bmiCategory) {
  if (goal === "gain" || bmiCategory.key === "underweight") {
    return {
      direction: "Tăng cân lành mạnh",
      calorieMode: "Ăn dư calo nhẹ",
      calorieDelta: 300,
      tips: [
        "Tăng 250-350 kcal mỗi ngày thay vì ăn quá nhiều đột ngột.",
        "Ưu tiên protein trong mỗi bữa: trứng, cá, thịt nạc, đậu, sữa chua Hy Lạp.",
        "Tập kháng lực 3-4 buổi mỗi tuần để cân nặng tăng theo hướng có cơ bắp hơn."
      ]
    };
  }

  if (goal === "lose" || bmiCategory.key === "overweight" || bmiCategory.key === "overweight_risk") {
    return {
      direction: "Giảm mỡ an toàn",
      calorieMode: "Ăn thâm hụt calo nhẹ",
      calorieDelta: -400,
      tips: [
        "Giảm 300-500 kcal mỗi ngày là mức dễ duy trì hơn so với cắt quá sâu.",
        "Giữ protein cao, tăng rau, uống đủ nước và hạn chế đồ uống nhiều đường.",
        "Kết hợp đi bộ nhanh hoặc cardio nhẹ với tập kháng lực để giữ dáng."
      ]
    };
  }

  return {
    direction: "Duy trì và cải thiện body composition",
    calorieMode: "Ăn quanh mức duy trì",
    calorieDelta: 0,
    tips: [
      "Giữ calo ổn định, tập trung ngủ đủ và tăng chất lượng bữa ăn.",
      "Tập kháng lực đều để cơ thể săn chắc hơn dù cân nặng không đổi nhiều.",
      "Theo dõi số đo eo, ảnh tiến trình và cảm giác năng lượng thay vì chỉ nhìn cân nặng."
    ]
  };
}

function getFashionAdvice(bodyShape) {
  const adviceMap = {
    slim: {
      focus: "Tạo cảm giác đầy đặn và có cấu trúc hơn.",
      wear: ["Áo overshirt, jacket nhẹ, cardigan hoặc phối layer", "Quần straight-fit hoặc relaxed-fit", "Chất liệu đứng form như denim, twill, cotton dày"],
      avoid: ["Đồ quá bó sát từ đầu đến chân", "Outfit quá tối và mỏng làm người trông nhỏ hơn"]
    },
    balanced: {
      focus: "Giữ tỉ lệ gọn gàng và linh hoạt nhiều phong cách.",
      wear: ["Áo vừa vai, quần ống đứng hoặc slim-straight", "Set tối giản có điểm nhấn màu hoặc phụ kiện", "Trang phục nhấn nhẹ vào đường eo"],
      avoid: ["Form quá rộng che hết tỉ lệ cơ thể", "Quá nhiều lớp dày làm mất sự cân đối"]
    },
    curvy: {
      focus: "Tạo đường dọc, giữ form gọn và tôn điểm mạnh.",
      wear: ["Áo cổ V, sơ mi mở 1-2 nút hoặc cổ vuông", "Quần cạp vừa/cao, ống đứng", "Blazer hoặc áo khoác có đường cắt rõ"],
      avoid: ["Đồ quá chật gây nhăn kéo", "Chất liệu quá mỏng bám sát vùng bạn chưa tự tin"]
    },
    rectangle: {
      focus: "Tạo điểm nhấn eo và thêm chiều sâu cho outfit.",
      wear: ["Áo có layer, thắt lưng, hoặc chi tiết ở eo", "Quần cạp cao, ống rộng vừa", "Áo khoác ngắn hoặc sơ vin một phần"],
      avoid: ["Cả set quá suông không có điểm nhấn", "Áo và quần cùng form rộng, cùng màu phẳng"]
    },
    pear: {
      focus: "Cân bằng phần thân trên với phần hông/đùi.",
      wear: ["Áo sáng màu hoặc có chi tiết vai/cổ", "Quần ống đứng, bootcut nhẹ hoặc váy chữ A", "Áo khoác dài qua hông với form gọn"],
      avoid: ["Quần quá bó sáng màu nếu muốn giảm chú ý phần dưới", "Áo quá nhỏ làm phần hông nổi bật hơn"]
    },
    inverted_triangle: {
      focus: "Làm mềm phần vai và tăng cân bằng cho phần dưới.",
      wear: ["Áo cổ V, cổ mở, màu tối phần trên", "Quần ống rộng, cargo gọn hoặc chân váy xòe nhẹ", "Outfit có điểm nhấn ở giày/quần"],
      avoid: ["Đệm vai lớn, áo cổ thuyền rộng", "Áo có họa tiết to ở vai/ngực"]
    },
    hourglass: {
      focus: "Tôn eo và giữ đường cong tự nhiên.",
      wear: ["Đồ vừa người, có chiết eo hoặc thắt lưng", "Quần/váy cạp cao", "Chất liệu rũ vừa phải, không quá cứng"],
      avoid: ["Đồ hộp quá rộng che eo", "Phối nhiều lớp dày quanh eo"]
    }
  };

  return adviceMap[bodyShape] || adviceMap.balanced;
}

function calculateNavyBodyFat(profile) {
  const heightIn = Number(profile.heightCm) / 2.54;
  const weightKg = Number(profile.weightKg);
  const waistCm = toOptionalNumber(profile.waistCm);
  const neckCm = toOptionalNumber(profile.neckCm);
  const hipCm = toOptionalNumber(profile.hipCm);

  if (!waistCm || !neckCm) return null;
  if (profile.gender === "female" && !hipCm) return null;

  const waistIn = waistCm / 2.54;
  const neckIn = neckCm / 2.54;
  const hipIn = hipCm ? hipCm / 2.54 : null;

  const bodyFatPercent =
    profile.gender === "female"
      ? 163.205 * Math.log10(waistIn + hipIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387
      : 86.01 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76;

  if (!Number.isFinite(bodyFatPercent) || bodyFatPercent < 3 || bodyFatPercent > 70) return null;

  const percent = round(bodyFatPercent);
  const fatMassKg = round((weightKg * percent) / 100);

  return {
    method: "US Navy circumference estimate",
    percent,
    fatMassKg,
    leanMassKg: round(weightKg - fatMassKg),
    note: "Body fat được ước tính từ số đo cổ/eo/hông, không phải từ ảnh."
  };
}

export function analyzeProfile(profile, visionAnalysis) {
  const heightM = Number(profile.heightCm) / 100;
  const weightKg = Number(profile.weightKg);
  const age = Number(profile.age);
  const gender = profile.gender;
  const activityLevel = profile.activityLevel || "light";
  const goal = profile.goal || "maintain";
  const bodyShape = visionAnalysis?.bodyShape || "balanced";

  const bmi = round(weightKg / (heightM * heightM));
  const bmiCategory = getBmiCategory(bmi);
  const bmrBase = 10 * weightKg + 6.25 * Number(profile.heightCm) - 5 * age;
  const bmr = Math.round(gender === "female" ? bmrBase - 161 : bmrBase + 5);
  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light));
  const goalAdvice = getGoalAdvice(goal, bmiCategory);
  const targetCalories = Math.max(1200, tdee + goalAdvice.calorieDelta);

  return {
    disclaimer: "Kết quả chỉ mang tính tham khảo, không thay thế tư vấn y tế hoặc tư vấn dinh dưỡng chuyên môn.",
    metrics: {
      bmi,
      bmiCategory,
      bmr,
      tdee,
      targetCalories,
      bodyFat: calculateNavyBodyFat(profile),
      bodyShape: {
        key: bodyShape,
        label: visionAnalysis?.detailedBodyShape?.label || BODY_SHAPE_LABELS[bodyShape] || BODY_SHAPE_LABELS.balanced,
        baseLabel: BODY_SHAPE_LABELS[bodyShape] || BODY_SHAPE_LABELS.balanced,
        description: visionAnalysis?.detailedBodyShape?.description || null,
        confidence: visionAnalysis?.confidence || 0,
        source: visionAnalysis?.source || "fallback"
      }
    },
    vision: visionAnalysis,
    health: {
      direction: goalAdvice.direction,
      calorieMode: goalAdvice.calorieMode,
      tips: goalAdvice.tips,
      weeklyPlan: [
        "Đặt mục tiêu thay đổi 0.25-0.5 kg mỗi tuần.",
        "Chuẩn bị trước 2-3 món chính lành mạnh để tránh ăn theo cảm xúc.",
        "Vận động tối thiểu 150 phút mỗi tuần, cộng thêm 2-3 buổi tập sức mạnh."
      ]
    },
    fashion: getFashionAdvice(bodyShape)
  };
}

export function validateProfile(profile) {
  const errors = [];
  const requiredFields = ["age", "heightCm", "weightKg", "gender"];

  requiredFields.forEach((field) => {
    if (!profile[field]) errors.push(`Thiếu trường ${field}.`);
  });

  if (Number(profile.age) < 16 || Number(profile.age) > 80) {
    errors.push("Tuổi nên nằm trong khoảng 16-80 cho bản MVP.");
  }

  if (Number(profile.heightCm) < 120 || Number(profile.heightCm) > 230) {
    errors.push("Chiều cao nên nằm trong khoảng 120-230 cm.");
  }

  if (Number(profile.weightKg) < 30 || Number(profile.weightKg) > 250) {
    errors.push("Cân nặng nên nằm trong khoảng 30-250 kg.");
  }

  [
    ["neckCm", "Vòng cổ"],
    ["chestCm", "Vòng ngực"],
    ["waistCm", "Vòng eo"],
    ["hipCm", "Vòng hông"]
  ].forEach(([field, label]) => {
    const value = toOptionalNumber(profile[field]);
    if (value !== null && (value < 20 || value > 180)) {
      errors.push(`${label} nên nằm trong khoảng 20-180 cm.`);
    }
  });

  return errors;
}
