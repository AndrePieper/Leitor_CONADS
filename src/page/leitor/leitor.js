// ============================================
// Importações
// ============================================

import jsQR from 'jsqr';
import { CONFIG_API } from '../../utils/api.js';

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
let facingMode = 'environment';
const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d', { willReadFrequently: true });

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
    const idAluno = localStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioId') || localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');

    if (!idAluno) {
        return { ok: false, status: null, mensagem: 'ID do aluno não encontrado. Faça login novamente.' };
    }

    const dadosPresenca = {
        hora_post: new Date().toISOString(),
        id_chamada: idChamada,
        id_aluno: idAluno,
        tipo_presenca: 1,
    };
    const url = CONFIG_API.URL_BASE + CONFIG_API.ENDPOINTS.PRESENCA_CONGRESSO;

    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Logando informações do POST para facilitar debug
        console.info('Enviando POST de presença', {
            url,
            headers: Object.assign({}, headers, { Authorization: headers.Authorization ? '***REDACTED***' : undefined }),
            payload: dadosPresenca,
        });

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(dadosPresenca),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.message || data?.mensagem || 'Erro genérico');
        }

        return { ok: true, status: res.status, dados: data };
    } catch (error) {
        console.error('Falha no POST de presença:', error?.message || error);
        return { ok: false, status: null, mensagem: error?.message || 'Erro ao enviar presença.' };
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
    botaoIniciarScanner?.removeAttribute('disabled');
    botaoPararScanner?.setAttribute('disabled', 'true');
}
async function processarFrameQRCode() {
    if (!scannerAtivo) return;

    if (typeof jsQR !== 'function') {
        console.error('jsQR não está disponível');
        mostrarMensagemScanner('Erro interno: biblioteca de leitura QR não carregada.', 'erro');
        return;
    }

    if (!videoScanner || videoScanner.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(processarFrameQRCode);
        return;
    }

    if (videoScanner.videoWidth === 0 || videoScanner.videoHeight === 0) {
        animationFrameId = requestAnimationFrame(processarFrameQRCode);
        return;
    }

    const maxScanWidth = 640;
    const aspectRatio = videoScanner.videoWidth / videoScanner.videoHeight;
    const scanWidth = Math.min(videoScanner.videoWidth, maxScanWidth);
    const scanHeight = Math.round(scanWidth / aspectRatio);

    canvasQRCode.width = scanWidth;
    canvasQRCode.height = scanHeight;
    contextoQRCode.drawImage(videoScanner, 0, 0, scanWidth, scanHeight);

    let textoQRCode = null;

    try {
        if (window.BarcodeDetector) {
            try {
                const detector = new BarcodeDetector({ formats: ['qr_code'] });
                const resultados = await detector.detect(canvasQRCode);
                if (resultados?.length) textoQRCode = resultados[0].rawValue;
            } catch (detErr) {
                console.warn('BarcodeDetector falhou:', detErr);
            }
        }

        if (!textoQRCode) {
            const imageData = contextoQRCode.getImageData(0, 0, canvasQRCode.width, canvasQRCode.height);
            const codigoQR = jsQR(imageData.data, imageData.width, imageData.height);
            if (codigoQR?.data) textoQRCode = codigoQR.data;
        }
    } catch (e) {
        console.warn('Erro ao processar frame:', e);
    }

    if (textoQRCode) {
        const idChamada = extrairIdChamadaDoQRCode(textoQRCode);

        if (idChamada) {
            mostrarMensagemScanner(`QR detectado: ${idChamada}`, 'sucesso');
            scannerAtivo = false;
            pararScannerQRCode();
            const resultado = await enviarPresencaCongresso(idChamada);
            if (resultado?.ok) {
                mostrarMensagemScanner('Presença registrada com sucesso!', 'sucesso');
                setTimeout(() => { window.location.href = '/home.html'; }, 1500);
                return;
            }
            mostrarMensagemScanner(resultado?.mensagem || 'Erro ao enviar presença.', 'erro');
            // reativar e continuar
            scannerAtivo = true;
            animationFrameId = requestAnimationFrame(processarFrameQRCode);
            return;
        }

        mostrarMensagemScanner('QR detectado, mas id_chamada não foi encontrado.', 'erro');
    }

    // continuar loop
    animationFrameId = requestAnimationFrame(processarFrameQRCode);
}

