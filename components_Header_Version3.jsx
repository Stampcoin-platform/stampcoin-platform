import Link from 'next/link';

export default function Header() {
  const phone = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CONTACT_PHONE || '+4915216933122' : '+4915216933122';
  return (
    <header className="bg-white shadow-sm">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold">منصة الطوابع النادرة</h1>
          <nav className="text-sm text-slate-600">
            <Link href="/"><a className="mr-4">الرئيسية</a></Link>
            <Link href="/admin/upload"><a className="mr-4">لوحة الإدارة</a></Link>
            <Link href="/contact"><a className="mr-4">اتصل بنا</a></Link>
          </nav>
        </div>
        <div className="text-sm flex items-center gap-3">
          <span className="text-slate-600">هاتف: <a href={`tel:${phone}`} className="text-indigo-600">{phone}</a></span>
          <a href="/auth/login" className="px-4 py-2 bg-slate-800 text-white rounded">تسجيل دخول</a>
        </div>
      </div>
    </header>
  );
}