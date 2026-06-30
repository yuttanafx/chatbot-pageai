import "./globals.css";

export const metadata = {
  title: "ผู้ช่วยขายอัตโนมัติ",
  description: "ระบบ AI ตอบแชทลูกค้าและปิดการขาย เชื่อม Facebook และ LINE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-body">{children}</body>
    </html>
  );
}
