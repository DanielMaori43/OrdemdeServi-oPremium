const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// INFORMAÇÕES DO SERVIDOR
// =====================================================

console.log("==========================================");
console.log("=== INICIANDO SERVIDOR ===");
console.log("==========================================");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", PORT);
console.log("SERVER VERSION:", "ordens-servico-public-v4");

// =====================================================
// CONEXÃO COM NEON / POSTGRESQL
// =====================================================

if (!process.env.DATABASE_URL) {
  console.error("❌ ERRO: DATABASE_URL não foi configurada.");
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

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no PostgreSQL:", err);
});

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// ARQUIVOS PÚBLICOS
// =====================================================
//
// TUDO que estiver dentro de /public poderá ser acessado
// diretamente pelo navegador.
//
// Exemplo:
//
// public/script.js      -> /script.js
// public/styles.css     -> /styles.css
// public/img/logo.png   -> /img/logo.png
//
// =====================================================

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

// =====================================================
// FUNÇÃO PARA ENVIAR PÁGINAS DE VIEWS
// =====================================================

function enviarPagina(nomeArquivo, res) {
  const arquivo = path.join(
    __dirname,
    "views",
    nomeArquivo
  );

  return res.sendFile(
    arquivo,
    (err) => {
      if (err) {
        console.error(
          `❌ Erro ao carregar ${nomeArquivo}:`,
          err.message
        );

        if (!res.headersSent) {
          res.status(404).send(
            `Página ${nomeArquivo} não encontrada.`
          );
        }
      }
    }
  );
}

// =====================================================
// PÁGINAS
// =====================================================

app.get("/", (req, res) => {
  enviarPagina("index.html", res);
});

app.get("/index.html", (req, res) => {
  enviarPagina("index.html", res);
});

app.get("/login.html", (req, res) => {
  enviarPagina("login.html", res);
});

app.get("/mesa.html", (req, res) => {
  enviarPagina("mesa.html", res);
});

app.get("/garcom.html", (req, res) => {
  enviarPagina("garcom.html", res);
});

app.get("/caixa.html", (req, res) => {
  enviarPagina("caixa.html", res);
});

// =====================================================
// LOG DAS REQUISIÇÕES
// =====================================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
  );

  if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH"
  ) {
    console.log(
      "Body:",
      JSON.stringify(req.body, null, 2)
    );
  }

  next();
});

// =====================================================
// CRIAR / VERIFICAR TABELA
// =====================================================

