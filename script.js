// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
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

  // Armazenamento local para ordens de serviço
  const serviceOrders = JSON.parse(localStorage.getItem("serviceOrders")) || []
  let currentOrderId = Number.parseInt(localStorage.getItem("currentOrderId")) || 1

  // Função para salvar ordens no localStorage
  function saveServiceOrders() {
    localStorage.setItem("serviceOrders", JSON.stringify(serviceOrders))
    localStorage.setItem("currentOrderId", currentOrderId.toString())
  }

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
                        <label for="client-name">Nome do Cliente:</label>
                        <input type="text" id="client-name" required>
                    </div>
                    <div class="form-group">
                        <label for="client-phone">Telefone:</label>
                        <input type="tel" id="client-phone" required>
                    </div>
                    <div class="form-group">
                        <label for="device-type">Tipo de Dispositivo:</label>
                        <select id="device-type" required>
                            <option value="">Selecione...</option>
                            <option value="notebook">Notebook</option>
                            <option value="desktop">Desktop</option>
                            <option value="smartphone">Smartphone</option>
                            <option value="tablet">Tablet</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="problem-description">Descrição do Problema:</label>
                        <textarea id="problem-description" rows="4" required></textarea>
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
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      // Criar nova ordem de serviço
      const newOrder = {
        id: currentOrderId++,
        clientName: document.getElementById("client-name").value,
        clientPhone: document.getElementById("client-phone").value,
        deviceType: document.getElementById("device-type").value,
        problemDescription: document.getElementById("problem-description").value,
        priority: document.getElementById("service-priority").value,
        status: "pendente",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Adicionar à lista de ordens
      serviceOrders.push(newOrder)

      // Salvar no localStorage
      saveServiceOrders()

      // Mostrar confirmação
      alert(`Ordem de Serviço #${newOrder.id} criada com sucesso!`)

      // Fechar o modal
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
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
      const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientName} - ${order.deviceType} - ${statusText}</option>`
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
        const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")
        const updatedDate = new Date(order.updatedAt).toLocaleDateString("pt-BR")

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
          <p><strong>Cliente:</strong> ${order.clientName}</p>
          <p><strong>Dispositivo:</strong> ${order.deviceType}</p>
          <p><strong>Status:</strong> <span class="status-${order.status}">${statusText}</span></p>
          <p><strong>Criada em:</strong> ${createdDate}</p>
          <p><strong>Última atualização:</strong> ${updatedDate}</p>
          ${
            order.status !== "concluido" && order.status !== "cancelado"
              ? `<div class="action-buttons">
                  <button id="update-status-btn" class="update-status-btn" data-id="${order.id}">Atualizar Status</button>
                </div>`
              : ""
          }
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
  function updateOrderStatus(specificOrderId = null) {
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
      const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}" ${specificOrderId === order.id ? "selected" : ""}>OS #${order.id} - ${order.clientName} - ${order.deviceType} - ${statusText}</option>`
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
    form.addEventListener("submit", (e) => {
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
          // Atualizar status
          order.status = newStatus
          order.updatedAt = new Date().toISOString()

          // Salvar no localStorage
          saveServiceOrders()

          alert(`Status da Ordem de Serviço #${order.id} atualizado com sucesso para "${newStatusText}".`)

          // Fechar o modal
          modal.style.opacity = "0"
          setTimeout(() => {
            modal.remove()
          }, 300)
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
      const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientName} - ${order.deviceType} - ${statusText}</option>`
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
        const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

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
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 20px; }
              .order-details { margin-bottom: 30px; }
              .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
              .signature-line { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Ordem de Serviço #${order.id}</h1>
              <p>Data: ${createdDate}</p>
            </div>
            
            <div class="order-details">
              <h2>Dados do Cliente</h2>
              <p><strong>Nome:</strong> ${order.clientName}</p>
              <p><strong>Telefone:</strong> ${order.clientPhone}</p>
              
              <h2>Dados do Serviço</h2>
              <p><strong>Dispositivo:</strong> ${order.deviceType}</p>
              <p><strong>Descrição do Problema:</strong> ${order.problemDescription}</p>
              <p><strong>Prioridade:</strong> ${order.priority}</p>
              <p><strong>Status:</strong> ${statusText}</p>
            </div>
            
            <div class="terms">
              <h2>Termos e Condições</h2>
              <p>1. O prazo para conclusão do serviço será informado após avaliação técnica.</p>
              <p>2. Garantia de 90 dias para os serviços realizados.</p>
              <p>3. Equipamentos não retirados após 30 dias serão considerados abandonados.</p>
            </div>
            
            <div class="signatures">
              <div class="signature-line">Assinatura do Cliente</div>
              <div class="signature-line">Assinatura do Técnico</div>
            </div>
            
            <button onclick="window.print(); window.close();" style="margin-top: 30px; padding: 10px;">Imprimir</button>
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
  function cancelLastServiceOrder() {
    // Verificar se existem ordens
    if (serviceOrders.length === 0) {
      alert("Não há ordens de serviço para cancelar.")
      return
    }

    // Encontrar a última ordem não cancelada
    let lastOrderIndex = -1
    for (let i = serviceOrders.length - 1; i >= 0; i--) {
      if (serviceOrders[i].status !== "cancelado") {
        lastOrderIndex = i
        break
      }
    }

    if (lastOrderIndex === -1) {
      alert("Não há ordens de serviço ativas para cancelar.")
      return
    }

    const lastOrder = serviceOrders[lastOrderIndex]

    // Confirmar cancelamento
    if (confirm(`Deseja realmente cancelar a Ordem de Serviço #${lastOrder.id} para ${lastOrder.clientName}?`)) {
      // Atualizar status
      lastOrder.status = "cancelado"
      lastOrder.updatedAt = new Date().toISOString()

      // Salvar no localStorage
      saveServiceOrders()

      alert(`Ordem de Serviço #${lastOrder.id} cancelada com sucesso.`)
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
        const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

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
                        <td>${order.clientName}</td>
                        <td>${order.deviceType}</td>
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
      button.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))
        finishSpecificOrder(orderId)

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
    const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")
    const updatedDate = new Date(order.updatedAt).toLocaleDateString("pt-BR")

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
                    <p><strong>Cliente:</strong> ${order.clientName}</p>
                    <p><strong>Telefone:</strong> ${order.clientPhone}</p>
                    <p><strong>Dispositivo:</strong> ${order.deviceType}</p>
                    <p><strong>Problema:</strong> ${order.problemDescription}</p>
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
      finishButton.addEventListener("click", function () {
        const orderId = Number.parseInt(this.getAttribute("data-id"))

        // Fechar modal atual
        modal.style.opacity = "0"
        setTimeout(() => {
          modal.remove()

          // Finalizar ordem
          finishSpecificOrder(orderId)
        }, 300)
      })
    }
  }

  // Função para finalizar uma ordem específica
  function finishSpecificOrder(orderId) {
    const order = serviceOrders.find((order) => order.id === orderId)

    if (!order) {
      alert(`Ordem de serviço #${orderId} não encontrada.`)
      return
    }

    // Confirmar finalização
    if (confirm(`Deseja realmente finalizar a Ordem de Serviço #${order.id} para ${order.clientName}?`)) {
      // Atualizar status
      order.status = "concluido"
      order.updatedAt = new Date().toISOString()

      // Salvar no localStorage
      saveServiceOrders()

      alert(`Ordem de Serviço #${order.id} finalizada com sucesso.`)
    }
  }

  // Função para finalizar ordem (genérica)
  function finishOrder() {
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
      const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientName} - ${order.deviceType} - ${statusText}</option>`
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
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const orderId = Number.parseInt(document.getElementById("finish-order-id").value)

      // Finalizar a ordem específica
      finishSpecificOrder(orderId)

      // Fechar o modal
      modal.style.opacity = "0"
      setTimeout(() => {
        modal.remove()
      }, 300)
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
      const createdDate = new Date(order.createdAt).toLocaleDateString("pt-BR")

      // Adicionar opção ao select
      ordersOptions += `<option value="${order.id}">OS #${order.id} - ${order.clientName} - ${order.deviceType} - ${statusText}</option>`
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
              <p>${new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
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
              <p>${new Date(order.updatedAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        `
        } else if (order.status === "cancelado") {
          timelineHTML += `
          <div class="timeline-item canceled">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>Cancelado</h3>
              <p>${new Date(order.updatedAt).toLocaleDateString("pt-BR")}</p>
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
        <p><strong>Dispositivo:</strong> ${order.deviceType}</p>
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

📱 *Dispositivo:* ${order.deviceType}
🔧 *Status:* ${statusText}
📅 *Data de criação:* ${new Date(order.createdAt).toLocaleDateString("pt-BR")}
${order.status === "concluido" ? `✅ *Concluído em:* ${new Date(order.updatedAt).toLocaleDateString("pt-BR")}` : ""}

Agradecemos a preferência!
`

            // Criar URL do WhatsApp com o número do cliente e a mensagem
            // Remover caracteres não numéricos do telefone
            const phoneNumber = order.clientPhone.replace(/\D/g, "")
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
