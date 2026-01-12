export default function Footer() {
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+4915216933122';
  const email = 'stampcoin.contact@gmail.com';
  return (
    <footer className="bg-white mt-12 border-t">
      <div className="container py-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold">منصة الطوابع النادرة</h3>
          <p className="text-sm text-slate-600 mt-2">معرض رقمي للطوابع للمحترفين والهواة — اكتشف وشارك وقم بالشراء بأمان.</p>
        </div>
        <div>
          <h4 className="font-medium">تواصل معنا</h4>
          <p className="text-sm mt-1">البريد الإلكتروني: <a href={`mailto:${email}`} className="text-indigo-600">{email}</a></p>
          <p className="text-sm">هاتف: <a href={`tel:${phone}`} className="text-indigo-600">{phone}</a></p>
        </div>
        <div>
          <h4 className="font-medium">طرق الدفع المدعومة</h4>
          <ul className="text-sm mt-1">
            <li>بطاقات الائتمان (Visa / Mastercard) — عبر Stripe</li>
            <li>PayPal (قابلة للإضافة)</li>
            <li>مدفوعات كريبتو (CEX.IO / Coinbase) — قابلة للإضافة</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}