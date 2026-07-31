const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// INFORMAÇÕES DO SERVIDOR
// =====================================================

console.log("=== INICIANDO SERVIDOR ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", PORT);
console.log("SERVER VERSION:", "ordens-servico-fixed-v3");

// =====================================================
// CONEXÃO COM NEON / POSTGRESQL
// =====================================================

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL NÃO FOI CONFIGURADA NO RENDER.");
} else {
  console.log("✅ DATABASE_URL encontrada.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// ARQUIVOS ESTÁTICOS
// =====================================================

// -----------------------------------------------------
// SCRIPT.JS ÚNICO
// -----------------------------------------------------
// O arquivo deve ficar na raiz:
//
// /script.js
//
// E será acessado pelo navegador por:
//
// /script.js
// -----------------------------------------------------

app.get("/script.js", (req, res) => {
  const file = path.join(__dirname, "script.js");

  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }

  console.error("❌ script.js não encontrado:", file);

  return res.status(404).send("script.js não encontrado");
});

// =====================================================
// STYLES.CSS
// =====================================================

// Caso o styles.css esteja na raiz do projeto.
app.get("/styles.css", (req, res) => {
  const file = path.join(__dirname, "styles.css");

  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }

  // Caso esteja dentro de public.
  const publicFile = path.join(
    __dirname,
    "public",
    "styles.css"
  );

  if (fs.existsSync(publicFile)) {
    return res.sendFile(publicFile);
  }

  return res.status(404).send("styles.css não encontrado");
});

// =====================================================
// ARQUIVOS DENTRO DE PUBLIC
// =====================================================

app.use(
  express.static(path.join(__dirname, "public"))
);

// =====================================================
// FUNÇÃO PARA SERVIR PÁGINAS HTML
// =====================================================

function enviarPagina(nomeArquivo, res) {
  const caminhosPossiveis = [
    path.join(__dirname, "public", nomeArquivo),
    path.join(__dirname, "views", nomeArquivo),
  ];

  for (const arquivo of caminhosPossiveis) {
    if (fs.existsSync(arquivo)) {
      return res.sendFile(arquivo);
    }
  }

  console.error(
    `❌ Página ${nomeArquivo} não encontrada.`
  );

  return res.status(404).send(
    `Página ${nomeArquivo} não encontrada.`
  );
}

// =====================================================
// PÁGINAS
// =====================================================

// Página inicial
app.get("/", (req, res) => {
  enviarPagina("index.html", res);
});

// Index
app.get("/index.html", (req, res) => {
  enviarPagina("index.html", res);
});

// Login
app.get("/login.html", (req, res) => {
  enviarPagina("login.html", res);
});

// Mesa
app.get("/mesa.html", (req, res) => {
  enviarPagina("mesa.html", res);
});

// Garçom
app.get("/garcom.html", (req, res) => {
  enviarPagina("garcom.html", res);
});

// Caixa
app.get("/caixa.html", (req, res) => {
  enviarPagina("caixa.html", res);
});

// =====================================================
// CRIAR / VERIFICAR TABELA
// =====================================================

async function createTable() {
  try {
    console.log("=== VERIFICANDO/CRIANDO TABELA ===");

    const testConnection = await pool.query(
      "SELECT NOW()"
    );

    console.log(
      "✅ Conexão com banco OK:",
      testConnection.rows[0]
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        clientname TEXT NOT NULL,
        clientphone TEXT NOT NULL,
        devicetype TEXT NOT NULL,
        problemdescription TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        createdat TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedat TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log(
      "✅ Tabela verificada/criada com sucesso."
    );

    const tableInfo = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'ordens_servico'
      ORDER BY ordinal_position;
    `);

    console.log(
      "📋 Estrutura da tabela:",
      tableInfo.rows
    );
  } catch (err) {
    console.error(
      "❌ ERRO ao criar/verificar tabela:",
      err.message
    );

    console.error("Stack:", err.stack);
  }
}

// =====================================================
// LOG DAS REQUISIÇÕES
// =====================================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url}`
  );

  if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH"
  ) {
    console.log(
      "Body:",
      JSON.stringify(req.body)
    );
  }

  next();
});

