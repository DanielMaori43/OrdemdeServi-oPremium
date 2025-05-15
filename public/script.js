 
// URL base da sua API no Render
const API_BASE = "https://ordemdeservi-opremium.onrender.com";

// Variável global para armazenar as ordens
let serviceOrders = [];

// Função para carregar todas as ordens do servidor
async function loadServiceOrders() {
  try {
    const response = await fetch(`${API_BASE}/api/ordens`);
    if (!response.ok) {
      throw new Error("Erro ao carregar ordens de serviço");
    }
    serviceOrders = await response.json();
    return serviceOrders;
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível carregar as ordens de serviço. Tente novamente mais tarde.");
    return [];
  }
}

// Função para criar uma nova ordem de serviço
async function createServiceOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/api/ordens`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar ordem de serviço");
    }

    const result = await response.json();

    // Recarregar as ordens após criar uma nova
    await loadServiceOrders();

    return result;
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível criar a ordem de serviço. Tente novamente mais tarde.");
    throw error;
  }
}

// Função para atualizar o status de uma ordem
async function updateOrderStatusAPI(orderId, newStatus) {
  try {
    const response = await fetch(`${API_BASE}/api/ordens/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar status da ordem");
    }

    const result = await response.json();

    // Recarregar as ordens após atualizar
    await loadServiceOrders();

    return result;
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível atualizar o status da ordem. Tente novamente mais tarde.");
    throw error;
  }
}

