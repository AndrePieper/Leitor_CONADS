// ============================================
// Importações
// ============================================

import { verificarAutenticacao } from '../../utils/api.js';

// ============================================
// Elementos do DOM
// ============================================

const botaoIrLeitor = document.getElementById('botao-ir-leitor');

// ============================================
// Funções de Navegação
// ============================================

function redirecionarParaLogin() {
    window.location.href = '/login.html';
}

function redirecionarParaLeitor() {
    window.location.href = '/leitor.html';
}

// ============================================
// Funções de Inicialização
// ============================================

function inicializarEventosHome() {
    if (botaoIrLeitor) {
        botaoIrLeitor.addEventListener('click', redirecionarParaLeitor);
    }
}

function inicializarPaginaHome() {
    if (!verificarAutenticacao()) {
        redirecionarParaLogin();
        return;
    }

    inicializarEventosHome();
}

// ============================================
// Execução Inicial
// ============================================

document.addEventListener('DOMContentLoaded', inicializarPaginaHome);
