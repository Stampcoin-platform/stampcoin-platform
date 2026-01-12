import Header from '../../components/Header';
import { useState } from 'react';
import Router from 'next/router';

export default function AdminUpload() {
  const [form, setForm] = useState({ title: '', country: '', year: '', description: '', condition: '', isRare: false, price: 0 });
  const [files, setFiles] = useState([]);

  async function onSubmit(e) {
    e.preventDefault();
    const uploaded = [];
    for (let f of files) {
      const fd = new FormData();
      fd.append('file', f);
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (j.url) uploaded.push(j.url);
    }

    const payload = { ...form, images: uploaded };
    const res = await fetch('/api/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', /* Authorization: 'Bearer <token>' */ },
      body: JSON.stringify(payload)
    });
    if (res.ok) Router.push('/');
    else {
      const txt = await res.text();
      alert('خطأ عند الإنشاء: ' + txt);
    }
  }

  return (
    <>
      <Header />
      <main className="container py-8">
        <h2 className="text-xl font-bold mb-4">لوحة الإدارة — إضافة طابع</h2>
        <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
          <input placeholder="العنوان" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="p-2 border rounded" />
          <input placeholder="البلد" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} className="p-2 border rounded" />
          <input placeholder="السنة" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} className="p-2 border rounded" />
          <input placeholder="الحالة (condition)" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="p-2 border rounded" />
          <input placeholder="السعر (مثال: 25000 = 250.00 USD)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="p-2 border rounded" />
          <textarea placeholder="الوصف" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="p-2 border rounded"></textarea>

          <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files))} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isRare} onChange={e=>setForm({...form,isRare:e.target.checked})} /> نادر</label>

          <button className="px-4 py-2 bg-green-600 text-white rounded">إنشاء الطابع</button>
        </form>
      </main>
    </>
  );
}