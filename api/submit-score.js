import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // 设置 CORS 允许跨域
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname, difficulty, timeSeconds, timeFormatted, game } = req.body;

    // 验证数据
    if (!nickname || !difficulty || !timeSeconds || !timeFormatted || !game) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证昵称长度
    if (nickname.length > 20) {
      return res.status(400).json({ error: 'Nickname too long' });
    }

    // 获取用户IP
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress || 
               'unknown';

    // 创建表（如果不存在）
    await sql`
      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        game VARCHAR(50) NOT NULL,
        nickname VARCHAR(20) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        time_seconds INTEGER NOT NULL,
        time_formatted VARCHAR(10) NOT NULL,
        ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 创建索引（提高查询速度）
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_difficulty 
      ON game_scores(game, difficulty, time_seconds)
    `;

    // 插入分数
    await sql`
      INSERT INTO game_scores (game, nickname, difficulty, time_seconds, time_formatted, ip)
      VALUES (${game}, ${nickname}, ${difficulty}, ${timeSeconds}, ${timeFormatted}, ${ip})
    `;

    res.status(200).json({ 
      success: true, 
      message: 'Score submitted successfully' 
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to submit score',
      details: error.message 
    });
  }
}
