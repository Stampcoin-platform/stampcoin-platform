import Header from '../components/Header';
import StampCard from '../components/StampCard';
import { useEffect, useState } from 'react';

export default function Home() {
  const [stamps, setStamps] = useState([]);
  const [filter, setFilter] = useState({ country: '', year: '', rare: '' });

  useEffect(() => { fetchList(); }, []);

  async function fetchList(q = {}) {
    const qs = new URLSearchParams(q);
    const res = await fetch('/api/stamps?' + qs.toString());
    const data = await res.json();
    setStamps(data);
  }

  function onSearch(e) {
    e.preventDefault();
    const q = {};
    if (filter.country) q.country = filter.country;
    if (filter.year) q.year = filter.year;
    if (filter.rare) q.rare = filter.rare;
    fetchList(q);
  }

  return (
    <>
      <Header />
      <main className="container mt-6">
        <section className="mb-6">
          <div className="rounded-lg p-6 bg-gradient-to-r from-indigo-600 to-sky-500 text-white">
            <h2 className="text-2xl font-bold">اكتشف الطوابع النادرة</h2>
            <p className="mt-2 text-slate-100">معرض مصمم خصيصاً للمحترفين والهواة — عرض مفصل وصور بجودة عالية.</p>
          </div>
        </section>

        <section className="mb-6">
          <form onSubmit={onSearch} className="flex gap-3">
            <input placeholder="البلد" className="p-2 rounded border" value={filter.country} onChange={e=>setFilter({...filter,country:e.target.value})} />
            <input placeholder="السنة" className="p-2 rounded border" value={filter.year} onChange={e=>setFilter({...filter,year:e.target.value})} />
            <select value={filter.rare} onChange={e=>setFilter({...filter,rare:e.target.value})} className="p-2 rounded border">
              <option value="">الكل</option>
              <option value="true">نادرة فقط</option>
            </select>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded">بحث</button>
          </form>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stamps.map(s => <StampCard key={s.id} stamp={s} />)}
          </div>
        </section>
      </main>
    </>
  );
}