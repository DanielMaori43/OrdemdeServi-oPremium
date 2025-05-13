const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors")
app.use(cors())

// Middleware para processar JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")))

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite");
    
    // Criar tabela de ordens de serviço se não existir
    db.run(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT NOT NULL,
        clientPhone TEXT NOT NULL,
        deviceType TEXT NOT NULL,
        problemDescription TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  }
});

// Rotas da API

// Obter todas as ordens
app.get("/api/ordens", (req, res) => {
  db.all("SELECT * FROM ordens_servico ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obter uma ordem específica
app.get("/api/ordens/:id", (req, res) => {
  db.get("SELECT * FROM ordens_servico WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Ordem não encontrada" });
    }
    res.json(row);
  });
});

// Criar nova ordem
app.post("/api/ordens", (req, res) => {
  const { clientName, clientPhone, deviceType, problemDescription, priority } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    "INSERT INTO ordens_servico (clientName, clientPhone, deviceType, problemDescription, priority, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [clientName, clientPhone, deviceType, problemDescription, priority, "pendente", now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        id: this.lastID,
        message: "Ordem de serviço criada com sucesso"
      });
    }
  );
});

// Atualizar status de uma ordem
app.put("/api/ordens/:id/status", (req, res) => {
  const { status } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    "UPDATE ordens_servico SET status = ?, updatedAt = ? WHERE id = ?",
    [status, now, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Ordem não encontrada" });
      }
      
      res.json({ message: "Status atualizado com sucesso" });
    }
  );
});

// IMPORTANTE: Use esta rota específica em vez da rota catch-all "*"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Fechar a conexão com o banco de dados quando o servidor for encerrado
process.on("SIGINT", () => {
  db.close(() => {
    console.log("Conexão com o banco de dados fechada");
    process.exit(0);
  });
});
