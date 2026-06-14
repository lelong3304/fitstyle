export const bodyShapeOptions = [
  { key: "slim", label: "Dáng mảnh/gầy" },
  { key: "rectangle", label: "Hình chữ nhật" },
  { key: "inverted_triangle", label: "Tam giác ngược" },
  { key: "trapezoid", label: "Hình thang" },
  { key: "triangle", label: "Hình tam giác/quả lê" },
  { key: "oval", label: "Hình bầu dục/quả táo" },
  { key: "hourglass", label: "Đồng hồ cát" },
  { key: "balanced", label: "Cân đối" }
];

export const productCatalog = [
  {
    id: "structured-overshirt-01",
    name: "Áo overshirt form đứng",
    brand: "FitStyle Picks",
    category: "Áo khoác nhẹ",
    gender: "unisex",
    price: "299.000đ",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/structured-overshirt-01",
    bodyShapeTags: ["slim", "rectangle", "balanced"],
    styleTags: ["casual", "layer", "street"],
    occasionTags: ["đi học", "đi chơi", "hằng ngày"],
    colors: ["xanh rêu", "be", "đen"],
    fit: "Regular fit, vai có cấu trúc",
    reason: "Tạo thêm độ dày phần vai và thân trên, giúp dáng mảnh hoặc dáng thẳng nhìn cân đối hơn."
  },
  {
    id: "straight-pants-01",
    name: "Quần straight-fit cạp vừa",
    brand: "FitStyle Picks",
    category: "Quần dài",
    gender: "unisex",
    price: "349.000đ",
    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/straight-pants-01",
    bodyShapeTags: ["triangle", "oval", "rectangle", "balanced"],
    styleTags: ["basic", "smart casual"],
    occasionTags: ["đi học", "đi làm", "hằng ngày"],
    colors: ["đen", "xám", "navy"],
    fit: "Straight fit",
    reason: "Đường ống thẳng giúp phần hông và chân gọn hơn nhưng không bó sát."
  },
  {
    id: "vneck-knit-01",
    name: "Áo cổ V chất liệu dày vừa",
    brand: "FitStyle Picks",
    category: "Áo thun/knit",
    gender: "unisex",
    price: "219.000đ",
    imageUrl: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/vneck-knit-01",
    bodyShapeTags: ["oval", "inverted_triangle", "balanced"],
    styleTags: ["minimal", "smart casual"],
    occasionTags: ["đi học", "đi chơi"],
    colors: ["trắng", "xám", "nâu"],
    fit: "Relaxed fit vừa phải",
    reason: "Cổ V kéo dài phần thân trên, làm tổng thể nhẹ và thoáng hơn."
  },
  {
    id: "wide-leg-trousers-01",
    name: "Quần ống rộng vừa",
    brand: "FitStyle Picks",
    category: "Quần dài",
    gender: "unisex",
    price: "389.000đ",
    imageUrl: "https://images.unsplash.com/photo-1506629905607-d9c297d6f5f9?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/wide-leg-trousers-01",
    bodyShapeTags: ["inverted_triangle", "trapezoid", "hourglass", "balanced"],
    styleTags: ["smart casual", "korean"],
    occasionTags: ["đi học", "đi làm", "đi chơi"],
    colors: ["đen", "kem", "xám"],
    fit: "Wide straight",
    reason: "Thêm độ nặng thị giác cho phần dưới, hợp người vai rộng hoặc thân trên nổi bật."
  },
  {
    id: "waist-detail-shirt-01",
    name: "Áo sơ mi nhấn eo",
    brand: "FitStyle Picks",
    category: "Áo sơ mi",
    gender: "female",
    price: "279.000đ",
    imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/waist-detail-shirt-01",
    bodyShapeTags: ["hourglass", "rectangle", "triangle"],
    styleTags: ["feminine", "smart casual"],
    occasionTags: ["đi học", "đi làm", "đi chơi"],
    colors: ["trắng", "xanh nhạt", "đen"],
    fit: "Có chi tiết eo",
    reason: "Tạo đường cong rõ hơn ở eo, hợp dáng đồng hồ cát và dáng chữ nhật."
  },
  {
    id: "aline-skirt-01",
    name: "Chân váy chữ A cạp cao",
    brand: "FitStyle Picks",
    category: "Chân váy",
    gender: "female",
    price: "259.000đ",
    imageUrl: "https://images.unsplash.com/photo-1583577612013-4fecf7bf8f13?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/aline-skirt-01",
    bodyShapeTags: ["triangle", "hourglass", "rectangle", "balanced"],
    styleTags: ["feminine", "casual"],
    occasionTags: ["đi học", "đi chơi"],
    colors: ["đen", "kem", "nâu"],
    fit: "A-line, cạp cao",
    reason: "Cạp cao nhấn eo, dáng chữ A cân bằng phần hông và tạo tỉ lệ chân dài hơn."
  },
  {
    id: "boxy-tee-01",
    name: "Áo boxy tee dày form",
    brand: "FitStyle Picks",
    category: "Áo thun",
    gender: "male",
    price: "189.000đ",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/boxy-tee-01",
    bodyShapeTags: ["slim", "rectangle", "trapezoid"],
    styleTags: ["basic", "street"],
    occasionTags: ["đi học", "hằng ngày"],
    colors: ["trắng", "đen", "xám"],
    fit: "Boxy fit vừa",
    reason: "Chất liệu dày và vai rơi nhẹ giúp thân trên đầy đặn hơn mà không bị luộm thuộm."
  },
  {
    id: "dark-oversized-blazer-01",
    name: "Blazer tối màu vai mềm",
    brand: "FitStyle Picks",
    category: "Áo khoác",
    gender: "unisex",
    price: "499.000đ",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85",
    affiliateUrl: "https://example.com/affiliate/dark-oversized-blazer-01",
    bodyShapeTags: ["oval", "inverted_triangle", "rectangle", "balanced"],
    styleTags: ["smart casual", "formal"],
    occasionTags: ["đi làm", "thuyết trình", "sự kiện"],
    colors: ["đen", "navy", "xám than"],
    fit: "Regular fit, vai mềm",
    reason: "Tối màu và đường may gọn giúp tổng thể lịch sự, che bụng tốt và dễ phối."
  }
];

