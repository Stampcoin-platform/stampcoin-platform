import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const comments = await prisma.comment.findMany({ where: { stampId: Number(id) }, orderBy: { createdAt: 'desc' }});
    res.json(comments);
    return;
  }
  if (req.method === 'POST') {
    const { name, email, body } = req.body;
    if (!body) return res.status(400).json({ error: 'body required' });
    const c = await prisma.comment.create({
      data: { stampId: Number(id), name, email, body }
    });
    res.status(201).json(c);
    return;
  }
  res.status(405).end();
}