async function obterStreamCameraPreferida() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera.');
    }
    const opcoes = { video: { facingMode: { ideal: facingMode } }, audio: false };

    try {
        return await navigator.mediaDevices.getUserMedia(opcoes);
    } catch (erro) {
        console.warn('Falha usando facingMode environment:', erro);

        if (!navigator.mediaDevices?.enumerateDevices) {
            throw erro;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            for (const device of videoInputs) {
                try {
                    return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } }, audio: false });
                } catch (innerErro) {
                    console.warn(`Falha ao abrir câmera ${device.label || device.deviceId}:`, innerErro);
                }
            }
        } catch (innerErro) {
            console.warn('Falha ao enumerar dispositivos de vídeo:', innerErro);
        }

        throw erro;
    }
}

async function iniciarScannerQRCode() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarMensagemScanner('Seu navegador não suporta acesso à câmera.', 'erro');
        return;
    }

    try {
        videoScanner?.setAttribute('playsinline', '');
        videoScanner?.setAttribute('webkit-playsinline', '');
        botaoIniciarScanner?.setAttribute('disabled', 'true');
        botaoPararScanner?.removeAttribute('disabled');

        // abrir stream com o facingMode atual
        streamScanner = await obterStreamCameraPreferida();
        videoScanner.srcObject = streamScanner;
        await videoScanner.play();

        // mostrar botão de troca de câmera quando houver mais de uma
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            if (videoInputs.length > 1) botaoTrocarCamera?.classList.remove('oculto');
        } catch (e) {
            // ignore
        }

        scannerAtivo = true;
        botaoIniciarScanner?.setAttribute('disabled', 'true');
        botaoPararScanner?.removeAttribute('disabled');

        processarFrameQRCode();
    } catch (erro) {
        console.error('Erro ao iniciar scanner:', erro);
        if (erro?.name === 'NotAllowedError' || erro?.name === 'PermissionDeniedError') {
            mostrarMensagemScanner('Permissão negada para acessar a câmera. Confirme o acesso nas configurações do navegador.', 'erro');
        } else if (erro?.name === 'NotFoundError' || erro?.name === 'OverconstrainedError') {
            mostrarMensagemScanner('Câmera não encontrada neste dispositivo.', 'erro');
        } else {
            mostrarMensagemScanner('Câmera indisponível no momento. Tente novamente ou use outro navegador.', 'erro');
        }
    }
}

function trocarCamera() {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    // reiniciar stream se já estava ativo
    if (streamScanner) {
        pararScannerQRCode();
        // pequena espera para garantir que tracks parem
        setTimeout(() => iniciarScannerQRCode(), 250);
    }
}

function verificarAutenticacaoLeitor() {
    const usuarioLogado = localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');

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
    // listeners para botões visíveis/ocultos
    const botaoVisivel = document.getElementById('botao-iniciar-scanner-visivel');
    botaoVisivel?.addEventListener('click', iniciarScannerQRCode);
    botaoIniciarScanner?.addEventListener('click', iniciarScannerQRCode);
    botaoPararScanner?.addEventListener('click', pararScannerQRCode);
    const btnTrocar = document.getElementById('botao-trocar-camera');
    btnTrocar?.addEventListener('click', trocarCamera);
    // expose for other parts
    window.botaoTrocarCamera = btnTrocar;
}

function inicializarPaginaLeitor() {
    if (!verificarAutenticacaoLeitor()) {
        return;
    }

    inicializarEventosLeitor();
    mostrarMensagemScanner('Toque em Abrir câmera para iniciar o scanner.', 'info');
}

document.addEventListener('DOMContentLoaded', inicializarPaginaLeitor);
