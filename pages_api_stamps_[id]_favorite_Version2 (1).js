import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'POST') {
    const { userEmail } = req.body;
    const fav = await prisma.favorite.create({
      data: { stampId: Number(id), userEmail: userEmail || null }
    });
    res.status(201).json(fav);
    return;
  }
  if (req.method === 'GET') {
    const favs = await prisma.favorite.findMany({ where: { stampId: Number(id) }});
    res.json({ count: favs.length });
    return;
  }
  res.status(405).end();
}