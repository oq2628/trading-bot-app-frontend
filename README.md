# AlgoForge — Frontend

React 19 + TypeScript + Vite + MUI. Giao diện cửa hàng, luồng thanh toán, quản lý license và trang quản trị cho AlgoForge.

Cần backend chạy kèm: [`oq2628/trading-bot-app-backend`](https://github.com/oq2628/trading-bot-app-backend).

---

## Chạy môi trường phát triển

```bash
npm ci        # không dùng npm install, để tôn trọng lockfile
npm run dev
```

`.env.development` đã trỏ sẵn về `http://localhost:8000`.

---

## Cấu hình

Chỉ có một biến môi trường, và nó **bắt buộc** khi build:

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_BASE_URL` | Origin của backend, **không** có dấu `/` ở cuối. Chuỗi rỗng nghĩa là *cùng origin*. |

Vite nhúng giá trị này vào bundle lúc build chứ không đọc lúc chạy, nên nó được quyết định tại thời điểm build và không đổi được sau đó.

- **Production:** `.env.production` để trống — reverse proxy phục vụ bundle này và chuyển tiếp `/api/*` sang backend, nên request luôn cùng origin và không cần cấu hình CORS.
- **Development:** `.env.development` trỏ về uvicorn cục bộ.
- **Origin khác:** đặt `VITE_API_BASE_URL=https://api.example.com` khi build.

`vite.config.ts` **làm fail `npm run build`** nếu biến không được định nghĩa. Trước đây API URL bị hardcode `http://localhost:8000` ngay trong `src/utils/api.ts`, nên mọi bản build production đều bị ghim vào chính máy đã tạo ra nó. Chốt chặn này tồn tại để điều đó không tái diễn. (Giá trị rỗng là hợp lệ; chỉ *không định nghĩa* mới bị coi là sai cấu hình.)

---

## Build

```bash
npm run build     # tsc -b && vite build
npm run preview   # xem thử bản build
npm run lint
```

---

## Cấu trúc

```
src/
  components/       Thành phần dùng chung (Navbar, Footer, Toast, ...)
    admin/          Các panel cài đặt tách khỏi Admin.tsx
  config/           Nội dung tĩnh và kiểu dữ liệu khớp schema backend
  context/          AuthContext (phiên đăng nhập, WebSocket số dư)
                    SiteSettingsContext (đối tác, liên hệ, giới thiệu)
  pages/            Các trang gắn với route
  utils/api.ts      Client fetch, header xác thực, xử lý 401
  theme.ts          Token MUI và style dùng chung
```

**Nội dung lấy từ API, không hardcode.** Thông tin đối tác, kênh liên hệ, tài liệu pháp lý và cột mốc phát triển đều do quản trị viên chỉnh trong trang admin và nạp qua `SiteSettingsContext`. Giá trị để trống sẽ khiến phần tương ứng tự ẩn thay vì hiển thị link chết hoặc nội dung giả — đừng thêm giá trị placeholder vào `siteContent.ts`.

**Token nằm trong `localStorage`.** `api.ts` gắn nó vào mọi request. Khi backend trả 401 mà đang có token, phiên đã hết hạn: token bị xoá và người dùng bị chuyển về `/login`. Request không kèm token thì bỏ qua — 401 từ endpoint đăng nhập là sai mật khẩu chứ không phải hết phiên.

---

## Lint

`npm run lint` hiện báo 74 lỗi, gần như toàn bộ là `@typescript-eslint/no-explicit-any` có từ trước khi dự án có CI. CI chạy lint nhưng **chưa chặn merge** vì chúng — nếu chặn thì mọi pull request đều bị block. Giảm dần về 0 rồi bỏ `continue-on-error` trong `.github/workflows/ci.yml`.

Đừng thêm lỗi mới. Ngưỡng hiện tại là 74.
