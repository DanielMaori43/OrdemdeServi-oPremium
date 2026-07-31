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
console.log("SERVER VERSION:", "ordens-servico-fixed-v2")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

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
    console.log("✅ Conexão com banco OK:", testConnection.rows[0])

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

    console.log("📋 Estrutura da tabela:", tableInfo.rows)
  } catch (err) {
    console.error("❌ ERRO ao criar tabela:", err)
    console.error("Stack:", err.stack)
  }
}

createTable().catch(console.error)

// =====================================================
// LOG DAS REQUISIÇÕES
// =====================================================

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)

  if (req.method === "POST" || req.method === "PUT") {
    console.log("Body:", JSON.stringify(req.body))
  }

  next()
})

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
        createdat AS "createdat",
        updatedat AS "updatedat"
      FROM ordens_servico
      ORDER BY id DESC
    `)

    console.log(`✅ Encontradas ${result.rows.length} ordens`)

    res.json(result.rows)
  } catch (err) {
    console.error("❌ Erro ao buscar ordens:", err)

    res.status(500).json({
      error: "Erro ao buscar ordens de serviço",
      details: err.message,
    })
  }
})

// =====================================================
// GET - UMA ORDEM POR ID
// =====================================================

app.get("/api/ordens/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10)

    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido",
      })
    }

    console.log(`🔍 Buscando ordem com ID ${id}...`)

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
        createdat AS "createdat",
        updatedat AS "updatedat"
      FROM ordens_servico
      WHERE id = $1
      `,
      [id],
    )

    if (result.rows.length === 0) {
      console.log(`❌ Ordem com ID ${id} não encontrada`)

      return res.status(404).json({
        error: "Ordem não encontrada",
      })
    }

    console.log(`✅ Ordem com ID ${id} encontrada`)

    res.json(result.rows[0])
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

    // -------------------------------------------------
    // NORMALIZAÇÃO DOS CAMPOS
    // -------------------------------------------------

    const clientname =
      req.body.clientname ||
      req.body.clientname ||
      req.body["client-name"]

    const clientPhone =
      req.body.clientphone ||
      req.body.clientphone ||
      req.body["client-phone"]

    const deviceType =
      req.body.deviceType ||
      req.body.devicetype ||
      req.body["device-type"]

    const problemDescription =
      req.body.problemDescription ||
      req.body.problemdescription ||
      req.body["problem-description"]

    const priority =
      req.body.priority ||
      req.body.servicePriority ||
      req.body["service-priority"]

    const status = req.body.status || "pendente"

    console.log("Campos extraídos:")
    console.log("- clientname:", clientname)
    console.log("- clientphone:", clientphone)
    console.log("- devicetype:", devicetype)
    console.log("- problemdescription:", problemdescription)
    console.log("- priority:", priority)
    console.log("- status:", status)

    // -------------------------------------------------
    // VERIFICAR CAMPOS OBRIGATÓRIOS
    // -------------------------------------------------

    const missingFields = []

    if (!clientname) {
      missingFields.push("clientname")
    }

    if (!clientPhone) {
      missingFields.push("clientphone")
    }

    if (!deviceType) {
      missingFields.push("devicetype")
    }

    if (!problemDescription) {
      missingFields.push("problemdescription")
    }

    if (!priority) {
      missingFields.push("priority")
    }

    if (missingFields.length > 0) {
      console.error("❌ Campos ausentes:", missingFields)

      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        missingFields,
        receivedFields: Object.keys(req.body),
      })
    }

    // -------------------------------------------------
    // INSERIR NO POSTGRESQL
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
        createdat AS "createdat",
        updatedat AS "updatedat"
      `,
      [
        clientname,
        clientPhone,
        deviceType,
        problemDescription,
        priority,
        status,
      ],
    )

    const createdOrder = result.rows[0]

    console.log("✅ Ordem criada:", createdOrder)

    // -------------------------------------------------
    // RETORNO
    // -------------------------------------------------

    res.status(201).json({
      message: "Ordem criada com sucesso",
      id: createdOrder.id,
      order: createdOrder,
    })
  } catch (err) {
    console.error("❌ Erro ao criar ordem:", err)

    res.status(500).json({
      error: "Erro ao criar ordem",
      details: err.message,
    })
  }
})

// =====================================================
// PUT - ATUALIZAR STATUS
// =====================================================

app.put("/api/ordens/:id/status", async (req, res) => {
  try {
    const { status } = req.body
    const id = Number.parseInt(req.params.id, 10)

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

    const now = new Date()

    const result = await pool.query(
      `
      UPDATE ordens_servico
      SET
        status = $1,
        updatedat = $2
      WHERE id = $3
      RETURNING id, status
      `,
      [status, now, id],
    )

    if (result.rows.length === 0) {
      console.log(
        `❌ Ordem com ID ${id} não encontrada para atualização`,
      )

      return res.status(404).json({
        error: "Ordem não encontrada",
      })
    }

    console.log(
      "✅ Status atualizado:",
      result.rows[0],
    )

    res.json({
      message: "Status atualizado com sucesso",
      order: result.rows[0],
    })
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err)

    res.status(500).json({
      error: "Erro ao atualizar status",
      details: err.message,
    })
  }
})

// =====================================================
// POST - MIGRAR ORDENS DO LOCALSTORAGE
// =====================================================

app.post("/api/ordens/migrate", async (req, res) => {
  try {
    console.log("🔄 Migrando ordem:", req.body)

    if (
      !req.body ||
      typeof req.body !== "object"
    ) {
      return res.status(400).json({
        error: "Dados da ordem são obrigatórios",
      })
    }

    const order = req.body
    const now = new Date()

    // -------------------------------------------------
    // NORMALIZAÇÃO
    // -------------------------------------------------

    const clientname =
      order.clientname ||
      order.clientname

    const clientphone =
      order.clientPhone ||
      order.clientphone

    const devicetype =
      order.deviceType ||
      order.devicetype

    const problemdescription =
      order.problemDescription ||
      order.problemdescription

    const priority = order.priority

    const status =
      order.status ||
      "pendente"

    const createdat =
      order.createdat
        ? new Date(order.createdat)
        : now

    const updatedat =
      order.updatedAt
        ? new Date(order.updatedat)
        : now

    // -------------------------------------------------
    // VALIDAR
    // -------------------------------------------------

    const missingFields = []

    if (!clientname) {
      missingFields.push("clientname")
    }

    if (!clientphone) {
      missingFields.push("clientphone")
    }

    if (!devicetype) {
      missingFields.push("devicetype")
    }

    if (!problemdescription) {
      missingFields.push("problemdescription")
    }

    if (!priority) {
      missingFields.push("priority")
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        missingFields,
      })
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
      },
    )

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
          status,
          createdat,
          updatedat
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        clientname,
        clientphone,
        devicetype,
        problemdescription,
        priority,
        status,
        createdat,
        updatedat,
      ],
    )

    console.log(
      `✅ Ordem migrada, ID: ${result.rows[0].id}`,
    )

    res.json({
      message: "Ordem migrada com sucesso",
      id: result.rows[0].id,
    })
  } catch (err) {
    console.error("❌ Erro ao migrar ordem:", err)

    res.status(500).json({
      error: "Erro ao migrar ordem",
      details: err.message,
    })
  }
})

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

    res.status(404).send(
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
  console.log("🛑 Encerrando servidor...")

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
  console.log("🛑 Recebido SIGTERM...")

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