async function createTable() {
  try {
    console.log(
      "=== VERIFICANDO/CRIANDO TABELA ==="
    );

    if (!process.env.DATABASE_URL) {
      console.error(
        "❌ DATABASE_URL não configurada."
      );
      return;
    }

    const testConnection = await pool.query(
      "SELECT NOW() AS agora"
    );

    console.log(
      "✅ Conexão com Neon OK:",
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
      "✅ Tabela ordens_servico verificada/criada."
    );

    const tableInfo = await pool.query(`
      SELECT
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
      "❌ ERRO ao verificar/criar tabela:",
      err.message
    );

    console.error("Stack:", err.stack);
  }
}

// =====================================================
// API - TESTE
// =====================================================

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS agora"
    );

    res.json({
      success: true,
      message: "Servidor funcionando.",
      database: "Neon PostgreSQL",
      time: result.rows[0].agora,
    });
  } catch (err) {
    console.error(
      "❌ Erro no teste:",
      err
    );

    res.status(500).json({
      success: false,
      error: "Erro ao conectar ao banco.",
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
      error:
        "Erro ao buscar ordens de serviço.",
      details: err.message,
    });
  }
});

// =====================================================
// GET - UMA ORDEM
// =====================================================

app.get(
  "/api/ordens/:id",
  async (req, res) => {
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
        return res.status(404).json({
          error:
            "Ordem não encontrada.",
        });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(
        "❌ Erro ao buscar ordem:",
        err
      );

      res.status(500).json({
        error:
          "Erro ao buscar ordem.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// POST - CRIAR ORDEM
// =====================================================

app.post("/api/ordens", async (req, res) => {
  try {
    console.log(
      "=== CRIANDO NOVA ORDEM ==="
    );

    if (
      !req.body ||
      typeof req.body !== "object"
    ) {
      return res.status(400).json({
        error:
          "Dados da ordem não recebidos.",
      });
    }

    // -------------------------------------------------
    // ACEITAR VÁRIOS NOMES DE CAMPOS
    // -------------------------------------------------

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

    console.log({
      clientname,
      clientphone,
      devicetype,
      problemdescription,
      priority,
      status,
    });

    // -------------------------------------------------
    // VALIDAR
    // -------------------------------------------------

    const missingFields = [];

    if (!String(clientname).trim()) {
      missingFields.push(
        "clientname"
      );
    }

    if (!String(clientphone).trim()) {
      missingFields.push(
        "clientphone"
      );
    }

    if (!String(devicetype).trim()) {
      missingFields.push(
        "devicetype"
      );
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
      missingFields.push(
        "priority"
      );
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error:
          "Campos obrigatórios ausentes.",
        missingFields,
        receivedFields:
          Object.keys(req.body),
      });
    }

    // -------------------------------------------------
    // INSERIR
    // -------------------------------------------------

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
        String(
          problemdescription
        ).trim(),
        String(priority).trim(),
        String(status).trim(),
      ]
    );

    const order =
      result.rows[0];

    console.log(
      "✅ Ordem criada:",
      order
    );

    res.status(201).json({
      message:
        "Ordem criada com sucesso.",
      id: order.id,
      order,
    });
  } catch (err) {
    console.error(
      "❌ Erro ao criar ordem:",
      err
    );

    res.status(500).json({
      error:
        "Erro ao criar ordem.",
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
      const id =
        Number.parseInt(
          req.params.id,
          10
        );

      const status =
        req.body?.status;

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error:
            "ID inválido.",
        });
      }

      if (
        status === undefined ||
        status === null ||
        String(status).trim() === ""
      ) {
        return res.status(400).json({
          error:
            "Status é obrigatório.",
        });
      }

      const result =
        await pool.query(
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
          [
            String(status).trim(),
            id,
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Ordem não encontrada.",
        });
      }

      console.log(
        "✅ Status atualizado:",
        result.rows[0]
      );

      res.json({
        message:
          "Status atualizado com sucesso.",
        order:
          result.rows[0],
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
// POST - MIGRAR ORDEM
// =====================================================

app.post(
  "/api/ordens/migrate",
  async (req, res) => {
    try {
      console.log(
        "🔄 Migrando ordem..."
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

      const order =
        req.body;

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

      let createdat =
        new Date();

      let updatedat =
        new Date();

      if (order.createdat) {
        const date =
          new Date(
            order.createdat
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          createdat = date;
        }
      }

      if (
        order.updatedat ||
        order.updatedAt
      ) {
        const date =
          new Date(
            order.updatedat ??
              order.updatedAt
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          updatedat = date;
        }
      }

      // -------------------------------------------------
      // VALIDAR
      // -------------------------------------------------

      const missingFields = [];

      if (!String(clientname).trim()) {
        missingFields.push(
          "clientname"
        );
      }

      if (!String(clientphone).trim()) {
        missingFields.push(
          "clientphone"
        );
      }

      if (!String(devicetype).trim()) {
        missingFields.push(
          "devicetype"
        );
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
        missingFields.push(
          "priority"
        );
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error:
            "Campos obrigatórios ausentes.",
          missingFields,
        });
      }

      // -------------------------------------------------
      // INSERIR
      // -------------------------------------------------

      const result =
        await pool.query(
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
            String(
              problemdescription
            ).trim(),
            String(priority).trim(),
            String(status).trim(),
            createdat,
            updatedat,
          ]
        );

      console.log(
        `✅ Ordem migrada: ID ${result.rows[0].id}`
      );

      res.status(201).json({
        message:
          "Ordem migrada com sucesso.",
        id:
          result.rows[0].id,
        order:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "❌ Erro ao migrar ordem:",
        err
      );

      res.status(500).json({
        error:
          "Erro ao migrar ordem.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// DELETE - EXCLUIR ORDEM
// =====================================================

app.delete(
  "/api/ordens/:id",
  async (req, res) => {
    try {
      const id =
        Number.parseInt(
          req.params.id,
          10
        );

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error:
            "ID inválido.",
        });
      }

      const result =
        await pool.query(
          `
          DELETE FROM ordens_servico
          WHERE id = $1
          RETURNING *
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Ordem não encontrada.",
        });
      }

      console.log(
        `✅ Ordem ${id} excluída.`
      );

      res.json({
        message:
          "Ordem excluída com sucesso.",
        order:
          result.rows[0],
      });
    } catch (err) {
      console.error(
        "❌ Erro ao excluir ordem:",
        err
      );

      res.status(500).json({
        error:
          "Erro ao excluir ordem.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// PESQUISAR ORDENS
// =====================================================

app.get(
  "/api/ordens/buscar",
  async (req, res) => {
    try {
      const termo =
        String(
          req.query.termo || ""
        ).trim();

      if (!termo) {
        const result =
          await pool.query(`
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

        return res.json(
          result.rows
        );
      }

      const result =
        await pool.query(
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
          WHERE
            CAST(id AS TEXT) ILIKE $1
            OR clientname ILIKE $1
            OR clientphone ILIKE $1
            OR devicetype ILIKE $1
            OR problemdescription ILIKE $1
            OR priority ILIKE $1
            OR status ILIKE $1
          ORDER BY id DESC
          `,
          [`%${termo}%`]
        );

      res.json(
        result.rows
      );
    } catch (err) {
      console.error(
        "❌ Erro na pesquisa:",
        err
      );

      res.status(500).json({
        error:
          "Erro ao pesquisar ordens.",
        details: err.message,
      });
    }
  }
);

// =====================================================
// ROTA 404 DA API
// =====================================================

app.use(
  "/api",
  (req, res) => {
    console.log(
      `❌ API não encontrada: ${req.method} ${req.originalUrl}`
    );

    res.status(404).json({
      error:
        "Rota da API não encontrada.",
      path:
        req.originalUrl,
    });
  }
);

// =====================================================
// ROTA 404 GERAL
// =====================================================

app.use(
  (req, res) => {
    console.log(
      `❌ Página não encontrada: ${req.method} ${req.originalUrl}`
    );

    res.status(404).send(
      "Página não encontrada."
    );
  }
);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

async function iniciarServidor() {
  try {
    await createTable();

    app.listen(
      PORT,
      () => {
        console.log(
          "=========================================="
        );

        console.log(
          "🚀 SERVIDOR INICIADO COM SUCESSO"
        );

        console.log(
          `🚀 Porta: ${PORT}`
        );

        console.log(
          "🗄️ Banco: Neon PostgreSQL"
        );

        console.log(
          "📁 HTML: /views"
        );

        console.log(
          "📁 Arquivos públicos: /public"
        );

        console.log(
          "📜 JavaScript: /public/script.js"
        );

        console.log(
          "🖼️ Imagens: /public"
        );

        console.log(
          "=========================================="
        );
      }
    );
  } catch (err) {
    console.error(
      "❌ ERRO FATAL AO INICIAR:",
      err
    );

    process.exit(1);
  }
}

iniciarServidor();

// =====================================================
// ENCERRAMENTO
// =====================================================

async function encerrarServidor(
  sinal
) {
  console.log(
    `🛑 Recebido ${sinal}. Encerrando...`
  );

  try {
    await pool.end();

    console.log(
      "✅ Conexão com banco encerrada."
    );
  } catch (err) {
    console.error(
      "❌ Erro ao fechar banco:",
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
