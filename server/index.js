import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app = express();
const port = process.env.PORT || 3001;

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'zanshin',
    password: process.env.DB_PASSWORD || 'zanshin123',
    database: process.env.DB_NAME || 'zanshin_leaderboard',
});

app.use(cors());
app.use(express.json());

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                belt VARCHAR(30) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_scores_belt ON scores(belt);
            CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
        `);
        console.log('[DB] Tabelas inicializadas');
    } catch (err) {
        console.error('[DB] Erro ao inicializar:', err.message);
    }
};

initDB();

app.get('/api/scores', async (req, res) => {
    try {
        const { belt, limit = 20 } = req.query;
        
        let query = 'SELECT player_name, score, belt, created_at FROM scores';
        const params = [];
        
        if (belt) {
            query += ' WHERE belt = $1';
            params.push(belt);
            query += ' ORDER BY score DESC LIMIT $2';
            params.push(Math.min(parseInt(limit), 100));
        } else {
            query += ' ORDER BY score DESC LIMIT $1';
            params.push(Math.min(parseInt(limit), 100));
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao buscar scores' });
    }
});

app.post('/api/scores', async (req, res) => {
    try {
        const { player_name, score, belt } = req.body;
        
        if (!player_name || !score || !belt) {
            return res.status(400).json({ error: 'Campos obrigatórios: player_name, score, belt' });
        }
        
        if (player_name.length > 50 || score < 0) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }
        
        const result = await pool.query(
            'INSERT INTO scores (player_name, score, belt) VALUES ($1, $2, $3) RETURNING *',
            [player_name.trim(), score, belt]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[POST] Erro:', err.message);
        res.status(500).json({ error: 'Erro ao salvar score' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`[API] Servidor rodando na porta ${port}`);
});