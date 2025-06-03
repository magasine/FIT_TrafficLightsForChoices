javascript: (function () {
  "use strict";

  // Configurações globais
  const CONFIG = {
    NAMESPACE: "TrafficLightForChoices",
    VERSION: "v20250530",
    STATES: {
      FALSE: { key: "false", color: "#ff4444", label: "✖ FALSE" },
      INDETERMINATE: {
        key: "indeterminate",
        color: "#ffbb33",
        label: "？INDETERMINATE",
      },
      TRUE: { key: "true", color: "#00C851", label: "✔ TRUE" },
    },
    DEFAULT_VISIBILITY: true,
  };

  // Verificar se já foi executado
  if (window[CONFIG.NAMESPACE]) {
    console.warn("Traffic Lights For Choices já está ativo");
    return;
  }

  class TrafficLightSystem {
    constructor() {
      this.isVisible = CONFIG.DEFAULT_VISIBILITY;
      this.containers = new Set();
      this.init();
    }

    init() {
      try {
        this.injectStyles();
        this.createControlPanel();
        this.processExistingInputs();
        this.setupMutationObserver();
        this.showWelcomeMessage();
        console.log(`${CONFIG.NAMESPACE} inicializado com sucesso`);
      } catch (error) {
        console.error(`Erro ao inicializar ${CONFIG.NAMESPACE}:`, error);
        this.cleanup();
      }
    }

    injectStyles() {
      const styleId = `${CONFIG.NAMESPACE}-styles`;
      if (document.getElementById(styleId)) return;

      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = this.generateStyles();
      document.head.appendChild(style);
    }

    generateStyles() {
      return `
            .${CONFIG.NAMESPACE}-container {
               display: none;
               margin: 2px 5px;
               padding: 3px 6px;
               border-radius: 4px;
               background: #f8f9fa;
               border: 1px solid #dee2e6;
               font-size: 11px;
               vertical-align: middle;
               transition: all 0.2s ease;
            }
            
            .${CONFIG.NAMESPACE}-container.visible {
               display: inline-flex;
               gap: 4px;
               align-items: center;
            }
            
            .${CONFIG.NAMESPACE}-state {
               display: flex;
               align-items: center;
               gap: 2px;
               padding: 1px 4px;
               border-radius: 3px;
               cursor: pointer;
               transition: all 0.15s ease;
               font-weight: 500;
            }
            
            .${CONFIG.NAMESPACE}-state:hover {
               transform: scale(1.05);
               box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            
            .${CONFIG.NAMESPACE}-state input {
               margin: 0;
               cursor: pointer;
            }
            
            .${CONFIG.NAMESPACE}-state.active {
               color: white;
               font-weight: bold;
            }
            
            .${CONFIG.NAMESPACE}-control-panel {
               position: fixed;
               top: 10px;
               right: 10px;
               z-index: 999999;
               background: rgba(255, 255, 255, 0.95);
               backdrop-filter: blur(8px);
               border-radius: 8px;
               padding: 8px;
               box-shadow: 0 2px 12px rgba(0,0,0,0.15);
               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
               transition: all 0.2s ease;
               border: 1px solid rgba(0,0,0,0.1);
               max-width: 140px;
            }
            
            .${CONFIG.NAMESPACE}-control-panel:hover {
               background: rgba(255, 255, 255, 0.98);
               box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }
            
            .${CONFIG.NAMESPACE}-title {
               font-size: 10px;
               font-weight: 600;
               color: #333;
               text-align: center;
               margin-bottom: 6px;
               text-transform: uppercase;
               letter-spacing: 0.5px;
               opacity: 0.8;
            }
            
            .${CONFIG.NAMESPACE}-button-container {
               display: flex;
               gap: 4px;
               justify-content: center;
            }
            
            .${CONFIG.NAMESPACE}-toggle, .${CONFIG.NAMESPACE}-exit {
               border: none;
               border-radius: 4px;
               font-weight: bold;
               font-size: 10px;
               cursor: pointer;
               transition: all 0.2s ease;
               padding: 4px 8px;
               min-width: 30px;
            }
            
            .${CONFIG.NAMESPACE}-toggle:hover, .${CONFIG.NAMESPACE}-exit:hover {
               transform: translateY(-1px);
               box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            
            .${CONFIG.NAMESPACE}-toggle.active {
               background: #00C851 !important;
               color: white;
            }
            
            .${CONFIG.NAMESPACE}-toggle.inactive {
               background: #ff4444 !important;
               color: white;
            }
            
            .${CONFIG.NAMESPACE}-exit {
               background: #6c757d;
               color: white;
               font-size: 12px;
               line-height: 1;
               padding: 4px 6px;
            }
            
            .${CONFIG.NAMESPACE}-exit:hover {
               background: #5a6268 !important;
            }
            
            @media (max-width: 768px) {
               .${CONFIG.NAMESPACE}-control-panel {
                  top: 8px;
                  right: 8px;
                  padding: 6px;
                  max-width: 120px;
               }
               
               .${CONFIG.NAMESPACE}-title {
                  font-size: 9px;
                  margin-bottom: 4px;
               }
               
               .${CONFIG.NAMESPACE}-toggle, .${CONFIG.NAMESPACE}-exit {
                  font-size: 9px;
                  padding: 3px 6px;
                  min-width: 26px;
               }
               
               .${CONFIG.NAMESPACE}-container {
                  font-size: 10px;
                  margin: 1px 3px;
                  padding: 2px 4px;
               }
            }
            
            @media (pointer: coarse) {
               .${CONFIG.NAMESPACE}-toggle, .${CONFIG.NAMESPACE}-exit {
                  padding: 6px 8px;
                  min-height: 32px;
               }
            }
         `;
    }

    createControlPanel() {
      this.controlPanel = document.createElement("div");
      this.controlPanel.className = `${CONFIG.NAMESPACE}-control-panel`;

      const title = document.createElement("div");
      title.className = `${CONFIG.NAMESPACE}-title`;
      title.textContent = "FIT - TRAFFIC LIGHTS FOR CHOICES";

      const buttonContainer = document.createElement("div");
      buttonContainer.className = `${CONFIG.NAMESPACE}-button-container`;

      this.toggleButton = this.createButton(
        "toggle",
        this.isVisible ? "ON" : "OFF",
        "Ativar/Desativar checkboxes auxiliares",
        () => this.toggleVisibility()
      );

      this.exitButton = this.createButton(
        "exit",
        "×",
        "Remover FIT - Traffic Lights for Choices",
        () => this.confirmExit()
      );

      this.updateToggleButtonState();

      buttonContainer.appendChild(this.toggleButton);
      buttonContainer.appendChild(this.exitButton);
      this.controlPanel.appendChild(title);
      this.controlPanel.appendChild(buttonContainer);

      document.body.appendChild(this.controlPanel);
    }

    createButton(type, text, title, clickHandler) {
      const button = document.createElement("button");
      button.className = `${CONFIG.NAMESPACE}-${type}`;
      button.textContent = text;
      button.title = title;
      button.setAttribute("aria-label", title);
      button.addEventListener("click", (e) => {
        e.preventDefault();
        clickHandler();
      });
      return button;
    }

    updateToggleButtonState() {
      this.toggleButton.textContent = this.isVisible ? "ON" : "OFF";
      this.toggleButton.className = `${CONFIG.NAMESPACE}-toggle ${
        this.isVisible ? "active" : "inactive"
      }`;
    }

    processExistingInputs() {
      document
        .querySelectorAll('input[type="checkbox"], input[type="radio"]')
        .forEach((input) => this.processInput(input));
    }

    processInput(input) {
      if (this.isAlreadyProcessed(input)) return;

      try {
        const container = this.createTrafficLightContainer();
        input.setAttribute(`data-${CONFIG.NAMESPACE}-processed`, "true");
        input.parentNode.insertBefore(container, input);
        this.containers.add(container);

        if (this.isVisible) {
          container.classList.add("visible");
        }
      } catch (error) {
        console.warn("Erro ao processar input:", error);
      }
    }

    isAlreadyProcessed(input) {
      return (
        input.closest(`.${CONFIG.NAMESPACE}-container`) ||
        input.hasAttribute(`data-${CONFIG.NAMESPACE}-processed`)
      );
    }

    createTrafficLightContainer() {
      const container = document.createElement("div");
      container.className = `${CONFIG.NAMESPACE}-container`;

      if (this.isVisible) {
        container.classList.add("visible");
      }

      const groupId = this.generateId();

      Object.values(CONFIG.STATES).forEach((state) => {
        container.appendChild(this.createStateElement(state, groupId));
      });

      return container;
    }

    createStateElement(state, groupId) {
      const stateDiv = document.createElement("div");
      stateDiv.className = `${CONFIG.NAMESPACE}-state`;
      stateDiv.style.backgroundColor = `${state.color}50`;
      stateDiv.title = state.label;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `${CONFIG.NAMESPACE}-group-${groupId}`;
      input.className = `${CONFIG.NAMESPACE}-${state.key}`;
      input.setAttribute("aria-label", state.label);

      const label = document.createElement("span");
      label.textContent = state.label.charAt(0);

      input.addEventListener("change", () => {
        if (input.checked) {
          this.updateContainerState(stateDiv.parentNode, state);
        }
      });

      stateDiv.addEventListener("click", (e) => {
        if (e.target !== input) {
          input.checked = true;
          input.dispatchEvent(new Event("change"));
        }
      });

      stateDiv.appendChild(input);
      stateDiv.appendChild(label);

      return stateDiv;
    }

    updateContainerState(container, activeState) {
      this.clearContainerStates(container);

      const activeElement = container.querySelector(
        `.${CONFIG.NAMESPACE}-${activeState.key}`
      ).parentNode;
      activeElement.classList.add("active");
      activeElement.style.backgroundColor = activeState.color;

      container.style.backgroundColor = `${activeState.color}50`;
    }

    clearContainerStates(container) {
      container
        .querySelectorAll(`.${CONFIG.NAMESPACE}-state`)
        .forEach((state) => {
          state.classList.remove("active");
          state.style.backgroundColor = "";
        });

      container.style.backgroundColor = "";
    }

    toggleVisibility() {
      this.isVisible = !this.isVisible;
      this.containers.forEach((container) => {
        container.classList.toggle("visible", this.isVisible);
      });
      this.updateToggleButtonState();
    }

    confirmExit() {
      const confirmMessage = this.getExitConfirmationMessage();
      if (confirm(confirmMessage)) {
        this.cleanup();
      }
    }

    getExitConfirmationMessage() {
      return [
        "FIT - TRAFFIC LIGHTS FOR CHOICES",
        "",
        "Deseja realmente remover a ferramenta?",
        "",
        "• Todas as marcações auxiliares serão perdidas",
        "• A página será restaurada ao estado original",
        "",
        "Esta ação não pode ser desfeita.",
      ].join("\n");
    }

    setupMutationObserver() {
      this.observer = new MutationObserver((mutations) => {
        // Processa apenas se houver novos nós (performance)
        if (!mutations.some((m) => m.addedNodes.length > 0)) return;

        // Usa um requestIdleCallback para não bloquear a UI
        requestIdleCallback(() => this.processExistingInputs());
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    processNewInputs(node) {
      const inputs = node.querySelectorAll
        ? node.querySelectorAll('input[type="checkbox"], input[type="radio"]')
        : [];

      inputs.forEach((input) => this.processInput(input));

      if (
        node.matches &&
        node.matches('input[type="checkbox"], input[type="radio"]')
      ) {
        this.processInput(node);
      }
    }

    showWelcomeMessage() {
      setTimeout(() => {
        const welcomeMessage = this.getWelcomeMessage();
        if (typeof alert === "function") {
          alert(welcomeMessage);
        } else {
          console.log(welcomeMessage);
        }
      }, 100);
    }

    getWelcomeMessage() {
      return [
        `FIT - TRAFFIC LIGHTS FOR CHOICES - ${CONFIG.VERSION}`,
        "",
        "🚦 Sistema de 3 Estados Ativado!",
        "",
        "🔴 Vermelho = FALSE",
        "🟡 Amarelo = INDETERMINATE",
        "🟢 Verde = TRUE",
        "",
        "CONTROLES:",
        "• ON/OFF: Alternar visibilidade",
        "• × : Remover ferramenta",
        "",
        "IMPORTANTE:",
        "Marcações são apenas visuais e não afetam",
        "o processamento do formulário original.",
        "",
        "Use para auxiliar na análise e tomada de decisão!",
      ].join("\n");
    }

    generateId() {
      return Math.random().toString(36).substr(2, 9);
    }

    cleanup() {
      try {
        if (this.observer) this.observer.disconnect();
        if (this.controlPanel) this.controlPanel.remove();

        const styles = document.getElementById(`${CONFIG.NAMESPACE}-styles`);
        if (styles) styles.remove();

        this.containers.forEach((container) => {
          if (container.parentNode) {
            container.remove();
          }
        });

        document
          .querySelectorAll(`[data-${CONFIG.NAMESPACE}-processed]`)
          .forEach((input) => {
            input.removeAttribute(`data-${CONFIG.NAMESPACE}-processed`);
          });

        delete window[CONFIG.NAMESPACE];
        delete window[`${CONFIG.NAMESPACE}Cleanup`];

        console.log(`${CONFIG.NAMESPACE} removido com sucesso`);
      } catch (error) {
        console.error("Erro durante cleanup:", error);
      }
    }
  }

  // Função para remover o sistema (útil para debugging)
  window[`${CONFIG.NAMESPACE}Cleanup`] = function () {
    if (window[CONFIG.NAMESPACE]) {
      window[CONFIG.NAMESPACE].cleanup();
    }
  };

  // Inicializar o sistema
  try {
    window[CONFIG.NAMESPACE] = new TrafficLightSystem();
  } catch (error) {
    console.error(`Falha ao inicializar ${CONFIG.NAMESPACE}:`, error);
  }
})();