// =====================================================
// API - TESTE DO BANCO
// =====================================================

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS agora"
    );

    res.json({
      success: true,
      message: "Servidor e banco funcionando.",
      database: "Neon PostgreSQL",
      time: result.rows[0].agora,
    });
  } catch (err) {
    console.error(
      "❌ Erro no teste do banco:",
      err
    );

    res.status(500).json({
      success: false,
      error: "Erro ao conectar com o banco.",
      details: err.message,
    });
  }
});

// =====================================================
// GET - TODAS AS ORDENS
// =====================================================

app.get("/api/ordens", async (req, res) => {
  try {
    console.log(
      "📋 Buscando todas as ordens..."
    );

    const result = await pool.query(`
      SELECT
        id,
        clientname,
        clientphone,
        devicetype,
        problemdescription,
        priority,
        status,
        createdat,
        updatedat
      FROM ordens_servico
      ORDER BY id DESC
    `);

    console.log(
      `✅ Encontradas ${result.rows.length} ordens`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(
      "❌ Erro ao buscar ordens:",
      err
    );

    res.status(500).json({
      error: "Erro ao buscar ordens de serviço.",
      details: err.message,
    });
  }
});

// =====================================================
// GET - UMA ORDEM POR ID
// =====================================================

app.get("/api/ordens/:id", async (req, res) => {
  try {
    const id = Number.parseInt(
      req.params.id,
      10
    );

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido.",
      });
    }

    console.log(
      `🔍 Buscando ordem com ID ${id}...`
    );

    const result = await pool.query(
      `
      SELECT
        id,
        clientname,
        clientphone,
        devicetype,
        problemdescription,
        priority,
        status,
        createdat,
        updatedat
      FROM ordens_servico
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      console.log(
        `❌ Ordem com ID ${id} não encontrada.`
      );

      return res.status(404).json({
        error: "Ordem não encontrada.",
      });
    }

    console.log(
      `✅ Ordem com ID ${id} encontrada.`
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(
      `❌ Erro ao buscar ordem ${req.params.id}:`,
      err
    );

    res.status(500).json({
      error: "Erro ao buscar ordem.",
      details: err.message,
    });
  }
});

// =====================================================
// POST - NOVA ORDEM
// =====================================================

app.post("/api/ordens", async (req, res) => {
  try {
    console.log("\n=== NOVA ORDEM ===");

    console.log(
      "Body recebido:",
      JSON.stringify(req.body, null, 2)
    );

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Object.keys(req.body).length === 0
    ) {
      console.error("❌ Body vazio.");

      return res.status(400).json({
        error: "Dados não recebidos.",
        receivedBody: req.body,
      });
    }

    // =================================================
    // NORMALIZAÇÃO DOS CAMPOS
    // =================================================

    const clientname =
      req.body.clientName ??
      req.body.clientname ??
      req.body["client-name"] ??
      "";

    const clientphone =
      req.body.clientPhone ??
      req.body.clientphone ??
      req.body["client-phone"] ??
      "";

    const devicetype =
      req.body.deviceType ??
      req.body.devicetype ??
      req.body["device-type"] ??
      "";

    const problemdescription =
      req.body.problemDescription ??
      req.body.problemdescription ??
      req.body["problem-description"] ??
      "";

    const priority =
      req.body.priority ??
      req.body.servicePriority ??
      req.body["service-priority"] ??
      "";

    const status =
      req.body.status ??
      "pendente";

    console.log("Campos extraídos:");
    console.log("- clientname:", clientname);
    console.log("- clientphone:", clientphone);
    console.log("- devicetype:", devicetype);
    console.log(
      "- problemdescription:",
      problemdescription
    );
    console.log("- priority:", priority);
    console.log("- status:", status);

    // =================================================
    // VERIFICAR CAMPOS OBRIGATÓRIOS
    // =================================================

    const missingFields = [];

    if (!String(clientname).trim()) {
      missingFields.push("clientname");
    }

    if (!String(clientphone).trim()) {
      missingFields.push("clientphone");
    }

    if (!String(devicetype).trim()) {
      missingFields.push("devicetype");
    }

    if (!String(problemdescription).trim()) {
      missingFields.push("problemdescription");
    }

    if (!String(priority).trim()) {
      missingFields.push("priority");
    }

    if (missingFields.length > 0) {
      console.error(
        "❌ Campos ausentes:",
        missingFields
      );

      return res.status(400).json({
        error: "Campos obrigatórios ausentes.",
        missingFields,
        receivedFields: Object.keys(req.body),
      });
    }

    // =================================================
    // INSERIR NO POSTGRESQL
    // =================================================

    const result = await pool.query(
      `
      INSERT INTO ordens_servico
      (
        clientname,
        clientphone,
        devicetype,
        problemdescription,
        priority,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        clientname,
        clientphone,
        devicetype,
        problemdescription,
        priority,
        status,
        createdat,
        updatedat
      `,
      [
        String(clientname).trim(),
        String(clientphone).trim(),
        String(devicetype).trim(),
        String(problemdescription).trim(),
        String(priority).trim(),
        String(status).trim(),
      ]
    );

    const createdOrder =
      result.rows[0];

    console.log(
      "✅ Ordem criada:",
      createdOrder
    );

    res.status(201).json({
      message: "Ordem criada com sucesso.",
      id: createdOrder.id,
      order: createdOrder,
    });
  } catch (err) {
    console.error(
      "❌ Erro ao criar ordem:",
      err
    );

    res.status(500).json({
      error: "Erro ao criar ordem.",
      details: err.message,
    });
  }
});

// =====================================================
// PUT - ATUALIZAR STATUS
// =====================================================

app.put(
  "/api/ordens/:id/status",
  async (req, res) => {
    try {
      const { status } = req.body;

      const id = Number.parseInt(
        req.params.id,
        10
      );

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido.",
        });
      }

      if (
        status === undefined ||
        status === null ||
        String(status).trim() === ""
      ) {
        return res.status(400).json({
          error: "Status é obrigatório.",
        });
      }

      console.log(
        `🔄 Atualizando status da ordem ${id} para: ${status}`
      );

      const result = await pool.query(
        `
        UPDATE ordens_servico
        SET
          status = $1,
          updatedat = NOW()
        WHERE id = $2
        RETURNING
          id,
          status,
          updatedat
        `,
        [String(status).trim(), id]
      );

      if (result.rows.length === 0) {
        console.log(
          `❌ Ordem ${id} não encontrada.`
        );

        return res.status(404).json({
          error: "Ordem não encontrada.",
        });
      }

      console.log(
        "✅ Status atualizado:",
        result.rows[0]
      );

      res.json({
        message:
          "Status atualizado com sucesso.",
        order: result.rows[0],
      });
    } catch (err) {
      console.error(
        "❌ Erro ao atualizar status:",
        err
      );

      res.status(500).json({
        error:
          "Erro ao atualizar status.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// POST - MIGRAR ORDEM DO LOCALSTORAGE
// =====================================================

app.post(
  "/api/ordens/migrate",
  async (req, res) => {
    try {
      console.log(
        "🔄 Migrando ordem:",
        JSON.stringify(req.body, null, 2)
      );

      if (
        !req.body ||
        typeof req.body !== "object"
      ) {
        return res.status(400).json({
          error:
            "Dados da ordem são obrigatórios.",
        });
      }

      const order = req.body;

      const now = new Date();

      // =================================================
      // NORMALIZAÇÃO
      // =================================================

      const clientname =
        order.clientName ??
        order.clientname ??
        order["client-name"] ??
        "";

      const clientphone =
        order.clientPhone ??
        order.clientphone ??
        order["client-phone"] ??
        "";

      const devicetype =
        order.deviceType ??
        order.devicetype ??
        order["device-type"] ??
        "";

      const problemdescription =
        order.problemDescription ??
        order.problemdescription ??
        order["problem-description"] ??
        "";

      const priority =
        order.priority ??
        order.servicePriority ??
        order["service-priority"] ??
        "";

      const status =
        order.status ??
        "pendente";

      let createdat = now;

      if (order.createdat) {
        const dataCriacao = new Date(
          order.createdat
        );

        if (!Number.isNaN(dataCriacao.getTime())) {
          createdat = dataCriacao;
        }
      }

      let updatedat = now;

      if (
        order.updatedat ||
        order.updatedAt
      ) {
        const dataAtualizacao =
          new Date(
            order.updatedat ??
            order.updatedAt
          );

        if (
          !Number.isNaN(
            dataAtualizacao.getTime()
          )
        ) {
          updatedat = dataAtualizacao;
        }
      }

      // =================================================
      // VALIDAR
      // =================================================

      const missingFields = [];

      if (!String(clientname).trim()) {
        missingFields.push("clientname");
      }

      if (!String(clientphone).trim()) {
        missingFields.push("clientphone");
      }

      if (!String(devicetype).trim()) {
        missingFields.push("devicetype");
      }

      if (
        !String(
          problemdescription
        ).trim()
      ) {
        missingFields.push(
          "problemdescription"
        );
      }

      if (!String(priority).trim()) {
        missingFields.push("priority");
      }

      if (missingFields.length > 0) {
        console.error(
          "❌ Campos ausentes na migração:",
          missingFields
        );

        return res.status(400).json({
          error:
            "Campos obrigatórios ausentes.",
          missingFields,
        });
      }

      console.log(
        "Dados normalizados para migração:",
        {
          clientname,
          clientphone,
          devicetype,
          problemdescription,
          priority,
          status,
          createdat,
          updatedat,
        }
      );

      // =================================================
      // INSERIR
      // =================================================

      const result = await pool.query(
        `
        INSERT INTO ordens_servico
        (
          clientname,
          clientphone,
          devicetype,
          problemdescription,
          priority,
          status,
          createdat,
          updatedat
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          clientname,
          clientphone,
          devicetype,
          problemdescription,
          priority,
          status,
          createdat,
          updatedat
        `,
        [
          String(clientname).trim(),
          String(clientphone).trim(),
          String(devicetype).trim(),
          String(problemdescription).trim(),
          String(priority).trim(),
          String(status).trim(),
          createdat,
          updatedat,
        ]
      );

      console.log(
        `✅ Ordem migrada. ID: ${result.rows[0].id}`
      );

      res.status(201).json({
        message:
          "Ordem migrada com sucesso.",
        id: result.rows[0].id,
        order: result.rows[0],
      });
    } catch (err) {
      console.error(
        "❌ Erro ao migrar ordem:",
        err
      );

      res.status(500).json({
        error: "Erro ao migrar ordem.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// ROTA 404 PARA API
// =====================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "Rota da API não encontrada.",
    method: req.method,
    path: req.originalUrl,
  });
});

// =====================================================
// ROTA 404 PARA OUTRAS PÁGINAS
// =====================================================

app.use((req, res) => {
  console.log(
    `❌ Rota não encontrada: ${req.method} ${req.originalUrl}`
  );

  res.status(404).send(
    "Página não encontrada."
  );
});

// =====================================================
// ERRO GLOBAL
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "❌ ERRO INTERNO:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
      error:
        "Erro interno do servidor.",
      details: err.message,
    });
  }
);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function iniciarServidor() {
  await createTable();

  app.listen(PORT, () => {
    console.log(
      "=========================================="
    );

    console.log(
      `🚀 Servidor rodando na porta ${PORT}`
    );

    console.log(
      `📱 Porta configurada: ${PORT}`
    );

    console.log(
      "🗄️ Banco: Neon PostgreSQL"
    );

    console.log(
      "📄 JavaScript: /script.js"
    );

    console.log(
      "=========================================="
    );
  });
}

iniciarServidor().catch(
  (err) => {
    console.error(
      "❌ Erro fatal ao iniciar servidor:",
      err
    );
  }
);

// =====================================================
// ENCERRAMENTO
// =====================================================

async function encerrarServidor(
  sinal
) {
  console.log(
    `🛑 Recebido ${sinal}. Encerrando servidor...`
  );

  try {
    await pool.end();

    console.log(
      "✅ Pool de conexões fechado."
    );
  } catch (err) {
    console.error(
      "❌ Erro ao fechar pool:",
      err
    );
  }

  process.exit(0);
}

process.on(
  "SIGINT",
  () => encerrarServidor("SIGINT")
);

process.on(
  "SIGTERM",
  () => encerrarServidor("SIGTERM")
);
