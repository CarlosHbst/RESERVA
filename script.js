// Configurações
const CONFIG = {
    SYSTEM_URL: "https://script.google.com/a/macros/joinville.sc.gov.br/s/AKfycbw58HPHL7E18bhmZSlLBMaxXX6WX_toKNMLaclJE01XOFGaOxB6pHFWE9F2MWp6ysMEPw/exec",
    DOMAIN_REQUIRED: "joinville.sc.gov.br",
    ACCOUNT_SWITCH_URLS: {
        ADD_ACCOUNT: "https://accounts.google.com/AddSession",
        ACCOUNT_CHOOSER: "https://accounts.google.com/AccountChooser",
        SPECIFIC_DOMAIN: "https://accounts.google.com/AccountChooser?continue=https://drive.google.com&hl=pt-BR"
    }
};

// Estado do sistema
let state = {
    selectedAccountType: null,
    isSwitching: false
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    showWelcomeMessage();
});

function initializeEventListeners() {
    // Hover effects para cards de opção
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('selected')) {
                card.style.transform = 'translateY(-5px)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('selected')) {
                card.style.transform = 'translateY(0)';
            }
        });
    });
}

function selectAccount(type) {
    const optionCards = document.querySelectorAll('.option-card');
    const selectedAccountDiv = document.getElementById('selectedAccount');
    const accountInfoDiv = document.getElementById('accountInfo');
    const accessBtn = document.getElementById('accessBtn');
    
    // Remove seleção anterior
    optionCards.forEach(card => card.classList.remove('selected'));
    
    // Adiciona seleção atual
    event.currentTarget.classList.add('selected');
    event.currentTarget.classList.add('pulse');
    
    state.selectedAccountType = type;
    
    // Atualiza informações da conta selecionada
    if (type === 'institutional') {
        accountInfoDiv.innerHTML = `
            <div>
                <strong>Conta Institucional</strong><br>
                <span style="color: #666;">@joinville.sc.gov.br</span>
            </div>
        `;
        accessBtn.innerHTML = '🏢 Acessar com Conta Institucional';
    } else {
        accountInfoDiv.innerHTML = `
            <div>
                <strong>Adicionar/Selecionar Conta</strong><br>
                <span style="color: #666;">Você poderá escolher a conta ao acessar</span>
            </div>
        `;
        accessBtn.innerHTML = '👤 Acessar e Escolher Conta';
    }
    
    // Mostra informações da conta selecionada
    selectedAccountDiv.style.display = 'block';
    selectedAccountDiv.classList.add('fade-in');
    
    // Remove animação pulse após execução
    setTimeout(() => {
        event.currentTarget.classList.remove('pulse');
    }, 500);
    
    updateButtonStates();
}

function switchAccount() {
    state.isSwitching = true;
    
    // Abre o seletor de contas do Google em nova aba
    const accountWindow = window.open(CONFIG.ACCOUNT_SWITCH_URLS.ADD_ACCOUNT, '_blank');
    
    showNotification('🔄 Abrindo seletor de contas Google...', 'info');
    
    // Dá foco na janela após um breve delay
    setTimeout(() => {
        try {
            if (accountWindow && !accountWindow.closed) {
                accountWindow.focus();
            }
        } catch (e) {
            // Ignora erro de foco entre domínios
        }
    }, 1000);
    
    // Atualiza estado após algum tempo
    setTimeout(() => {
        state.isSwitching = false;
        showNotification('✅ Seletor de contas aberto. Adicione ou selecione uma conta.', 'success');
    }, 2000);
}

function handleAccess() {
    if (!state.selectedAccountType) {
        showNotification('⚠️ Selecione uma opção de conta primeiro', 'warning');
        return;
    }
    
    const accessBtn = document.getElementById('accessBtn');
    const originalText = accessBtn.innerHTML;
    
    // Feedback visual
    accessBtn.innerHTML = '⏳ Redirecionando...';
    accessBtn.disabled = true;
    
    showNotification('🎯 Abrindo sistema...', 'info');
    
    // Estratégias diferentes baseadas na seleção
    let systemUrl = CONFIG.SYSTEM_URL;
    
    if (state.selectedAccountType === 'add') {
        // Adiciona parâmetros para forçar escolha de conta
        systemUrl += '?authuser=0'; // Força seleção de conta
    }
    
    // Abre o sistema
    const systemWindow = window.open(systemUrl, '_blank');
    
    // Tenta dar foco na janela do sistema
    setTimeout(() => {
        try {
            if (systemWindow && !systemWindow.closed) {
                systemWindow.focus();
                showNotification('✅ Sistema aberto! Verifique se está com a conta correta.', 'success');
            }
        } catch (e) {
            // Ignora erro de foco
        }
        
        // Restaura botão
        accessBtn.innerHTML = originalText;
        accessBtn.disabled = false;
    }, 3000);
}

function openAccountSwitchMobile() {
    if (isMobileDevice()) {
        // URLs específicas para mobile
        const mobileAccountUrl = 'https://accounts.google.com/AccountChooser?continue=https://drive.google.com&hl=pt-BR';
        
        // Tenta abrir no Chrome primeiro
        if (navigator.userAgent.includes('Chrome')) {
            window.location.href = `intent://accounts.google.com/AccountChooser#Intent;end`;
        } else {
            window.open(mobileAccountUrl, '_blank');
        }
        
        showNotification('📱 Abrindo gerenciador de contas...', 'info');
    } else {
        switchAccount();
    }
}

function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('👋 Selecione como deseja acessar o sistema', 'info');
    }, 1000);
}

function showNotification(message, type = 'info') {
    // Cria notificação temporária
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function updateButtonStates() {
    const accessBtn = document.getElementById('accessBtn');
    accessBtn.disabled = !state.selectedAccountType;
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// CSS para animações de notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
    }
`;
document.head.appendChild(style);
