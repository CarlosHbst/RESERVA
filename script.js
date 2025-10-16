// Configurações
const CONFIG = {
    SYSTEM_URL: "https://script.google.com/a/macros/joinville.sc.gov.br/SEU_ID_AQUI/exec",
    DOMAIN_REQUIRED: "joinville.sc.gov.br",
    CHECK_INTERVAL: 2000,
    MAX_RETRIES: 3
};

// Estado do sistema
let state = {
    currentRetry: 0,
    isChecking: false,
    lastStatus: null
};

// Elementos DOM
const elements = {
    statusCard: null,
    accessBtn: null,
    mobileSection: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    checkInitialAccess();
    setupMobileDetection();
});

function initializeElements() {
    elements.statusCard = document.getElementById('statusCard');
    elements.accessBtn = document.getElementById('accessBtn');
    elements.mobileSection = document.getElementById('mobileSection');
}

function checkInitialAccess() {
    updateStatus('loading', 'Verificando configuração de acesso...');
    
    // Simula verificação (em produção, pode ser mais complexa)
    setTimeout(() => {
        if (isMobileDevice()) {
            updateStatus('warning', 'Dispositivo móvel detectado. Use o Chrome para melhor experiência.');
            showMobileSection();
        } else {
            updateStatus('info', 'Clique em "Acessar Sistema" quando estiver com a conta institucional logada.');
        }
        
        enableAccessButton();
    }, 2000);
}

function updateStatus(type, message) {
    const icons = {
        loading: '⏳',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    elements.statusCard.innerHTML = `
        <div class="status-${type}">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icons[type]}</div>
            <p>${message}</p>
        </div>
    `;
    
    elements.statusCard.className = `status-card status-${type}`;
}

function enableAccessButton() {
    elements.accessBtn.disabled = false;
    elements.accessBtn.innerHTML = '✅ Acessar Sistema';
}

function handleLogout() {
    updateStatus('info', 'Redirecionando para logout...');
    
    // Abre múltiplas URLs de logout para garantir
    const logoutUrls = [
        'https://accounts.google.com/Logout',
        'https://mail.google.com/mail/logout',
        'https://drive.google.com/logout'
    ];
    
    logoutUrls.forEach(url => {
        window.open(url, '_blank');
    });
    
    setTimeout(() => {
        alert('Logout realizado. Agora entre com sua conta @joinville.sc.gov.br e retorne a esta página.');
        updateStatus('success', 'Pronto! Agora entre com @joinville.sc.gov.br');
    }, 1000);
}

function handleAccess() {
    if (state.isChecking) return;
    
    state.isChecking = true;
    state.currentRetry = 0;
    
    updateStatus('loading', 'Tentando acessar o sistema...');
    elements.accessBtn.disabled = true;
    elements.accessBtn.innerHTML = '⏳ Acessando...';
    
    attemptAccess();
}

function attemptAccess() {
    if (state.currentRetry >= CONFIG.MAX_RETRIES) {
        updateStatus('error', 'Não foi possível acessar. Verifique se está logado com a conta correta.');
        elements.accessBtn.disabled = false;
        elements.accessBtn.innerHTML = '🔄 Tentar Novamente';
        state.isChecking = false;
        return;
    }
    
    state.currentRetry++;
    
    const systemWindow = window.open(CONFIG.SYSTEM_URL, '_blank');
    
    // Verificação simplificada de acesso
    setTimeout(() => {
        if (!systemWindow || systemWindow.closed) {
            updateStatus('warning', `Tentativa ${state.currentRetry}/${CONFIG.MAX_RETRIES}: Acesso pode ter sido bloqueado`);
            attemptAccess();
        } else {
            updateStatus('success', 'Sistema aberto com sucesso!');
            elements.accessBtn.innerHTML = '✅ Acesso Concedido';
            state.isChecking = false;
            
            // Foca na janela do sistema
            try {
                systemWindow.focus();
            } catch (e) {
                // Ignora erro de foco entre domínios
            }
        }
    }, CONFIG.CHECK_INTERVAL);
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function setupMobileDetection() {
    if (isMobileDevice()) {
        showMobileSection();
    }
}

function showMobileSection() {
    if (elements.mobileSection) {
        elements.mobileSection.style.display = 'block';
    }
}

function openInChrome() {
    if (isMobileDevice()) {
        const chromeUrl = `googlechrome://navigate?url=${encodeURIComponent(window.location.href)}`;
        window.location.href = chromeUrl;
        
        // Fallback
        setTimeout(() => {
            window.open(CONFIG.SYSTEM_URL, '_blank');
        }, 1000);
    }
}

function openTroubleshoot() {
    const troubleshootWindow = window.open('', '_blank');
    troubleshootWindow.document.write(`
        <html>
            <head><title>Guia de Solução de Problemas</title></head>
            <body>
                <h1>Guia de Solução de Problemas</h1>
                <h2>Problemas Comuns e Soluções:</h2>
                <ol>
                    <li><strong>Não consigo trocar de conta:</strong> Use uma janela anônima/privada</li>
                    <li><strong>Acesso negado:</strong> Verifique se o email é @joinville.sc.gov.br</li>
                    <li><strong>Página não carrega:</strong> Limpe cache e cookies do navegador</li>
                    <li><strong>Problemas no mobile:</strong> Use o navegador Chrome</li>
                    <li><strong>Sistema não abre:</strong> Verifique se há bloqueadores de pop-up</li>
                </ol>
                <button onclick="window.close()">Fechar</button>
            </body>
        </html>
    `);
}

// Utilitários para debug
function debug(message) {
    console.log(`[Sistema Acesso] ${message}`);
}
