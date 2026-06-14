# FitStyle AI MVP

Web MVP cho môn EXE201: nhập thông tin cơ thể, upload ảnh toàn thân, tính BMI/TDEE/body fat tham khảo, AI phân tích dáng người, gợi ý sức khỏe/thời trang và thử phối đồ.

## Công Nghệ

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas qua Mongoose
- AI vision: Gemini API, OpenAI là tùy chọn
- Virtual try-on: Pixelcut Try On API

## Chạy Dự Án

```bash
npm.cmd run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

Backend:

```text
http://127.0.0.1:4000
```

## Biến Môi Trường

Tạo file `backend/.env`:

```text
PORT=4000
FRONTEND_ORIGIN=http://127.0.0.1:5173

MONGODB_URI=
MONGODB_DB_NAME=fitstyle_ai
JWT_SECRET=change_this_to_a_long_random_secret

AI_VISION_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_VISION_MODEL=gemini-2.5-flash

PIXELCUT_API_KEY=your_pixelcut_api_key_here
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-4.1-mini
```

## Routes Frontend

```text
/              Trang chủ
/analyze       Trang phân tích cơ thể và outfit
/try-on        Trang phối đồ bằng Pixelcut Try On
/login         Trang đăng nhập
/register      Trang đăng ký
/history       Trang lịch sử phân tích
/history/:id   Trang chi tiết một lần phân tích
```

## Auth Và Role

API auth:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Role:

- `admin`: xem được toàn bộ lịch sử.
- `customer`: chỉ xem được lịch sử của chính mình.

Frontend lưu JWT trong `localStorage` và gửi qua:

```text
Authorization: Bearer <token>
```

## API Chính

```text
POST /api/analyze
GET /api/analyses
GET /api/analyses/:id
POST /api/try-on
```

## Pixelcut Try On

Backend gọi:

```text
POST https://api.developer.pixelcut.ai/v1/try-on
```

Input hiện tại có 2 cách:

Cách 1: upload file trực tiếp trên `/try-on`.

- `personImage`: file ảnh người.
- `garmentImage`: file ảnh quần áo.

Cách 2: dán URL công khai.

- `personImageUrl`: URL công khai của ảnh người.
- `garmentImageUrl`: URL công khai của ảnh quần áo.
- `removeBackground`: có xóa nền ảnh kết quả hay không.

Luồng hiện tại: frontend gửi file lên backend, backend upload lên Cloudinary để lấy `secure_url`, rồi gửi URL đó sang Pixelcut.

## Lộ Trình Tiếp Theo

1. Thêm AI text tạo kế hoạch ăn uống/tập luyện 7 ngày.
2. Lưu lịch sử Try On vào MongoDB.
3. Thêm outfit scan riêng: upload ảnh outfit khác để AI đánh giá.
4. Thêm trang admin quản lý user/lịch sử.

## Lưu Ý Sản Phẩm

Không nên định vị sản phẩm là công cụ chẩn đoán y tế. Hãy gọi đây là trợ lý tham khảo về vóc dáng, thói quen sống và phong cách cá nhân.
