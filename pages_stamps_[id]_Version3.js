import Header from '../../components/Header';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function StampDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [stamp, setStamp] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, src: '' });
  const [comments, setComments] = useState([]);
  const [favCount, setFavCount] = useState(0);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', body: '' });

  useEffect(() => { if (id) fetchData(); }, [id]);

  async function fetchData() {
    const res = await fetch(`/api/stamps/${id}`);
    const data = await res.json();
    setStamp(data);

    const cRes = await fetch(`/api/stamps/${id}/comments`);
    const cData = await cRes.json();
    setComments(cData);

    const fRes = await fetch(`/api/stamps/${id}/favorite`);
    const fData = await fRes.json();
    setFavCount(fData.count || 0);
  }

  async function postComment(e) {
    e.preventDefault();
    const res = await fetch(`/api/stamps/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentForm)
    });
    if (res.ok) {
      setCommentForm({ name: '', email: '', body: '' });
      fetchData();
    } else alert('خطأ عند إضافة التعليق');
  }

  async function addFavorite() {
    const email = prompt('أدخل بريدك الإلكتروني لحفظ الطابع في المفضلة (اختياري)');
    const res = await fetch(`/api/stamps/${id}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: email })
    });
    if (res.ok) fetchData();
  }

  async function buyStripe() {
    const res = await fetch('/api/pay/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stampId: id })
    });
    const j = await res.json();
    if (j.url) window.location.href = j.url;
    else alert('خطأ بإنشاء جلسة الدفع. تأكد من ضبط مفاتيح Stripe في .env.');
  }

  async function buyPayPal() {
    const res = await fetch('/api/pay/paypal-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stampId: id })
    });
    const j = await res.json();
    if (j.approveUrl) window.location.href = j.approveUrl;
    else alert('خطأ بإنشاء أمر PayPal. تأكد من ضبط مفاتيح PayPal.');
  }

  if (!stamp) return <div><Header /><div className="container py-12">جارٍ التحميل...</div></div>;

  return (
    <>
      <Header />
      <main className="container py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="bg-white p-4 rounded shadow">
              {stamp.images?.length ? (
                <div>
                  <div style={{ position: 'relative', height: 420 }} onClick={() => setLightbox({ open: true, src: stamp.images[0] })}>
                    <Image src={stamp.images[0]} alt={stamp.title} layout="fill" objectFit="contain" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    {stamp.images.map((img, i) => (
                      <div key={i} style={{ width: 80, height: 80 }} onClick={() => setLightbox({ open: true, src: img })}>
                        <Image src={img} alt="" layout="fill" objectFit="cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="p-20 text-center">لا توجد صور</div>}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">{stamp.title}</h2>
            <p className="mt-2 text-slate-600">{stamp.country} • {stamp.year}</p>
            <p className="mt-4">{stamp.description}</p>
            <div className="mt-6">
              <strong>الحالة:</strong> {stamp.condition || '-'}
            </div>
            <div className="mt-4">
              <strong>السعر:</strong> {(stamp.price || 0)/100} USD
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={buyStripe} className="px-4 py-2 bg-green-600 text-white rounded">شراء بـ Stripe</button>
              <button onClick={buyPayPal} className="px-4 py-2 bg-yellow-500 text-white rounded">شراء بـ PayPal</button>
              <button onClick={addFavorite} className="px-4 py-2 bg-slate-200 rounded">أضف للمفضلة ({favCount})</button>
            </div>

            <div className="mt-6">
              <strong>Provenance:</strong>
              <pre className="bg-slate-50 p-3 rounded mt-2 text-sm">{JSON.stringify(stamp.provenance || [], null, 2)}</pre>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h3 className="font-semibold">التعليقات</h3>
          <form onSubmit={postComment} className="mt-3 bg-white p-4 rounded shadow max-w-xl">
            <input placeholder="الاسم" className="p-2 border rounded w-full" value={commentForm.name} onChange={e=>setCommentForm({...commentForm,name:e.target.value})} />
            <input placeholder="البريد الإلكتروني" className="p-2 border rounded w-full mt-2" value={commentForm.email} onChange={e=>setCommentForm({...commentForm,email:e.target.value})} />
            <textarea placeholder="اكتب تعليقك" className="p-2 border rounded w-full mt-2" rows="3" value={commentForm.body} onChange={e=>setCommentForm({...commentForm,body:e.target.value})}></textarea>
            <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded">أضف تعليق</button>
          </form>

          <div className="mt-4 space-y-3">
            {comments.map(c => (
              <div key={c.id} className="bg-white p-3 rounded shadow">
                <div className="text-sm text-slate-600">{c.name || 'زائر'} — <span className="text-xs">{new Date(c.createdAt).toLocaleString()}</span></div>
                <div className="mt-2">{c.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {lightbox.open && (
        <div className="lightbox" onClick={() => setLightbox({ open: false, src: '' })}>
          <img src={lightbox.src} style={{ maxHeight: '90%', maxWidth: '90%' }} alt="zoom" />
        </div>
      )}
    </>
  );
}