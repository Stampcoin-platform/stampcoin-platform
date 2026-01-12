import Link from 'next/link';
import Image from 'next/image';

export default function StampCard({ stamp }) {
  const thumb = (Array.isArray(stamp.images) ? stamp.images[0] : stamp.images) || '/placeholder.png';
  return (
    <article className="stamp-card relative">
      <div style={{ position: 'relative', height: 220 }}>
        <Image src={thumb} alt={stamp.title} layout="fill" objectFit="cover" />
        {stamp.isRare && <span className="stamp-badge">نادر</span>}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{stamp.title}</h3>
        <p className="text-sm text-slate-600">{stamp.country} • {stamp.year || '-'}</p>
        <div className="mt-3 flex justify-between items-center">
          <Link href={`/stamps/${stamp.id}`}>
            <a className="text-indigo-600 font-medium">عرض التفاصيل</a>
          </Link>
          <span className="text-sm text-slate-500">{stamp.condition || ''}</span>
        </div>
      </div>
    </article>
  );
}