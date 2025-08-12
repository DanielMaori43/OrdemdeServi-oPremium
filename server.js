const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com PostgreSQL no Render
const pool = new Pool({
  connectionString: "postgresql://ordens_servico_db_user:I0TFfW1JebXihjJVGMvAXHIAjcYyKdQV@dpg-d0hs9g3uibrs739nkvsg-a.oregon-postgres.render.com/ordens_servico_db",
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Criar tabela se não existir
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        clientName TEXT NOT NULL,
        clientPhone TEXT NOT NULL,
        deviceType TEXT NOT NULL,
        problemDescription TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela verificada/criada com sucesso");
  } catch (err) {
    console.error("Erro ao criar tabela:", err);
  }
};
createTable();

// Rotas
app.get("/api/ordens", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ordens_servico ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/ordens/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const result = await pool.query("SELECT * FROM ordens_servico WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Ordem não encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ordens", async (req, res) => {
  try {
    const { clientName, clientPhone, deviceType, problemDescription, priority } = req.body;
    if (!clientName || !clientPhone || !deviceType || !problemDescription || !priority) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const result = await pool.query(
      `INSERT INTO ordens_servico (clientName, clientPhone, deviceType, problemDescription, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [clientName, clientPhone, deviceType, problemDescription, priority]
    );
    res.json({ id: result.rows[0].id, message: "Ordem de serviço criada com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/ordens/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    if (!status) return res.status(400).json({ error: "Status é obrigatório" });

    const result = await pool.query(
      "UPDATE ordens_servico SET status = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Ordem não encontrada" });

    res.json({ message: "Status atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));