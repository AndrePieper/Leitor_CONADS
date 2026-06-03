// ============================================
// Importações
// ============================================

import { CONFIG_API, fazerRequisicaoPost, armazenarDadosSessao } from '../../utils/api.js';

// ============================================
// Elementos do DOM
// ============================================

const entradaUsuario = document.getElementById('entrada-usuario');
const entradaSenha = document.getElementById('entrada-senha');
const botaoEntrar = document.getElementById('botao-entrar');
const mensagemErro = document.getElementById('mensagem-erro');

// ============================================
// Funções de Validação
// ============================================

function validarCamposLogin() {
    const email = entradaUsuario.value.trim();
    const senha = entradaSenha.value.trim();

    if (!email || !senha) {
        mostrarErro('Por favor, preencha todos os campos!');
        return false;
    }

    if (!validarFormatoEmail(email)) {
        mostrarErro('Por favor, insira um email válido!');
        return false;
    }

    return true;
}

function validarFormatoEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email);
}

function mostrarErro(textoErro) {
    mensagemErro.textContent = textoErro;
    mensagemErro.classList.add('visivel');
}

function esconderErro() {
    mensagemErro.classList.remove('visivel');
    mensagemErro.textContent = '';
}

// ============================================
// Funções de Autenticação com API
// ============================================

async function processarLogin() {
    esconderErro();

    if (!validarCamposLogin()) {
        return;
    }

    const email = entradaUsuario.value.trim();
    const senha = entradaSenha.value.trim();

    // Desabilitar botão durante requisição
    desabilitarBotaoEntrar(true);

    try {
        const resposta = await enviarRequisicaoLogin(email, senha);
        console.log('Login retornou:', resposta);
        await realizarRedirecionamentoParaHome(resposta, email);
    } catch (erro) {
        console.log('Erro no login:', erro);
        mostrarErro(erro.message || 'Erro ao fazer login. Tente novamente.');
        limparCampos();
    } finally {
        desabilitarBotaoEntrar(false);
    }
}

async function enviarRequisicaoLogin(email, senha) {
    const dados = {
        email: email,
        senha: senha
    };

    try {
        const resposta = await fazerRequisicaoPost(CONFIG_API.ENDPOINTS.LOGIN, dados);
        return resposta;
    } catch (erro) {
        throw erro;
    }
}

async function realizarRedirecionamentoParaHome(dadosResposta, email) {
    // Armazenar dados da sessão
    armazenarDadosSessao(dadosResposta, email);

    // Aguardar um pouco antes de redirecionar (feedback visual)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirecionar para a página inicial
    window.location.href = '/home.html';
}

function limparCampos() {
    entradaUsuario.value = '';
    entradaSenha.value = '';
    entradaUsuario.focus();
}

function desabilitarBotaoEntrar(desabilitar) {
    botaoEntrar.disabled = desabilitar;
    botaoEntrar.textContent = desabilitar ? '⏳ Entrando...' : 'Entrar no Sistema';
}

// ============================================
// Funções de Inicialização
// ============================================

function inicializarEventosLogin() {
    botaoEntrar.addEventListener('click', processarLogin);

    // Permitir envio ao pressionar Enter
    entradaSenha.addEventListener('keypress', (evento) => {
        if (evento.key === 'Enter') {
            processarLogin();
        }
    });

    // Limpar erro ao digitar
    entradaUsuario.addEventListener('input', esconderErro);
    entradaSenha.addEventListener('input', esconderErro);
}

// ============================================
// Execução Inicial
// ============================================

document.addEventListener('DOMContentLoaded', inicializarEventosLogin);
