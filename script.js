// Configurações do Sistema
const CONFIG = {
    SYSTEM_URL: "https://script.google.com/a/macros/joinville.sc.gov.br/s/AKfycbw58HPHL7E18bhmZSlLBMaxXX6WX_toKNMLaclJE01XOFGaOxB6pHFWE9F2MWp6ysMEPw/exec",
    DOMAIN_REQUIRED: "joinville.sc.gov.br",
    ACCOUNT_SWITCH_URLS: {
        ADD_ACCOUNT: "https://accounts.google.com/AddSession",
        ACCOUNT_CHOOSER: "https://accounts.google.com/AccountChooser",
        DRIVE_REDIRECT: "https://accounts.google.com/AccountChooser?continue=https://drive.google.com",
        WITH_PARAMS: "https://accounts.google.com/AccountChooser?continue=https://docs.google.com&hl=pt-BR"
    },
    TIMEOUTS: {
        NOTIFICATION: 5000,
        REDIRECT: 2000,
        RETRY: 3000
    }
};

// Estado Global do Sistema
const STATE = {
    selectedAccountType: null,
    isProcessing: false,
    retryCount: 0,
    maxRetries: 3,
    currentStep: 'selection'
};

// Inicialização do Sistema
class AccountManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.showWelcomeNotification();
            this.setupMobileOptimizations();
        });
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1' && !STATE.isProcessing) {
                this.selectAccount('institutional');
            } else if (e.key === '2' && !STATE.isProcessing) {
                this.selectAccount('add');
            } else if (e.key === 'Enter' && STATE.selectedAccountType && !STATE.isProcessing) {
                this.handleAccess();
            } else if (e.key === 's' && !STATE.isProcessing) {
                this.switchAccount();
            }
        });

        // Touch optimizations
        this.setupTouchEvents();
    }

    setupTouchEvents() {
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('touchstart', () => {
                card.style.transform = 'scale(0.98)';
            }, { passive: true });

            card.addEventListener('touchend', () => {
                card.style.transform = '';
            }, { passive: true });
        });
    }

    setupMobileOptimizations() {
        if (this.isMobileDevice()) {
            document.body.classList.add('mobile');
            this.showNotification('📱 Modo mobile ativado', 'info');
        }
    }

    // Seleção de Conta
    selectAccount(type) {
        if (STATE.isProcessing) return;

        STATE.selectedAccountType = type;
        
        const optionCards = document.querySelectorAll('.option-card');
        const selectedAccountDiv = document.getElementById('selectedAccount');
        const accountInfoDiv = document.getElementById('accountInfo');
        const accessBtn = document.getElementById('accessBtn');

        // Remove seleções anteriores
        optionCards.forEach(card => {
            card.classList.remove('selected');
            card.style.transform = '';
        });

        // Aplica seleção atual
        const selectedCard = Array.from(optionCards).find(card => 
            card.querySelector('h3').textContent.includes(type === 'institutional' ? 'Institucional' : 'Adicionar')
        );
        
        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedCard.classList.add('pulse');
        }

        // Atualiza informações
        const accountInfo = type === 'institutional' 
            ? {
                icon: '🏢',
                title: 'Conta Institucional',
                description: '@joinville.sc.gov.br',
                instructions: 'Acessará com a conta institucional atual'
            }
            : {
                icon: '👤',
                title: 'Adicionar/Selecionar Conta',
                description: 'Seletor de contas Google',
                instructions: 'Você poderá escolher entre contas existentes'
            };

        accountInfoDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 1.5rem;">${accountInfo.icon}</span>
                <div>
                    <strong>${accountInfo.title}</strong><br>
                    <span style="color: #666;">${accountInfo.description}</span>
                </div>
            </div>
        `;

        // Mostra e anima a seção selecionada
        selectedAccountDiv.style.display = 'block';
        selectedAccountDiv.classList.add('fade-in');

        // Atualiza botão de acesso
        accessBtn.disabled = false;
        accessBtn.innerHTML = type === 'institutional' 
            ? '🏢 Acessar com Conta Institucional' 
            : '👤 Acessar e Escolher Conta';

        // Remove animação pulse
        setTimeout(() => {
            if (selectedCard) selectedCard.classList.remove('pulse');
        }, 500);

        this.showNotification(`✅ ${accountInfo.instructions}`, 'success');
        STATE.currentStep = 'account_selected';
    }

    // Troca de Conta
    async switchAccount() {
        if (STATE.isProcessing) return;

        STATE.isProcessing = true;
        this.updateButtonStates(true);

        this.showNotification('🔄 Abrindo seletor de contas Google...', 'info');

        try {
            // Estratégias diferentes para diferentes cenários
            const urls = [
                CONFIG.ACCOUNT_SWITCH_URLS.ACCOUNT_CHOOSER,
                CONFIG.ACCOUNT_SWITCH_URLS.ADD_ACCOUNT,
                CONFIG.ACCOUNT_SWITCH_URLS.WITH_PARAMS
            ];

            // Tenta abrir múltiplas URLs para melhor compatibilidade
            const windows = urls.map(url => {
                try {
                    return window.open(url, '_blank', 'width=600,height=700');
                } catch (e) {
                    console.warn('Não foi possível abrir janela:', url);
                    return null;
                }
            }).filter(win => win !== null);

            // Foca na primeira janela válida
            if (windows.length > 0) {
                setTimeout(() => {
                    try {
                        windows[0].focus();
                    } catch (e) {
                        // Ignora erro de foco entre domínios
                    }
                }, 1000);
            }

            this.showNotification('✅ Seletor de contas aberto. Adicione ou selecione uma conta Google.', 'success');

        } catch (error) {
            console.error('Erro ao trocar conta:', error);
            this.showNotification('❌ Erro ao abrir seletor de contas', 'error');
        } finally {
            setTimeout(() => {
                STATE.isProcessing = false;
                this.updateButtonStates(false);
            }, 2000);
        }
    }

    // Acesso ao Sistema
    async handleAccess() {
        if (!STATE.selectedAccountType || STATE.isProcessing) return;

        STATE.isProcessing = true;
        STATE.retryCount = 0;
        this.updateButtonStates(true);

        const accessBtn = document.getElementById('accessBtn');
        const originalText = accessBtn.innerHTML;

        this.showNotification('🎯 Preparando acesso ao sistema...', 'info');

        try {
            await this.attemptSystemAccess();
        } catch (error) {
            console.error('Erro no acesso:', error);
            this.showNotification('❌ Erro ao acessar o sistema', 'error');
        } finally {
            accessBtn.innerHTML = originalText;
            STATE.isProcessing = false;
            this.updateButtonStates(false);
        }
    }

    async attemptSystemAccess() {
        return new Promise((resolve, reject) => {
            const accessBtn = document.getElementById('accessBtn');
            
            // Constrói URL baseada na seleção
            let systemUrl = CONFIG.SYSTEM_URL;
            if (STATE.selectedAccountType === 'add') {
                systemUrl += '?authuser=0'; // Força seleção de conta
            }

            accessBtn.innerHTML = '⏳ Redirecionando...';

            // Abre o sistema
            const systemWindow = window.open(systemUrl, '_blank');
            
            if (!systemWindow) {
                this.showNotification('❌ Pop-up bloqueado. Permita pop-ups para este site.', 'error');
                reject(new Error('Pop-up blocked'));
                return;
            }

            this.showNotification('✅ Sistema aberto! Verifique se está com a conta correta.', 'success');

            // Monitora a janela (quando possível)
            const checkInterval = setInterval(() => {
                if (systemWindow.closed) {
                    clearInterval(checkInterval);
                    this.showNotification('📋 Janela do sistema fechada', 'info');
                    resolve();
                }
            }, 1000);

            // Timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                try {
                    systemWindow.focus();
                } catch (e) {
                    // Ignora erro de foco
                }
                resolve();
            }, 3000);
        });
    }

    // Mobile-specific functions
    openAccountSwitchMobile() {
        if (this.isMobileDevice()) {
            // URLs específicas para mobile
            const mobileUrls = [
                'googlechrome://navigate?url=' + encodeURIComponent(CONFIG.ACCOUNT_SWITCH_URLS.ACCOUNT_CHOOSER),
                'intent://accounts.google.com/AccountChooser#Intent;end',
                CONFIG.ACCOUNT_SWITCH_URLS.ACCOUNT_CHOOSER
            ];

            let opened = false;
            
            for (const url of mobileUrls) {
                try {
                    window.location.href = url;
                    opened = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!opened) {
                window.open(CONFIG.ACCOUNT_SWITCH_URLS.ACCOUNT_CHOOSER, '_blank');
            }

            this.showNotification('📱 Abrindo gerenciador de contas...', 'info');
        } else {
            this.switchAccount();
        }
    }

    // Utilitários
    updateButtonStates(processing) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (processing) {
                btn.disabled = true;
                btn.style.opacity = '0.7';
            } else {
                const isAccessBtn = btn.classList.contains('btn-access');
                btn.disabled = isAccessBtn ? !STATE.selectedAccountType : false;
                btn.style.opacity = '';
            }
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span>${icons[type]} ${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        container.appendChild(notification);

        // Remove automaticamente
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, CONFIG.TIMEOUTS.NOTIFICATION);
    }

    showWelcomeNotification() {
        setTimeout(() => {
            this.showNotification('👋 Bem-vindo! Selecione como deseja acessar o sistema', 'info');
        }, 1000);
    }

    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Debug e desenvolvimento
    enableDebugMode() {
        window.debugState = () => JSON.parse(JSON.stringify(STATE));
        window.debugConfig = () => JSON.parse(JSON.stringify(CONFIG));
        console.log('🔧 Modo debug ativado. Use debugState() e debugConfig()');
    }
}

// Inicialização Global
const accountManager = new AccountManager();

// Funções Globais para HTML
function selectAccount(type) {
    accountManager.selectAccount(type);
}

function switchAccount() {
    accountManager.switchAccount();
}

function handleAccess() {
    accountManager.handleAccess();
}

// Inicialização adicional para compatibilidade
window.addEventListener('load', () => {
    // Adiciona classes de carregamento
    document.body.classList.add('loaded');
    
    // Verifica se é mobile e ajusta interface
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        document.body.classList.add('mobile-device');
    }
});

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('SW registered: ', registration);
        }).catch(function(registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
