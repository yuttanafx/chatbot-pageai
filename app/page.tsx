export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-clay text-sm tracking-widest uppercase mb-3">กำลังทำงาน</p>
        <h1 className="font-display text-4xl font-semibold mb-4">ผู้ช่วยขายอัตโนมัติ</h1>
        <p className="text-ink/70 mb-8 leading-relaxed">
          ระบบนี้เชื่อมต่อกับ Facebook Messenger และ LINE Official Account
          เพื่อตอบแชทลูกค้าและช่วยปิดการขายด้วย AI โดยอัตโนมัติ
        </p>
        <a
          href="/admin"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-full text-sm tracking-wide hover:bg-moss transition-colors"
        >
          ไปหน้าจัดการสินค้า
        </a>
      </div>
    </main>
  );
}
