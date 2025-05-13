const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com PostgreSQL no Render
const pool = new Pool({
  connectionString: "postgresql://ordens_servico_db_user:I0TFfW1JebXihjJVGMvAXHIAjcYyKdQV@dpg-d0hs9g3uibrs739nkvsg-a/ordens_servico_db",
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Criar tabela se não existir
const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id SERIAL PRIMARY KEY,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      deviceType TEXT NOT NULL,
      problemDescription TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      createdAt TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP NOT NULL
    );
  `);
};

createTable().catch(console.error);

// Rotas da API

// GET todas as ordens
app.get("/api/ordens", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ordens_servico ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET uma ordem específica
app.get("/api/ordens/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ordens_servico WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ordem não encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nova ordem
app.post("/api/ordens", async (req, res) => {
  const { clientName, clientPhone, deviceType, problemDescription, priority } = req.body;
  const now = new Date();

  try {
    const result = await pool.query(
      `INSERT INTO ordens_servico (clientName, clientPhone, deviceType, problemDescription, priority, status, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, 'pendente', $6, $6) RETURNING id`,
      [clientName, clientPhone, deviceType, problemDescription, priority, now]
    );
    res.json({ id: result.rows[0].id, message: "Ordem de serviço criada com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT atualizar status
app.put("/api/ordens/:id/status", async (req, res) => {
  const { status } = req.body;
  const now = new Date();

  try {
    const result = await pool.query(
      "UPDATE ordens_servico SET status = $1, updatedAt = $2 WHERE id = $3 RETURNING *",
      [status, now, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ordem não encontrada" });
    }

    res.json({ message: "Status atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
