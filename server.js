const express = require('express');
const cors = require('cors');
const path = require('path');
const util = require('util');

const app = express();
const routes = require('./routes');
const db = require('./db');

// Transforma db.all() em uma função baseada em Promise
db.all = util.promisify(db.all);

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do diretório "public"
app.use(express.static(path.join(__dirname, '../public')));

// Usar rotas principais
app.use('/', routes);

// Rota para buscar ordens finalizadas
app.get('/ordens/finalizadas', async (req, res) => {
  try {
    const finalizadas = await db.all("SELECT * FROM ordens WHERE status = 'finalizada'");
    res.json(finalizadas);
  } catch (err) {
    console.error("Erro ao buscar ordens finalizadas:", err.message);
    res.status(500).json({ error: "Erro ao buscar ordens finalizadas" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
