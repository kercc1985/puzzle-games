import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { game, difficulty, limit = 10 } = req.query;

    if (!game || !difficulty) {
      return res.status(400).json({ error: 'Missing game or difficulty parameter' });
    }

    // 查询排行榜
    const result = await sql`
      SELECT 
        nickname,
        difficulty,
        time_seconds,
        time_formatted,
        created_at
      FROM game_scores
      WHERE game = ${game} AND difficulty = ${difficulty}
      ORDER BY time_seconds ASC
      LIMIT ${parseInt(limit)}
    `;

    res.status(200).json({ 
      success: true, 
      scores: result.rows 
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message 
    });
  }
}
