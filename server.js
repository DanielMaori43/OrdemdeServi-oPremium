const express = require("express")
const { Pool } = require("pg")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

console.log("=== INICIANDO SERVIDOR ===")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("PORT:", PORT)
console.log("SERVER VERSION:", "ordens-servico-fixed-v3")

// =====================================================
// CONEXÃO COM POSTGRESQL
// =====================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// =====================================================
// CRIAR / VERIFICAR TABELA
// =====================================================

const createTable = async () => {
  try {
    console.log("=== VERIFICANDO/CRIANDO TABELA ===")

    const testConnection = await pool.query("SELECT NOW()")

    console.log(
      "✅ Conexão com banco OK:",
      testConnection.rows[0],
    )

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
    `)

    console.log("✅ Tabela verificada/criada com sucesso")

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
    `)

    console.log(
      "📋 Estrutura da tabela:",
      tableInfo.rows,
    )
  } catch (err) {
    console.error(
      "❌ ERRO ao criar/verificar tabela:",
      err,
    )

    console.error("Stack:", err.stack)
  }
}

createTable().catch(console.error)

// =====================================================
// LOG DAS REQUISIÇÕES
// =====================================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url}`,
  )

  if (req.method === "POST" || req.method === "PUT") {
    console.log(
      "Body:",
      JSON.stringify(req.body, null, 2),
    )
  }

  next()
})

// =====================================================
// FUNÇÃO AUXILIAR
// NORMALIZAR UMA ORDEM PARA O FRONTEND
// =====================================================

function normalizeOrder(order) {
  if (!order) {
    return null
  }

  return {
    id: order.id,

    clientName:
      order.clientName ??
      order.clientname ??
      "",

    clientPhone:
      order.clientPhone ??
      order.clientphone ??
      "",

    deviceType:
      order.deviceType ??
      order.devicetype ??
      "",

    problemDescription:
      order.problemDescription ??
      order.problemdescription ??
      "",

    priority:
      order.priority ??
      "",

    status:
      order.status ??
      "pendente",

    createdAt:
      order.createdAt ??
      order.createdat ??
      null,

    updatedAt:
      order.updatedAt ??
      order.updatedat ??
      null,
  }
}

// =====================================================
// GET - TODAS AS ORDENS
// =====================================================