export function listProducts({ bodyShape, category, gender, style } = {}) {
  const normalizedShape = normalizeBodyShapeKey(bodyShape);

  return productCatalog.filter((product) => {
    const matchesShape = !normalizedShape || product.bodyShapeTags.includes(normalizedShape);
    const matchesCategory = !category || product.category === category;
    const matchesGender = !gender || product.gender === "unisex" || product.gender === gender;
    const matchesStyle = !style || product.styleTags.includes(style);
    return matchesShape && matchesCategory && matchesGender && matchesStyle;
  });
}

export function getProduct(productId) {
  return productCatalog.find((product) => product.id === productId) || null;
}

export function normalizeBodyShapeKey(value = "") {
  const key = String(value).trim().toLowerCase();

  const aliases = {
    thin: "slim",
    skinny: "slim",
    lean: "slim",
    slim: "slim",
    rectangle: "rectangle",
    rectangular: "rectangle",
    "hinh chu nhat": "rectangle",
    inverted_triangle: "inverted_triangle",
    "tam giac nguoc": "inverted_triangle",
    trapezoid: "trapezoid",
    triangle: "triangle",
    pear: "triangle",
    "qua le": "triangle",
    oval: "oval",
    apple: "oval",
    curvy: "oval",
    "qua tao": "oval",
    hourglass: "hourglass",
    "dong ho cat": "hourglass",
    balanced: "balanced",
    can_doi: "balanced"
  };

  return aliases[key] || key;
}
