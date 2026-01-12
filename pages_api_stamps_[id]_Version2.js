import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const s = await prisma.stamp.findUnique({ where: { id: Number(id) } });
    if (!s) return res.status(404).json({ error: 'Not found' });
    s.images = s.images || [];
    res.json(s);
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body;
    const updated = await prisma.stamp.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        country: body.country,
        year: body.year ? Number(body.year) : null,
        description: body.description,
        images: body.images || [],
        isRare: body.isRare || false,
        condition: body.condition || null,
        provenance: body.provenance || null,
        price: body.price ? Number(body.price) : 0
      }
    });
    res.json(updated);
    return;
  }

  if (req.method === 'DELETE') {
    await prisma.stamp.delete({ where: { id: Number(id) }});
    res.json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}