app.get("/api/ordens", async (req, res) => {
  try {
    console.log("📋 Buscando todas as ordens...")

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
    `)

    const orders = result.rows.map(normalizeOrder)

    console.log(
      `✅ Encontradas ${orders.length} ordens`,
    )

    res.json(orders)
  } catch (err) {
    console.error(
      "❌ Erro ao buscar ordens:",
      err,
    )

    res.status(500).json({
      error: "Erro ao buscar ordens de serviço",
      details: err.message,
    })
  }
})

// =====================================================
// GET - UMA ORDEM PELO ID
// =====================================================

app.get("/api/ordens/:id", async (req, res) => {
  try {
    const id = Number.parseInt(
      req.params.id,
      10,
    )

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      })
    }

    console.log(
      `🔍 Buscando ordem com ID ${id}...`,
    )

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
      [id],
    )

    if (result.rows.length === 0) {
      console.log(
        `❌ Ordem com ID ${id} não encontrada`,
      )

      return res.status(404).json({
        error: "Ordem não encontrada",
      })
    }

    const order = normalizeOrder(
      result.rows[0],
    )

    console.log(
      `✅ Ordem com ID ${id} encontrada`,
    )

    res.json(order)
  } catch (err) {
    console.error(
      `❌ Erro ao buscar ordem com ID ${req.params.id}:`,
      err,
    )

    res.status(500).json({
      error: "Erro ao buscar ordem",
      details: err.message,
    })
  }
})

// =====================================================
// POST - NOVA ORDEM
// =====================================================

app.post("/api/ordens", async (req, res) => {
  try {
    console.log("\n=== NOVA ORDEM ===")

    console.log(
      "Body recebido:",
      JSON.stringify(req.body, null, 2),
    )

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Object.keys(req.body).length === 0
    ) {
      console.error("❌ Body vazio")

      return res.status(400).json({
        error: "Dados não recebidos",
        receivedBody: req.body,
      })
    }

    // =================================================
    // NORMALIZAR CAMPOS RECEBIDOS
    // =================================================

    const clientName =
      req.body.clientName ??
      req.body.clientname ??
      req.body["client-name"]

    const clientPhone =
      req.body.clientPhone ??
      req.body.clientphone ??
      req.body["client-phone"]

    const deviceType =
      req.body.deviceType ??
      req.body.devicetype ??
      req.body["device-type"]

    const problemDescription =
      req.body.problemDescription ??
      req.body.problemdescription ??
      req.body["problem-description"]

    const priority =
      req.body.priority ??
      req.body.servicePriority ??
      req.body["service-priority"]

    const status =
      req.body.status ??
      "pendente"

    console.log("Campos extraídos:")
    console.log("- clientName:", clientName)
    console.log("- clientPhone:", clientPhone)
    console.log("- deviceType:", deviceType)
    console.log(
      "- problemDescription:",
      problemDescription,
    )
    console.log("- priority:", priority)
    console.log("- status:", status)

    // =================================================
    // VALIDAR CAMPOS
    // =================================================

    const missingFields = []

    if (!clientName) {
      missingFields.push("clientName")
    }

    if (!clientPhone) {
      missingFields.push("clientPhone")
    }

    if (!deviceType) {
      missingFields.push("deviceType")
    }

    if (!problemDescription) {
      missingFields.push(
        "problemDescription",
      )
    }

    if (!priority) {
      missingFields.push("priority")
    }

    if (missingFields.length > 0) {
      console.error(
        "❌ Campos ausentes:",
        missingFields,
      )

      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        missingFields,
        receivedFields:
          Object.keys(req.body),
      })
    }

    // =================================================
    // INSERIR NO BANCO
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
        clientName,
        clientPhone,
        deviceType,
        problemDescription,
        priority,
        status,
      ],
    )

    const createdOrder =
      normalizeOrder(result.rows[0])

    console.log(
      "✅ Ordem criada:",
      createdOrder,
    )

    // =================================================
    // RETORNO
    // =================================================

    res.status(201).json({
      message: "Ordem criada com sucesso",

      id: createdOrder.id,

      order: createdOrder,
    })
  } catch (err) {
    console.error(
      "❌ Erro ao criar ordem:",
      err,
    )

    res.status(500).json({
      error: "Erro ao criar ordem",
      details: err.message,
    })
  }
})

// =====================================================
// PUT - ATUALIZAR STATUS
// =====================================================

app.put(
  "/api/ordens/:id/status",
  async (req, res) => {
    try {
      const { status } = req.body

      const id = Number.parseInt(
        req.params.id,
        10,
      )

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido",
        })
      }

      if (!status) {
        return res.status(400).json({
          error: "Status é obrigatório",
        })
      }

      console.log(
        `🔄 Atualizando status da ordem ${id} para: ${status}`,
      )

      const result = await pool.query(
        `
        UPDATE ordens_servico
        SET
          status = $1,
          updatedat = NOW()
        WHERE id = $2
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
          status,
          id,
        ],
      )

      if (result.rows.length === 0) {
        console.log(
          `❌ Ordem com ID ${id} não encontrada`,
        )

        return res.status(404).json({
          error: "Ordem não encontrada",
        })
      }

      const updatedOrder =
        normalizeOrder(result.rows[0])

      console.log(
        "✅ Status atualizado:",
        updatedOrder,
      )

      res.json({
        message:
          "Status atualizado com sucesso",

        order: updatedOrder,
      })
    } catch (err) {
      console.error(
        "❌ Erro ao atualizar status:",
        err,
      )

      res.status(500).json({
        error: "Erro ao atualizar status",
        details: err.message,
      })
    }
  },
)