// Função para migrar dados do localStorage para o servidor
async function migrateLocalStorageToServer() {
  const localOrders = JSON.parse(localStorage.getItem("serviceOrders")) || []

  if (localOrders.length > 0) {
    if (
      confirm(
        "Foram encontradas " +
          localOrders.length +
          " ordens de serviço salvas localmente. Deseja migrá-las para o servidor?",
      )
    ) {
      console.log("Iniciando migração de dados...")

      let migratedCount = 0
      for (const order of localOrders) {
        try {
          const response = await fetch(`${API_BASE}/api/ordens/migrate`, {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify(order),
          })

          if (response.ok) {
            migratedCount++
            console.log(`Ordem #${order.id} migrada com sucesso`)
          }
        } catch (error) {
          console.error(`Erro ao migrar ordem #${order.id}:`, error)
        }
      }

      alert(`Migração concluída! ${migratedCount} de ${localOrders.length} ordens foram migradas para o servidor.`)

      // Limpar localStorage apenas se todas as ordens foram migradas com sucesso
      if (migratedCount === localOrders.length) {
        localStorage.removeItem("serviceOrders")
        localStorage.removeItem("currentOrderId")
        console.log("Dados locais removidos após migração bem-sucedida")
      }
    }
  }
}

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Primeiro, tente migrar os dados
  await migrateLocalStorageToServer()

  // Depois, carregue as ordens do servidor
  await loadServiceOrders()

  // Get all option items
  const optionItems = document.querySelectorAll(".option-item")

  // Add click event listeners to each option
  optionItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Get the option text
      const optionText = this.querySelector("p").textContent

      // Here you would typically handle the specific action
      // based on which option was clicked
      handleOptionClick(optionText)
    })
  })

  // WhatsApp button click handler
  const whatsappButton = document.querySelector(".whatsapp-button")
  whatsappButton.addEventListener("click", () => {
    // Replace with your actual WhatsApp number
    const phoneNumber = "5500000000000" // Format: country code + number
    const message = "Olá, gostaria de mais informações sobre os serviços."

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")
  })

  // Function to handle specific option clicks
  function handleOptionClick(option) {
    console.log(`Opção selecionada: ${option}`)

    switch (option) {
      case "Nova Ordem de Serviço":
        // Code to handle new service order
        console.log("Criando nova ordem de serviço...")
        showNewServiceOrderForm()
        break

      case "Status da ordem de serviço":
        // Code to check service order status
        console.log("Verificando status da ordem de serviço...")
        checkServiceOrderStatus()
        break

      case "Imprimir":
        // Code to handle printing
        console.log("Preparando para imprimir...")
        printServiceOrder()
        break

      case "Cancelar última ordem de serviço":
        // Code to cancel last service order
        console.log("Cancelando última ordem de serviço...")
        cancelLastServiceOrder()
        break

      case "Pesquisar Pendentes":
        // Code to search pending orders
        console.log("Pesquisando ordens pendentes...")
        searchPendingOrders()
        break

      case "Pesquisar Finalizados":
        // Code to search completed orders
        console.log("Pesquisando ordens finalizadas...")
        searchCompletedOrders()
        break

      case "Finalizar ordem":
        // Code to finish an order
        console.log("Finalizando ordem...")
        finishOrder()
        break

      case "Rastreio":
        // Code to track an order
        console.log("Rastreando ordem...")
        trackOrder()
        break

      default:
        console.log("Opção desconhecida selecionada")
    }
  }

  // Função para mostrar formulário de nova ordem de serviço
  function showNewServiceOrderForm() {
    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Conteúdo do modal
    modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Nova Ordem de Serviço</h2>
                <form id="service-order-form">
                    <div class="form-group">
                        <label for="clientname">Nome do Cliente:</label>
                        <input type="text" id="clientname" required>
                    </div>
                    <div class="form-group">
                        <label for="clientphone">Telefone:</label>
                        <input type="tel" id="clientphone" required>
                    </div>
                    <div class="form-group">
                        <label for="devicetype">Tipo de Dispositivo:</label>
                        <select id="devicetype" required>
                            <option value="">Selecione...</option>
                            <option value="notebook">Notebook</option>
                            <option value="desktop">Desktop</option>
                            <option value="smartphone">Smartphone</option>
                            <option value="tablet">Tablet</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="problemdescription">Descrição do Problema:</label>
                        <textarea id="problemdescription" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="service-priority">Prioridade:</label>
                        <select id="service-priority" required>
                            <option value="baixa">Baixa</option>
                            <option value="media" selected>Média</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>
                    <button type="submit" class="submit-button">Criar Ordem de Serviço</button>
                </form>
            </div>
        `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#service-order-form")
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Criar nova ordem de serviço
      const newOrder = {
        clientname: document.getElementById("clientname").value,
        clientphone: document.getElementById("clientphone").value,
        devicetype: document.getElementById("devicetype").value,
        problemdescription: document.getElementById("problemdescription").value,
        priority: document.getElementById("service-priority").value,
      }
      

      try {
        // Enviar para o servidor
        const result = await createServiceOrder(newOrder)

        // Mostrar confirmação
        alert(`Ordem de Serviço #${result.id} criada com sucesso!`)

        // Fechar o modal
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()
        }, 300)
      } catch (error) {
        console.error("Erro ao criar ordem:", error)
      }
    })
  }

  // Função para verificar status da ordem de serviço
  function checkServiceOrderStatus() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para verificar.")
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Preparar a lista de ordens para o select
    let ordersOptions = ""
    serviceOrders.forEach((order) => {
      // Traduzir status para exibição
      let statusText = ""
      switch (order.status) {
        case "pendente":
          statusText = "Pendente"
          break
        case "em_andamento":
          statusText = "Em Andamento"
          break
        case "concluido":
          statusText = "Concluído"
          break
        case "cancelado":
          statusText = "Cancelado"
          break
        default:
          statusText = order.status
      }

      // Formatar data para exibição
      const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientname} - ${order.devicetype} - ${statusText}</option>`
    })

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Verificar Status da Ordem</h2>
        <form id="check-status-form">
          <div class="form-group">
            <label for="order-id">Selecione a Ordem de Serviço:</label>
            <select id="order-id" required class="order-select">
              <option value="">Selecione uma ordem...</option>
              ${ordersOptions}
            </select>
          </div>
          <button type="submit" class="submit-button">Verificar</button>
        </form>
        <div id="status-result" class="status-result"></div>
      </div>
    `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#check-status-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("order-id").value)
      const resultDiv = document.getElementById("status-result")

      // Procurar a ordem pelo ID
      const order = serviceOrders.find((order) => order.id === orderId)

      if (order) {
        // Formatar data
        const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")
        const updatedDate = new Date(order.updatedat).toLocaleDateString("pt-BR")

        // Traduzir status
        let statusText = ""
        switch (order.status) {
          case "pendente":
            statusText = "Pendente"
            break
          case "em_andamento":
            statusText = "Em Andamento"
            break
          case "concluido":
            statusText = "Concluído"
            break
          case "cancelado":
            statusText = "Cancelado"
            break
          default:
            statusText = order.status
        }

        // Mostrar resultado com botão para atualizar status
        resultDiv.innerHTML = `
          <h3>Ordem de Serviço #${order.id}</h3>
          <p><strong>Cliente:</strong> ${order.clientname}</p>
          <p><strong>Dispositivo:</strong> ${order.devicetype}</p>
          <p><strong>Status:</strong> <span class="status-${order.status}">${statusText}</span></p>
          <p><strong>Criada em:</strong> ${createdDate}</p>
          <p><strong>Última atualização:</strong> ${updatedDate}</p>
        
  <!-- 👇 BOTÃO DE ATUALIZAR COMENTADO PARA NÃO EXIBIR 👇 -->
  <!--
  ${
    order.status !== "concluido" && order.status !== "cancelado"
      ? `<div class="action-buttons">
            <button id="update-status-btn" class="update-status-btn" data-id="${order.id}">
              Atualizar Status
            </button>
         </div>`
      : ""
  }
  -->
  <!-- ☝ FIM DO TRECHO COMENTADO ☝ -->
`

        // Adicionar event listener para o botão de atualizar status
        const updateStatusBtn = document.getElementById("update-status-btn")
        if (updateStatusBtn) {
          updateStatusBtn.addEventListener("click", function () {
            const orderId = Number.parseInt(this.getAttribute("data-id"))

            // Fechar modal atual
            modal.style.opacity = "0"
            setTimeout(() => {
              modal.remove()

              // Abrir modal de atualização de status
              updateOrderStatus(orderId)
            }, 300)
          })
        }
      } else {
        resultDiv.innerHTML = `<p class="error-message">Ordem de serviço #${orderId} não encontrada.</p>`
      }
    })
  }

  // Nova função para atualizar o status de uma ordem
  async function updateOrderStatus(specificOrderId = null) {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para atualizar.")
      return
    }

    // Filtrar apenas ordens não finalizadas e não canceladas
    const activeOrders = serviceOrders.filter((order) => order.status !== "concluido" && order.status !== "cancelado")

    if (activeOrders.length === 0) {
      alert("Não há ordens de serviço ativas para atualizar.")
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Preparar a lista de ordens para o select
    let ordersOptions = ""
    activeOrders.forEach((order) => {
      // Traduzir status para exibição
      let statusText = ""
      switch (order.status) {
        case "pendente":
          statusText = "Pendente"
          break
        case "em_andamento":
          statusText = "Em Andamento"
          break
        default:
          statusText = order.status
      }

      // Formatar data para exibição
      const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}" ${specificOrderId === order.id ? "selected" : ""}>OS #${order.id} - ${order.clientname} - ${order.devicetype} - ${statusText}</option>`
    })

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Atualizar Status da Ordem</h2>
        <form id="update-status-form">
          <div class="form-group">
            <label for="update-order-id">Selecione a Ordem de Serviço:</label>
            <select id="update-order-id" required class="order-select">
              <option value="">Selecione uma ordem...</option>
              ${ordersOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="new-status">Novo Status:</label>
            <select id="new-status" required class="status-select">
              <option value="">Selecione o novo status...</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
          <button type="submit" class="submit-button">Atualizar Status</button>
        </form>
      </div>
    `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#update-status-form")
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("update-order-id").value)
      const newStatus = document.getElementById("new-status").value

      // Procurar a ordem pelo ID
      const order = serviceOrders.find((order) => order.id === orderId)

      if (order) {
        // Traduzir status para mensagens
        let oldStatusText = ""
        let newStatusText = ""

        switch (order.status) {
          case "pendente":
            oldStatusText = "Pendente"
            break
          case "em_andamento":
            oldStatusText = "Em Andamento"
            break
          case "concluido":
            oldStatusText = "Concluído"
            break
          case "cancelado":
            oldStatusText = "Cancelado"
            break
          default:
            oldStatusText = order.status
        }

        switch (newStatus) {
          case "pendente":
            newStatusText = "Pendente"
            break
          case "em_andamento":
            newStatusText = "Em Andamento"
            break
          case "concluido":
            newStatusText = "Concluído"
            break
          case "cancelado":
            newStatusText = "Cancelado"
            break
          default:
            newStatusText = newStatus
        }

        // Confirmar atualização
        if (
          confirm(
            `Deseja realmente alterar o status da Ordem de Serviço #${order.id} de "${oldStatusText}" para "${newStatusText}"?`,
          )
        ) {
          try {
            // Atualizar status no servidor
            await updateOrderStatusAPI(orderId, newStatus)

            alert(`Status da Ordem de Serviço #${order.id} atualizado com sucesso para "${newStatusText}".`)

            // Fechar o modal
            modal.style.opacity = "0"
            setTimeout(() => {
              modal.remove()
            }, 300)
          } catch (error) {
            console.error("Erro ao atualizar status:", error)
          }
        }
      } else {
        alert(`Ordem de serviço #${orderId} não encontrada.`)
      }
    })
  }

  // Função para imprimir ordem de serviço
  function printServiceOrder() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para imprimir.")
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Preparar a lista de ordens para o select
    let ordersOptions = ""
    serviceOrders.forEach((order) => {
      // Traduzir status para exibição
      let statusText = ""
      switch (order.status) {
        case "pendente":
          statusText = "Pendente"
          break
        case "em_andamento":
          statusText = "Em Andamento"
          break
        case "concluido":
          statusText = "Concluído"
          break
        case "cancelado":
          statusText = "Cancelado"
          break
        default:
          statusText = order.status
      }

      // Formatar data para exibição
      const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientname} - ${order.devicetype} - ${statusText}</option>`
    })

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Imprimir Ordem de Serviço</h2>
        <form id="print-form">
          <div class="form-group">
            <label for="print-order-id">Selecione a Ordem de Serviço:</label>
            <select id="print-order-id" required class="order-select">
              <option value="">Selecione uma ordem...</option>
              ${ordersOptions}
            </select>
          </div>
          <button type="submit" class="submit-button">Preparar para Impressão</button>
        </form>
      </div>
    `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#print-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("print-order-id").value)

      // Procurar a ordem pelo ID
      const order = serviceOrders.find((order) => order.id === orderId)

      if (order) {
        // Criar janela de impressão
        const printWindow = window.open("", "_blank")

        // Formatar data
        const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

        // Traduzir status
        let statusText = ""
        switch (order.status) {
          case "pendente":
            statusText = "Pendente"
            break
          case "em_andamento":
            statusText = "Em Andamento"
            break
          case "concluido":
            statusText = "Concluído"
            break
          case "cancelado":
            statusText = "Cancelado"
            break
          default:
            statusText = order.status
        }

        // Conteúdo da impressão
        printWindow.document.write(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Ordem de Serviço #${order.id}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      
      body { 
        font-family: 'Roboto', Arial, sans-serif; 
        line-height: 1.6; 
        color: #333;
        margin: 0;
        padding: 20px;
        background-color: #f9f9f9;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        background-color: #fff;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .header {
        background-image: url("/imagem2.jpg");
        color: white;
        padding: 20px;
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .logo-area {
        width: 150px;
        height: 80px;
        background-color: rgba(255,255,255,0.9);
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
      }
      
      .logo-area img {
        max-width: 100%;
        max-height: 100%;
      }
      
      .title-area {
        text-align: right;
      }
      
      .title-area h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      
      .title-area .os-number {
        font-size: 22px;
        font-weight: 500;
        margin-top: 5px;
      }
      
      .title-area .date {
        font-size: 14px;
        margin-top: 10px;
        opacity: 0.9;
      }
      
      .content {
        padding: 20px;
      }
      
      .section {
        margin-bottom: 25px;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
      }
      
      .section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      
      .section-title {
        background-color: #f2f2f2;
        padding: 8px 15px;
        margin-bottom: 15px;
        border-left: 5px solid #2d2424;
        font-weight: 500;
        font-size: 18px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .info-item {
        margin-bottom: 10px;
      }
      
      .info-label {
        font-weight: 500;
        color: #666;
        margin-bottom: 3px;
        font-size: 14px;
      }
      
      .info-value {
        font-size: 16px;
      }
      
      .full-width {
        grid-column: 1 / -1;
      }
      
      .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .status-pendente {
        background-color: #fff3cd;
        color: #856404;
      }
      
      .status-em_andamento {
        background-color: #cce5ff;
        color: #004085;
      }
      
      .status-concluido {
        background-color: #d4edda;
        color: #155724;
      }
      
      .status-cancelado {
        background-color: #f8d7da;
        color: #721c24;
      }
      
      .terms {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        font-size: 14px;
      }
      
      .terms ol {
        margin: 0;
        padding-left: 20px;
      }
      
      .terms li {
        margin-bottom: 8px;
      }
      
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
      }
      
      .signature-line {
        border-top: 1px solid #000;
        width: 200px;
        text-align: center;
        padding-top: 5px;
        font-size: 14px;
      }
      
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #777;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }
      
      .print-button {
        background-color: #2d2424;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
        transition: background-color 0.3s;
      }
      
      .print-button:hover {
        background-color: #3d3434;
      }
      
      @media print {
        body {
          background-color: #fff;
          padding: 0;
        }
        
        .container {
          box-shadow: none;
        }
        
        .print-button {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo-area">
          <img src="/logo.jpeg" alt="Logo da Empresa">
        </div>
        <div class="title-area">
          <h1>Ordem de Serviço</h1>
          <div class="os-number">#${order.id}</div>
          <div class="date">Data: ${createdDate}</div>
        </div>
      </div>
      
      <div class="content">
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nome:</div>
              <div class="info-value">${order.clientname}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Telefone:</div>
              <div class="info-value">${order.clientphone}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Dados do Serviço</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Dispositivo:</div>
              <div class="info-value">${order.devicetype}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Prioridade:</div>
              <div class="info-value">${order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Descrição do Problema:</div>
              <div class="info-value">${order.problemdescription}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status:</div>
              <div class="info-value">
                <span class="status-badge status-${order.status}">${statusText}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Data de Criação:</div>
              <div class="info-value">${createdDate}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Diagnóstico Técnico</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <div class="info-value" style="min-height: 60px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Serviços Realizados</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <div class="info-value" style="min-height: 60px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Termos e Condições</div>
          <div class="terms">
            <ol>
              <li>O prazo para conclusão do serviço será informado após avaliação técnica.</li>
              <li>Garantia de 90 dias para os serviços realizados.</li>
              <li>Equipamentos não retirados após 30 dias serão considerados abandonados.</li>
              <li>O e declara estar ciente e de acordo com os termos acima.</li>
            </ol>
          </div>
        </div>
        
        <div class="signatures">
          <div class="signature-line">Assinatura do Cliente</div>
          <div class="signature-line">Assinatura do Técnico</div>
        </div>
        
        <div class="footer">
          <p>Sua Empresa de Assistência Técnica - Rua Exemplo, 123 - Cidade - Estado</p>
          <p>contato@suaempresa.com | (00) 0000-0000</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="window.print(); window.close();" class="print-button">Imprimir</button>
    </div>
  </body>
  </html>
`)

        printWindow.document.close()

        // Fechar o modal
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()
        }, 300)
      } else {
        alert(`Ordem de serviço #${orderId} não encontrada.`)
      }
    })
  }

  // Função para cancelar última ordem de serviço
  async function cancelLastServiceOrder() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para cancelar.")
      return
    }

    // Encontrar a última ordem não cancelada
    let lastOrder = null
    for (let i = 0; i < serviceOrders.length; i++) {
      if (serviceOrders[i].status !== "cancelado") {
        lastOrder = serviceOrders[i]
        break
      }
    }

    if (!lastOrder) {
      alert("Não há ordens de serviço ativas para cancelar.")
      return
    }

    // Confirmar cancelamento
    if (confirm(`Deseja realmente cancelar a Ordem de Serviço #${lastOrder.id} para ${lastOrder.clientname}?`)) {
      try {
        // Atualizar status no servidor
        await updateOrderStatusAPI(lastOrder.id, "cancelado")

        alert(`Ordem de Serviço #${lastOrder.id} cancelada com sucesso.`)
      } catch (error) {
        console.error("Erro:", error)
        alert("Não foi possível cancelar a ordem. Tente novamente mais tarde.")
      }
    }
  }

  // Função para pesquisar ordens pendentes
  function searchPendingOrders() {
    // Filtrar ordens pendentes
    const pendingOrders = serviceOrders.filter(
      (order) => order.status === "pendente" || order.status === "em_andamento",
    )

    // Mostrar resultados
    showOrdersList(pendingOrders, "Ordens de Serviço Pendentes")
  }

  // Função para pesquisar ordens finalizadas
  function searchCompletedOrders() {
    // Filtrar ordens concluídas
    const completedOrders = serviceOrders.filter((order) => order.status === "concluido")

    // Mostrar resultados
    showOrdersList(completedOrders, "Ordens de Serviço Finalizadas")
  }

  // Função para mostrar lista de ordens
  function showOrdersList(orders, title) {
    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Verificar se há ordens para mostrar
    let ordersHTML = ""
    if (orders.length === 0) {
      ordersHTML = "<p>Nenhuma ordem de serviço encontrada.</p>"
    } else {
      ordersHTML = `
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Dispositivo</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `

      orders.forEach((order) => {
        // Formatar data
        const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

        // Traduzir status
        let statusText = ""
        switch (order.status) {
          case "pendente":
            statusText = "Pendente"
            break
          case "em_andamento":
            statusText = "Em Andamento"
            break
          case "concluido":
            statusText = "Concluído"
            break
          case "cancelado":
            statusText = "Cancelado"
            break
          default:
            statusText = order.status
        }

        ordersHTML += `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.clientname}</td>
                        <td>${order.devicetype}</td>
                        <td>${createdDate}</td>
                        <td class="status-${order.status}">${statusText}</td>
                        <td>
                            <button class="view-btn" data-id="${order.id}">Ver</button>
                            ${
                              order.status !== "concluido" && order.status !== "cancelado"
                                ? `
                                <button class="update-btn" data-id="${order.id}">Atualizar</button>
                                <button class="finish-btn" data-id="${order.id}">Finalizar</button>
                                `
                                : ""
                            }
                        </td>
                    </tr>
                `
      })

      ordersHTML += `
                    </tbody>
                </table>
            `
    }

    // Conteúdo do modal
    modal.innerHTML = `
            <div class="modal-content modal-large">
                <span class="close-button">&times;</span>
                <h2>${title}</h2>
                <div class="orders-list">
                    ${ordersHTML}
                </div>
            </div>
        `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Adicionar event listeners para botões de ação
    const viewButtons = modal.querySelectorAll(".view-btn")
    viewButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))
        viewOrderDetails(orderId)
      })
    })

    const updateButtons = modal.querySelectorAll(".update-btn")
    updateButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        // Fechar modal atual
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()

          // Abrir modal de atualização
          updateOrderStatus(orderId)
        }, 300)
      })
    })

    const finishButtons = modal.querySelectorAll(".finish-btn")
    finishButtons.forEach((button) => {
      button.addEventListener("click", async function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        try {
          // Confirmar finalização
          if (confirm(`Deseja realmente finalizar a Ordem de Serviço #${orderId}?`)) {
            // Atualizar status no servidor
            await updateOrderStatusAPI(orderId, "concluido")

            alert(`Ordem de Serviço #${orderId} finalizada com sucesso.`)

            // Atualizar a lista
            modal.style.opacity = "0"
            setTimeout(() => {
              modal.remove()

              // Reabrir a lista atualizada
              if (title === "Ordens de Serviço Pendentes") {
                searchPendingOrders()
              } else {
                searchCompletedOrders()
              }
            }, 300)
          }
        } catch (error) {
          console.error("Erro:", error)
          alert("Não foi possível finalizar a ordem. Tente novamente mais tarde.")
        }
      })
    })
  }

  // Função para visualizar detalhes de uma ordem
  function viewOrderDetails(orderId) {
    const order = serviceOrders.find((order) => order.id === orderId)

    if (!order) {
      alert(`Ordem de serviço #${orderId} não encontrada.`)
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Formatar datas
    const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")
    const updatedDate = new Date(order.updatedat).toLocaleDateString("pt-BR")

    // Traduzir status
    let statusText = ""
    switch (order.status) {
      case "pendente":
        statusText = "Pendente"
        break
      case "em_andamento":
        statusText = "Em Andamento"
        break
      case "concluido":
        statusText = "Concluído"
        break
      case "cancelado":
        statusText = "Cancelado"
        break
      default:
        statusText = order.status
    }

    // Conteúdo do modal
    modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Detalhes da Ordem #${order.id}</h2>
                <div class="order-details">
                    <p><strong>Cliente:</strong> ${order.clientname}</p>
                    <p><strong>Telefone:</strong> ${order.clientphone}</p>
                    <p><strong>Dispositivo:</strong> ${order.devicetype}</p>
                    <p><strong>Problema:</strong> ${order.problemdescription}</p>
                    <p><strong>Prioridade:</strong> ${order.priority}</p>
                    <p><strong>Status:</strong> <span class="status-${order.status}">${statusText}</span></p>
                    <p><strong>Criada em:</strong> ${createdDate}</p>
                    <p><strong>Última atualização:</strong> ${updatedDate}</p>
                </div>
                <div class="action-buttons">
                    <button class="print-detail-btn" data-id="${order.id}">Imprimir</button>
                    ${
                      order.status !== "concluido" && order.status !== "cancelado"
                        ? `
                        <button class="update-detail-btn" data-id="${order.id}">Atualizar Status</button>
                        <button class="finish-detail-btn" data-id="${order.id}">Finalizar</button>
                        `
                        : ""
                    }
                </div>
            </div>
        `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Adicionar event listeners para botões
    const printButton = modal.querySelector(".print-detail-btn")
    if (printButton) {
      printButton.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        // Fechar modal atual
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()

          // Abrir modal de impressão e simular clique no botão
          printServiceOrder()
          setTimeout(() => {
            const printInput = document.getElementById("print-order-id")
            if (printInput) {
              printInput.value = orderId
              const printForm = document.getElementById("print-form")
              if (printForm) {
                printForm.dispatchEvent(new Event("submit"))
              }
            }
          }, 500)
        }, 300)
      })
    }

    const updateButton = modal.querySelector(".update-detail-btn")
    if (updateButton) {
      updateButton.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        // Fechar modal atual
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()

          // Abrir modal de atualização
          updateOrderStatus(orderId)
        }, 300)
      })
    }

    const finishButton = modal.querySelector(".finish-detail-btn")
    if (finishButton) {
      finishButton.addEventListener("click", async function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        try {
          // Confirmar finalização
          if (confirm(`Deseja realmente finalizar a Ordem de Serviço #${orderId}?`)) {
            // Atualizar status no servidor
            await updateOrderStatusAPI(orderId, "concluido")

            alert(`Ordem de Serviço #${orderId} finalizada com sucesso.`)

            // Fechar modal atual
            modal.style.opacity = "0"
            setTimeout(() => {
              modal.remove()
            }, 300)
          }
        } catch (error) {
          console.error("Erro:", error)
          alert("Não foi possível finalizar a ordem. Tente novamente mais tarde.")
        }
      })
    }
  }

  // Função para finalizar ordem (genérica)
  async function finishOrder() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para finalizar.")
      return
    }

    // Filtrar apenas ordens não finalizadas e não canceladas
    const activeOrders = serviceOrders.filter((order) => order.status !== "concluido" && order.status !== "cancelado")

    if (activeOrders.length === 0) {
      alert("Não há ordens de serviço ativas para finalizar.")
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Preparar a lista de ordens para o select
    let ordersOptions = ""
    activeOrders.forEach((order) => {
      // Traduzir status para exibição
      let statusText = ""
      switch (order.status) {
        case "pendente":
          statusText = "Pendente"
          break
        case "em_andamento":
          statusText = "Em Andamento"
          break
        default:
          statusText = order.status
      }

      // Formatar data para exibição
      const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientName} - ${order.devicetype} - ${statusText}</option>`
    })

    // Conteúdo do modal
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Finalizar Ordem de Serviço</h2>
        <form id="finish-form">
          <div class="form-group">
            <label for="finish-order-id">Selecione a Ordem de Serviço:</label>
            <select id="finish-order-id" required class="order-select">
              <option value="">Selecione uma ordem...</option>
              ${ordersOptions}
            </select>
          </div>
          <button type="submit" class="submit-button">Finalizar</button>
        </form>
      </div>
    `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#finish-form")
    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("finish-order-id").value)

      try {
        // Confirmar finalização
        if (confirm(`Deseja realmente finalizar a Ordem de Serviço #${orderId}?`)) {
          // Atualizar status no servidor
          await updateOrderStatusAPI(orderId, "concluido")

          alert(`Ordem de Serviço #${orderId} finalizada com sucesso.`)

          // Fechar o modal
          modal.style.opacity = "0"
          setTimeout(() => {
            modal.remove()
          }, 300)
        }
      } catch (error) {
        console.error("Erro:", error)
        alert("Não foi possível finalizar a ordem. Tente novamente mais tarde.")
      }
    })
  }

  // Função para rastrear ordem
  function trackOrder() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para rastrear.")
      return
    }

    // Criar o modal
    const modal = document.createElement("div")
    modal.className = "modal"

    // Preparar a lista de ordens para o select
    let ordersOptions = ""
    serviceOrders.forEach((order) => {
      // Traduzir status para exibição
      let statusText = ""
      switch (order.status) {
        case "pendente":
          statusText = "Pendente"
          break
        case "em_andamento":
          statusText = "Em Andamento"
          break
        case "concluido":
          statusText = "Concluído"
          break
        case "cancelado":
          statusText = "Cancelado"
          break
        default:
          statusText = order.status
      }

      // Formatar data para exibição
      const createdDate = new Date(order.createdat).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientname} - ${order.devicetype} - ${statusText}</option>`
    })

    // Conteúdo do modal
    modal.innerHTML = `
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Rastreio de Ordem de Serviço</h2>
      <form id="track-form">
        <div class="form-group">
          <label for="track-order-id">Selecione a Ordem de Serviço:</label>
          <select id="track-order-id" required class="order-select">
            <option value="">Selecione uma ordem...</option>
            ${ordersOptions}
          </select>
        </div>
        <button type="submit" class="submit-button">Rastrear</button>
      </form>
      <div id="track-result" class="track-result"></div>
    </div>
  `

    // Adicionar modal ao body
    document.body.appendChild(modal)

    // Mostrar o modal
    setTimeout(() => {
      modal.style.display = "flex"
      modal.style.opacity = "1"
    }, 10)

    // Fechar modal quando clicar no X
    const closeButton = modal.querySelector(".close-button")
    closeButton.addEventListener("click", () => {
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
    })

    // Manipular envio do formulário
    const form = modal.querySelector("#track-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("track-order-id").value)
      const resultDiv = document.getElementById("track-result")

      // Procurar a ordem pelo ID
      const order = serviceOrders.find((order) => order.id === orderId)

      if (order) {
        // Criar timeline baseada no status
        let timelineHTML = `
        <div class="timeline">
          <div class="timeline-item active">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Ordem Criada</h3>
              <p>${new Date(order.createdat).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
      `

        // Adicionar etapas baseadas no status
        if (order.status === "em_andamento" || order.status === "concluido") {
          timelineHTML += `
          <div class="timeline-item active">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Em Andamento</h3>
              <p>Serviço sendo realizado</p>
            </div>
          </div>
        `
        } else {
          timelineHTML += `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Em Andamento</h3>
              <p>Aguardando</p>
            </div>
          </div>
        `
        }

        if (order.status === "concluido") {
          timelineHTML += `
          <div class="timeline-item active">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Concluído</h3>
              <p>${new Date(order.updatedat).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        `
        } else if (order.status === "cancelado") {
          timelineHTML += `
          <div class="timeline-item canceled">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Cancelado</h3>
              <p>${new Date(order.updatedat).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        `
        } else {
          timelineHTML += `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Concluído</h3>
              <p>Aguardando</p>
            </div>
          </div>
        `
        }

        timelineHTML += `</div>`

        // Mostrar resultado
        resultDiv.innerHTML = `
        <h3>Ordem de Serviço #${order.id}</h3>
        <p><strong>Cliente:</strong> ${order.clientName}</p>
        <p><strong>Telefone:</strong> ${order.clientPhone}</p>
        <p><strong>Dispositivo:</strong> ${order.devicetype}</p>
        ${timelineHTML}
        <div class="share-buttons">
          <button id="share-whatsapp" class="whatsapp-share-btn">
            <i class="fab fa-whatsapp"></i> Compartilhar via WhatsApp
          </button>
          ${
            order.status !== "concluido" && order.status !== "cancelado"
              ? `<button id="update-track-status" class="update-status-btn" data-id="${order.id}">
                  <i class="fas fa-sync-alt"></i> Atualizar Status
                </button>`
              : ""
          }
        </div>
      `

        // Adicione o event listener para o botão de compartilhamento
        const shareButton = document.getElementById("share-whatsapp")
        if (shareButton) {
          shareButton.addEventListener("click", () => {
            // Formatar o status atual para a mensagem
            let statusText = ""
            switch (order.status) {
              case "pendente":
                statusText = "Pendente"
                break
              case "em_andamento":
                statusText = "Em Andamento"
                break
              case "concluido":
                statusText = "Concluído"
                break
              case "cancelado":
                statusText = "Cancelado"
                break
              default:
                statusText = order.status
            }

            // Criar a mensagem para compartilhar
            const message = `
*Atualização da Ordem de Serviço #${order.id}*

Olá ${order.clientName},

Aqui está o status atual do seu serviço:

📱 *Dispositivo:* ${order.devicetype}
🔧 *Status:* ${statusText}
📅 *Data de criação:* ${new Date(order.createdat).toLocaleDateString("pt-BR")}
${order.status === "concluido" ? `✅ *Concluído em:* ${new Date(order.updatedat).toLocaleDateString("pt-BR")}` : ""}

Agradecemos a preferência!
`

            // Criar URL do WhatsApp com o número do cliente e a mensagem
            // Remover caracteres não numéricos do telefone
            const phoneNumber = order.clientphone.replace(/\D/g, "")
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

            // Abrir o WhatsApp
            window.open(whatsappUrl, "_blank")
          })
        }

        // Adicionar event listener para o botão de atualizar status
        const updateStatusBtn = document.getElementById("update-track-status")
        if (updateStatusBtn) {
          updateStatusBtn.addEventListener("click", function () {
            const orderId = Number.parseInt(this.getAttribute("data-id"))

            // Fechar modal atual
            modal.style.opacity = "0"
            setTimeout(() => {
              modal.remove()

              // Abrir modal de atualização de status
              updateOrderStatus(orderId)
            }, 300)
          })
        }
      } else {
        resultDiv.innerHTML = `<p class="error-message">Ordem de serviço #${orderId} não encontrada.</p>`
      }
    })
  }
})
