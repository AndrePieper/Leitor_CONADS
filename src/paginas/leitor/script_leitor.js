const botaoVoltar = document.getElementById('botao-voltar');
const videoScanner = document.getElementById('video-scanner');
const mensagemScanner = document.getElementById('mensagem-scanner');
const usuarioLeitorInfo = document.getElementById('usuario-leitor-info');

let cameraStream = null;
let scannerAtivo = false;
let animationFrameId = null;
const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d');
const barcodeDetector = window.BarcodeDetector ? new BarcodeDetector({ formats: ['qr_code'] }) : null;

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
            headers: {
                'Content-Type': 'application/json',
            },
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

function pararCameraScanner() {
    scannerAtivo = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    if (videoScanner) {
        videoScanner.pause();
        videoScanner.srcObject = null;
    }
}

async function processarFrameQRCode() {
    if (!scannerAtivo) return;

    if (typeof jsQR !== 'function' && !barcodeDetector) {
        console.error('jsQR/BarcodeDetector não disponível');
        mostrarMensagemScanner('Erro interno: biblioteca de leitura QR não carregada.', 'erro');
        return;
    }

    if (!videoScanner || videoScanner.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // vídeo ainda não pronto, tentar novamente em 1s
        animationFrameId = setTimeout(processarFrameQRCode, 1000);
        return;
    }

    canvasQRCode.width = videoScanner.videoWidth;
    canvasQRCode.height = videoScanner.videoHeight;
    contextoQRCode.drawImage(videoScanner, 0, 0, canvasQRCode.width, canvasQRCode.height);

    let textoQRCode = null;

    if (barcodeDetector) {
        try {
            const resultados = await barcodeDetector.detect(canvasQRCode);
            if (resultados.length > 0) textoQRCode = resultados[0].rawValue;
        } catch (erro) {
            console.warn('BarcodeDetector falhou:', erro);
        }
    }

    if (!textoQRCode) {
        let imageData;
        try {
            imageData = contextoQRCode.getImageData(0, 0, canvasQRCode.width, canvasQRCode.height);
        } catch (e) {
            console.warn('Erro ao capturar frame:', e);
            animationFrameId = setTimeout(processarFrameQRCode, 1000);
            return;
        }
        const codigoQR = jsQR(imageData.data, imageData.width, imageData.height);
        if (codigoQR?.data) textoQRCode = codigoQR.data;
    }

    if (textoQRCode) {
        const idChamada = extrairIdChamadaDoQRCode(textoQRCode);

        if (idChamada) {
            mostrarMensagemScanner(`QR detectado: ${idChamada}`, 'sucesso');
            scannerAtivo = false;
            pararCameraScanner();
            const resultado = await enviarPresencaCongresso(idChamada);
            if (resultado?.ok) {
                mostrarMensagemScanner('Presença registrada com sucesso!', 'sucesso');
                setTimeout(() => { window.location.href = '../home/pagina_home.html'; }, 1500);
                return;
            }
            mostrarMensagemScanner(resultado?.mensagem || 'Erro ao enviar presença.', 'erro');
            // reativar e tentar novamente em 5s
            scannerAtivo = true;
            animationFrameId = setTimeout(processarFrameQRCode, 5000);
            return;
        }

        mostrarMensagemScanner('QR detectado, mas id_chamada não foi encontrado.', 'erro');
    }

    // nenhum QR detectado: tentar novamente em 5s
    animationFrameId = setTimeout(processarFrameQRCode, 5000);
}

async function obterStreamCameraPreferida() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera.');
    }

    const opcoesAmbiente = {
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
    };

    try {
        return await navigator.mediaDevices.getUserMedia(opcoesAmbiente);
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

async function iniciarCameraScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarMensagemScanner('Seu navegador não suporta acesso à câmera.', 'erro');
        return;
    }

    try {
        videoScanner?.setAttribute('playsinline', '');
        videoScanner?.setAttribute('webkit-playsinline', '');

        cameraStream = await obterStreamCameraPreferida();
        videoScanner.srcObject = cameraStream;
        await videoScanner.play();

        scannerAtivo = true;
        processarFrameQRCode();
    } catch (erro) {
        console.error('Erro ao iniciar câmera:', erro);
        const mensagem = erro?.name === 'NotAllowedError' || erro?.name === 'PermissionDeniedError'
            ? 'Permissão negada para acessar a câmera. Confirme o acesso no navegador.'
            : 'Câmera indisponível no momento. Tente novamente ou use outro navegador mobile.';
        mostrarMensagemScanner(mensagem, 'erro');
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
    pararCameraScanner();
    window.location.href = '../home/pagina_home.html';
}

function inicializarPaginaLeitor() {
    if (!verificarAutenticacaoLeitor()) {
        return;
    }

    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', voltarParaHome);
    }

    iniciarCameraScanner();
}

document.addEventListener('DOMContentLoaded', inicializarPaginaLeitor);