// =====================================================
// POST - MIGRAR LOCALSTORAGE
// =====================================================

app.post(
  "/api/ordens/migrate",
  async (req, res) => {
    try {
      console.log(
        "🔄 Migrando ordem:",
        req.body,
      )

      if (
        !req.body ||
        typeof req.body !== "object"
      ) {
        return res.status(400).json({
          error:
            "Dados da ordem são obrigatórios",
        })
      }

      const order = req.body

      // =================================================
      // NORMALIZAR DADOS
      // =================================================

      const clientName =
        order.clientName ??
        order.clientname ??
        ""

      const clientPhone =
        order.clientPhone ??
        order.clientphone ??
        ""

      const deviceType =
        order.deviceType ??
        order.devicetype ??
        ""

      const problemDescription =
        order.problemDescription ??
        order.problemdescription ??
        ""

      const priority =
        order.priority ??
        ""

      const status =
        order.status ??
        "pendente"

      const createdValue =
        order.createdAt ??
        order.createdat

      const updatedValue =
        order.updatedAt ??
        order.updatedat

      const createdAt =
        createdValue &&
        !Number.isNaN(
          new Date(createdValue).getTime(),
        )
          ? new Date(createdValue)
          : new Date()

      const updatedAt =
        updatedValue &&
        !Number.isNaN(
          new Date(updatedValue).getTime(),
        )
          ? new Date(updatedValue)
          : new Date()

      // =================================================
      // VALIDAR
      // =================================================

      const missingFields = []

      if (!clientName) {
        missingFields.push("clientName")
      }

      if (!clientPhone) {
        missingFields.push("clientPhone")
      }

      if (!deviceType) {
        missingFields.push("deviceType")
      }

      if (!problemDescription) {
        missingFields.push(
          "problemDescription",
        )
      }

      if (!priority) {
        missingFields.push("priority")
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error:
            "Campos obrigatórios ausentes",

          missingFields,
        })
      }

      console.log(
        "Dados normalizados para migração:",
        {
          clientName,
          clientPhone,
          deviceType,
          problemDescription,
          priority,
          status,
          createdAt,
          updatedAt,
        },
      )

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
          clientName,
          clientPhone,
          deviceType,
          problemDescription,
          priority,
          status,
          createdAt,
          updatedAt,
        ],
      )

      const migratedOrder =
        normalizeOrder(result.rows[0])

      console.log(
        `✅ Ordem migrada, ID: ${migratedOrder.id}`,
      )

      res.json({
        message:
          "Ordem migrada com sucesso",

        id: migratedOrder.id,

        order: migratedOrder,
      })
    } catch (err) {
      console.error(
        "❌ Erro ao migrar ordem:",
        err,
      )

      res.status(500).json({
        error: "Erro ao migrar ordem",
        details: err.message,
      })
    }
  },
)

// =====================================================
// PÁGINA INICIAL
// =====================================================

app.get("*", (req, res) => {
  const indexPath = path.join(
    __dirname,
    "public",
    "index.html",
  )

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    console.log(
      "❌ Arquivo index.html não encontrado em:",
      indexPath,
    )

    res
      .status(404)
      .send(
        "Página não encontrada - index.html não existe.",
      )
  }
})

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT}`,
  )

  console.log(
    `📱 Acesse: http://localhost:${PORT}`,
  )
})

// =====================================================
// ENCERRAMENTO
// =====================================================

process.on("SIGINT", async () => {
  console.log(
    "🛑 Encerrando servidor...",
  )

  try {
    await pool.end()

    console.log(
      "✅ Pool de conexões fechado",
    )
  } catch (err) {
    console.error(
      "❌ Erro ao fechar pool:",
      err,
    )
  }

  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log(
    "🛑 Recebido SIGTERM...",
  )

  try {
    await pool.end()

    console.log(
      "✅ Pool de conexões fechado",
    )
  } catch (err) {
    console.error(
      "❌ Erro ao fechar pool:",
      err,
    )
  }

  process.exit(0)
})
