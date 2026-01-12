import Header from '../components/Header';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [ok, setOk] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setOk(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } else setOk(false);
  }

  return (
    <>
      <Header />
      <main className="container py-8">
        <h2 className="text-2xl font-bold">تواصل معنا</h2>
        <p className="text-slate-600 mt-2">لأي استفسار تجاري أو فني، تواصل معنا عبر النموذج أدناه أو من خلال البريد الإلكتروني: <strong>stampcoin.contact@gmail.com</strong></p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow">
            <label className="block text-sm">الاسم</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="p-2 border rounded w-full" />
            <label className="block text-sm mt-3">البريد الإلكتروني</label>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="p-2 border rounded w-full" />
            <label className="block text-sm mt-3">الهاتف</label>
            <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="p-2 border rounded w-full" />
            <label className="block text-sm mt-3">الرسالة</label>
            <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="p-2 border rounded w-full" rows="5"></textarea>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">إرسال</button>
            {ok === true && <p className="text-green-600 mt-3">تم الإرسال بنجاح. شكرًا لتواصلك!</p>}
            {ok === false && <p className="text-red-600 mt-3">حدث خطأ أثناء الإرسال.</p>}
          </form>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold">معلومات التواصل</h3>
            <p className="mt-3">البريد الإلكتروني: <a href="mailto:stampcoin.contact@gmail.com" className="text-indigo-600">stampcoin.contact@gmail.com</a></p>
            <p className="mt-2">الهاتف: <strong>{process.env.NEXT_PUBLIC_CONTACT_PHONE || '+4915216933122'}</strong></p>
            <p className="mt-4">العنوان (افتراضي): شارع المثال 123، المدينة، الدولة — يمكنك تعديل العنوان في واجهة الإدارة لاحقًا.</p>
            <hr className="my-4" />
            <p className="text-sm text-slate-600">طرق الدفع المدعومة: بطاقات الائتمان عبر Stripe، PayPal (قابلة للإضافة)، تحويل بنكي.</p>
          </div>
        </div>
      </main>
    </>
  );
}