// ============================================
// Importações
// ============================================

import { verificarAutenticacao } from '../../utils/api.js';

// ============================================
// Elementos do DOM
// ============================================

const botaoVoltar = document.getElementById('botao-voltar');
const botaoIniciarScanner = document.getElementById('botao-iniciar-scanner');
const botaoPararScanner = document.getElementById('botao-parar-scanner');
const videoScanner = document.getElementById('video-scanner');
const mensagemScanner = document.getElementById('mensagem-scanner');
const usuarioLeitorInfo = document.getElementById('usuario-leitor-info');

// ============================================
// Estado do Scanner
// ============================================

let streamScanner = null;
let scannerAtivo = false;
let animationFrameId = null;
const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d');

function mostrarMensagemScanner(texto, tipo = 'info') {
    if (!mensagemScanner) return;
    mensagemScanner.textContent = texto;
    mensagemScanner.className = tipo === 'erro' ? 'mensagem-scanner erro' : tipo === 'sucesso' ? 'mensagem-scanner sucesso' : 'mensagem-scanner';
}

function extrairIdChamadaDoQRCode(textoQRCode) {
    if (!textoQRCode) return null;

    try {
        const dados = JSON.parse(textoQRCode);
        return dados.id_chamada ?? dados.idChamado ?? dados.id ?? null;
    } catch {
        const valor = textoQRCode.trim();
        const match = valor.match(/\d+/);
        return match ? match[0] : valor || null;
    }
}

async function enviarPresencaCongresso(idChamada) {
    const idAluno = sessionStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioLogado');

    if (!idAluno) {
        mostrarMensagemScanner('ID do aluno não encontrado. Faça login novamente.', 'erro');
        return;
    }

    const dadosPresenca = {
        hora_post: new Date().toISOString(),
        id_chamada: idChamada,
        id_aluno: idAluno,
        tipo_presenca: 1,
    };

    try {
        const resposta = await fetch('https://projeto-iii-4.vercel.app/alunos/congresso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPresenca),
        });

        const conteudo = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const mensagemErro = conteudo?.mensagem || conteudo?.erro || `Status ${resposta.status}`;
            throw new Error(mensagemErro);
        }

        mostrarMensagemScanner('Presença registrada com sucesso!', 'sucesso');
    } catch (erro) {
        console.error('Erro ao enviar presença:', erro);
        mostrarMensagemScanner(erro.message || 'Erro ao enviar presença.', 'erro');
    }
}

function pararScannerQRCode() {
    scannerAtivo = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (streamScanner) {
        streamScanner.getTracks().forEach(track => track.stop());
        streamScanner = null;
    }

    if (videoScanner) {
        videoScanner.pause();
        videoScanner.srcObject = null;
    }
}

async function processarFrameQRCode() {
    if (!scannerAtivo) {
        return;
    }

    if (!videoScanner || videoScanner.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(processarFrameQRCode);
        return;
    }

    canvasQRCode.width = videoScanner.videoWidth;
    canvasQRCode.height = videoScanner.videoHeight;
    contextoQRCode.drawImage(videoScanner, 0, 0, canvasQRCode.width, canvasQRCode.height);

    const imageData = contextoQRCode.getImageData(0, 0, canvasQRCode.width, canvasQRCode.height);
    const codigoQR = jsQR(imageData.data, imageData.width, imageData.height);

    if (codigoQR?.data) {
        const idChamada = extrairIdChamadaDoQRCode(codigoQR.data);

        if (idChamada) {
            mostrarMensagemScanner(`QR detectado: ${idChamada}`, 'sucesso');
            pararScannerQRCode();
            await enviarPresencaCongresso(idChamada);
            return;
        }

        mostrarMensagemScanner('QR detectado, mas id_chamada não foi encontrado.', 'erro');
    }

    animationFrameId = requestAnimationFrame(processarFrameQRCode);
}

async function iniciarScannerQRCode() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarMensagemScanner('Seu navegador não suporta acesso à câmera.', 'erro');
        return;
    }

    try {
        mostrarMensagemScanner('Abrindo câmera... aponte para o QR code.', 'info');
        streamScanner = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        videoScanner.srcObject = streamScanner;
        await videoScanner.play();

        scannerAtivo = true;
        botaoIniciarScanner?.setAttribute('disabled', 'true');
        botaoPararScanner?.removeAttribute('disabled');

        processarFrameQRCode();
    } catch (erro) {
        console.error('Erro ao iniciar scanner:', erro);
        mostrarMensagemScanner('Permissão negada ou câmera indisponível. Use o botão para tentar novamente.', 'erro');
    }
}

function verificarAutenticacaoLeitor() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        window.location.href = '/login.html';
        return false;
    }

    if (usuarioLeitorInfo) {
        usuarioLeitorInfo.textContent = usuarioLogado;
    }

    return true;
}

function voltarParaHome() {
    pararScannerQRCode();
    window.location.href = '/home.html';
}

function inicializarEventosLeitor() {
    botaoVoltar?.addEventListener('click', voltarParaHome);
    botaoIniciarScanner?.addEventListener('click', iniciarScannerQRCode);
    botaoPararScanner?.addEventListener('click', pararScannerQRCode);
}

function inicializarPaginaLeitor() {
    if (!verificarAutenticacaoLeitor()) {
        return;
    }

    inicializarEventosLeitor();
    iniciarScannerQRCode();
}

document.addEventListener('DOMContentLoaded', inicializarPaginaLeitor);
