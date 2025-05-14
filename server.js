const express = require("express")
const { Pool } = require("pg")
const cors = require("cors")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

// Conexão com PostgreSQL no Render
const pool = new Pool({
  connectionString:
    "postgresql://ordens_servico_db_user:I0TFfW1JebXihjJVGMvAXHIAjcYyKdQV@dpg-d0hs9g3uibrs739nkvsg-a/ordens_servico_db",
  ssl: {
    rejectUnauthorized: false,
  },
})

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// Criar tabela se não existir
const createTable = async () => {
  try {
    console.log("Tentando criar tabela se não existir...")
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        clientname TEXT NOT NULL,
        clientphone TEXT NOT NULL,
        devicetype TEXT NOT NULL,
        problemdescription TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        createdat TIMESTAMP NOT NULL,
        updatedat TIMESTAMP NOT NULL
      );
    `)
    console.log("Tabela verificada/criada com sucesso")
  } catch (err) {
    console.error("Erro ao criar tabela:", err)
  }
}

createTable().catch(console.error)

// Middleware para debug de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Body:", JSON.stringify(req.body))
  }
  next()
})

// Rota para obter todas as ordens
app.get("/api/ordens", async (req, res) => {
  try {
    console.log("Buscando todas as ordens...")
    const result = await pool.query("SELECT * FROM ordens_servico ORDER BY id DESC")
    console.log(`Encontradas ${result.rows.length} ordens`)
    res.json(result.rows)
  } catch (err) {
    console.error("Erro ao buscar ordens:", err)
    res.status(500).json({ error: err.message })
  }
})

// GET uma ordem específica pelo ID
app.get("/api/ordens/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" })
  }

  try {
    console.log(`Buscando ordem com ID ${id}...`)
    const result = await pool.query("SELECT * FROM ordens_servico WHERE id = $1", [id])
    if (result.rows.length === 0) {
      console.log(`Ordem com ID ${id} não encontrada`)
      return res.status(404).json({ error: "Ordem não encontrada" })
    }
    console.log(`Ordem com ID ${id} encontrada`)
    res.json(result.rows[0])
  } catch (err) {
    console.error(`Erro ao buscar ordem com ID ${id}:`, err)
    res.status(500).json({ error: err.message })
  }
})

// POST nova ordem
app.post("/api/ordens", async (req, res) => {
  try {
    console.log("Recebendo nova ordem:", req.body)

    // Extrair campos do corpo da requisição
    // Aceitar tanto camelCase quanto lowercase
    const clientName = req.body.clientName || req.body.clientname
    const clientPhone = req.body.clientPhone || req.body.clientphone
    const deviceType = req.body.deviceType || req.body.devicetype
    const problemDescription = req.body.problemDescription || req.body.problemdescription
    const priority = req.body.priority

    // Verificar se todos os campos necessários estão presentes
    if (!clientName || !clientPhone || !deviceType || !problemDescription || !priority) {
      console.error("Campos obrigatórios ausentes:", {
        clientName,
        clientPhone,
        deviceType,
        problemDescription,
        priority,
      })
      return res.status(400).json({
        error: "Todos os campos são obrigatórios",
        receivedData: req.body,
      })
    }

    const now = new Date()
    console.log("Inserindo nova ordem no banco de dados...")

    const result = await pool.query(
      `INSERT INTO ordens_servico (clientname, clientphone, devicetype, problemdescription, priority, status, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, 'pendente', $6, $6) RETURNING id`,
      [clientName, clientPhone, deviceType, problemDescription, priority, now],
    )

    console.log(`Nova ordem criada com ID ${result.rows[0].id}`)
    res.json({ id: result.rows[0].id, message: "Ordem de serviço criada com sucesso" })
  } catch (err) {
    console.error("Erro ao criar ordem:", err)
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      receivedData: req.body,
    })
  }
})

// PUT atualizar status
app.put("/api/ordens/:id/status", async (req, res) => {
  try {
    const { status } = req.body
    const id = Number.parseInt(req.params.id)

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" })
    }

    console.log(`Atualizando status da ordem ${id} para ${status}...`)
    const now = new Date()

    const result = await pool.query("UPDATE ordens_servico SET status = $1, updatedat = $2 WHERE id = $3 RETURNING *", [
      status,
      now,
      id,
    ])

    if (result.rows.length === 0) {
      console.log(`Ordem com ID ${id} não encontrada para atualização`)
      return res.status(404).json({ error: "Ordem não encontrada" })
    }

    console.log(`Status da ordem ${id} atualizado com sucesso`)
    res.json({ message: "Status atualizado com sucesso" })
  } catch (err) {
    console.error(`Erro ao atualizar status da ordem:`, err)
    res.status(500).json({ error: err.message })
  }
})

// Rota para migrar ordens
app.post("/api/ordens/migrate", async (req, res) => {
  try {
    const order = req.body
    console.log("Recebendo ordem para migração:", order)

    if (!order) {
      return res.status(400).json({ error: "Dados da ordem são obrigatórios" })
    }

    const now = new Date()

    // Adaptar os nomes dos campos para o formato do banco
    const clientname = order.clientName || order.clientname
    const clientphone = order.clientPhone || order.clientphone
    const devicetype = order["device-Type"] || order["device-type"] || order.deviceType || order.devicetype
    const problemdescription = order["problem-Description"] || order["problem-description"] || order.problemDescription || order.problemdescription
    const createdat = order.createdAt || order.createdat || now
    const updatedat = order.updatedAt || order.updatedat || now
    console.log("Dados normalizados para migração:", {
      clientname,
      clientphone,
      devicetype,
      problemdescription,
      priority: order.priority,
      status: order.status,
    })

    const result = await pool.query(
      `INSERT INTO ordens_servico (clientname, clientphone, devicetype, problemdescription, priority, status, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        clientname,
        clientphone,
        device-type,
        problem-description,
        order.priority,
        order.status || "pendente",
        createdat,
        updatedat,
      ],
    )

    console.log(`Ordem migrada com sucesso, ID: ${result.rows[0].id}`)
    res.json({ message: "Ordem migrada com sucesso", id: result.rows[0].id })
  } catch (err) {
    console.error("Erro ao migrar ordem:", err)
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      receivedData: req.body,
    })
  }
})

// Página inicial
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})


// Fechar a conexão com o banco de dados quando o servidor for encerrado
process.on("SIGINT", () => {
  pool.end(() => {
    console.log("Conexão com o banco de dados fechada")
    process.exit(0)
  })
})
