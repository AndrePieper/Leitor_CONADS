// ============================================
// Elementos do DOM
// ============================================

const entradaArquivo = document.getElementById('entrada-arquivo');
const botaoUpload = document.querySelector('.botao-upload');
const listaDocumentos = document.getElementById('lista-documentos');
const areaDocumento = document.getElementById('area-documento');
const botaoVoltar = document.getElementById('botao-voltar');
const usuarioLeitorInfo = document.getElementById('usuario-leitor-info');

// Botões de ferramentas
const botaoZoomAumentar = document.getElementById('botao-zoom-aumentar');
const botaoZoomDiminuir = document.getElementById('botao-zoom-diminuir');
const botaoRotacionar = document.getElementById('botao-rotacionar');
const botaoDownload = document.getElementById('botao-download');

// Controles de navegação
const botaoPaginaAnterior = document.getElementById('botao-pagina-anterior');
const botaoProximaPagina = document.getElementById('botao-proxima-pagina');
const paginaAtualElemento = document.getElementById('pagina-atual');
const totalPaginasElemento = document.getElementById('total-paginas');

// Informações do documento
const infoNomeDoc = document.getElementById('info-nome-doc');
const infoTipoDoc = document.getElementById('info-tipo-doc');
const infoTamanhoDoc = document.getElementById('info-tamanho-doc');
const infoDataDoc = document.getElementById('info-data-doc');

// Anotações
const areaAnotacoes = document.getElementById('area-anotacoes');
const botaoSalvarAnotacoes = document.getElementById('botao-salvar-anotacoes');

// ============================================
// Estado da Aplicação
// ============================================

const estadoLeitor = {
    documentosCarregados: [],
    documentoAtual: null,
    paginaAtual: 0,
    totalPaginas: 0,
    nivelZoom: 100,
    rotacao: 0,
};

// ============================================
// Funções de Autenticação
// ============================================

function verificarAutenticacaoLeitor() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    
    if (!usuarioLogado) {
        redirecionarParaLogin();
        return false;
    }

    usuarioLeitorInfo.textContent = usuarioLogado;
    return true;
}

function redirecionarParaLogin() {
    window.location.href = '/login.html';
}

// ============================================
// Funções de Upload de Arquivo
// ============================================

function procesarArquivoSelecionado(evento) {
    const arquivo = evento.target.files[0];
    
    if (!arquivo) return;

    // Validar tipo de arquivo
    if (!validarTipoArquivo(arquivo)) {
        alert('Tipo de arquivo não suportado!');
        return;
    }

    // Validar tamanho (máximo 10MB)
    if (arquivo.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande! Máximo: 10MB');
        return;
    }

    adicionarDocumentoCarregado(arquivo);
}

function validarTipoArquivo(arquivo) {
    const tiposPermitidos = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'];
    return tiposPermitidos.includes(arquivo.type);
}

function adicionarDocumentoCarregado(arquivo) {
    const documentoNovo = {
        id: Date.now(),
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size,
        data: new Date().toLocaleString('pt-BR'),
        arquivo: arquivo,
    };

    estadoLeitor.documentosCarregados.push(documentoNovo);
    atualizarListaDocumentos();

    // Selecionar automaticamente o novo documento
    selecionarDocumento(documentoNovo.id);
}

// ============================================
// Funções de Gerenciamento de Documentos
// ============================================

function atualizarListaDocumentos() {
    if (estadoLeitor.documentosCarregados.length === 0) {
        listaDocumentos.innerHTML = '<p class="vazio">Nenhum documento carregado</p>';
        return;
    }

    listaDocumentos.innerHTML = estadoLeitor.documentosCarregados
        .map(doc => `
            <div class="item-documento ${doc.id === estadoLeitor.documentoAtual?.id ? 'ativo' : ''}" data-id="${doc.id}">
                <div class="nome-item-doc">${truncarTexto(doc.nome, 20)}</div>
                <div class="tamanho-item-doc">${formatarTamanhoArquivo(doc.tamanho)}</div>
            </div>
        `)
        .join('');

    // Adicionar event listeners aos itens
    document.querySelectorAll('.item-documento').forEach(item => {
        item.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            selecionarDocumento(id);
        });
    });
}

function selecionarDocumento(id) {
    const documento = estadoLeitor.documentosCarregados.find(doc => doc.id === id);
    
    if (!documento) return;

    estadoLeitor.documentoAtual = documento;
    estadoLeitor.paginaAtual = 0;
    estadoLeitor.totalPaginas = 1; // Simulado para este exemplo
    estadoLeitor.nivelZoom = 100;
    estadoLeitor.rotacao = 0;

    atualizarListaDocumentos();
    exibirDocumento();
    atualizarInformacoesDocumento();
    atualizarControlesNavegacao();
}

function exibirDocumento() {
    if (!estadoLeitor.documentoAtual) {
        areaDocumento.innerHTML = `
            <div class="placeholder-documento">
                <div class="icone-placeholder">📄</div>
                <p>Selecione um documento para visualizar</p>
            </div>
        `;
        return;
    }

    const { nome, tipo, arquivo } = estadoLeitor.documentoAtual;

    // Simular visualização do documento
    if (tipo.includes('image')) {
        const leitorArquivo = new FileReader();
        leitorArquivo.onload = (e) => {
            areaDocumento.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain; transform: scale(${estadoLeitor.nivelZoom / 100}) rotate(${estadoLeitor.rotacao}deg);" />
            `;
        };
        leitorArquivo.readAsDataURL(arquivo);
    } else {
        areaDocumento.innerHTML = `
            <div style="text-align: center; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                <p>${nome}</p>
                <p style="font-size: 12px; margin-top: 10px;">Tipo: ${tipo}</p>
                <p style="font-size: 12px; color: #ccc;">Visualização de ${tipo} não suportada no navegador</p>
            </div>
        `;
    }
}

function atualizarInformacoesDocumento() {
    if (!estadoLeitor.documentoAtual) {
        infoNomeDoc.textContent = '—';
        infoTipoDoc.textContent = '—';
        infoTamanhoDoc.textContent = '—';
        infoDataDoc.textContent = '—';
        return;
    }

    const { nome, tipo, tamanho, data } = estadoLeitor.documentoAtual;

    infoNomeDoc.textContent = nome;
    infoTipoDoc.textContent = tipo || 'Desconhecido';
    infoTamanhoDoc.textContent = formatarTamanhoArquivo(tamanho);
    infoDataDoc.textContent = data;

    botaoDownload.disabled = false;
}

// ============================================
// Funções de Ferramentas
// ============================================

function aumentarZoom() {
    if (estadoLeitor.nivelZoom < 300) {
        estadoLeitor.nivelZoom += 25;
        exibirDocumento();
    }
}

function diminuirZoom() {
    if (estadoLeitor.nivelZoom > 50) {
        estadoLeitor.nivelZoom -= 25;
        exibirDocumento();
    }
}

function rotacionarDocumento() {
    estadoLeitor.rotacao = (estadoLeitor.rotacao + 90) % 360;
    exibirDocumento();
}

function baixarDocumento() {
    if (!estadoLeitor.documentoAtual) return;

    const { arquivo } = estadoLeitor.documentoAtual;
    const linkDownload = document.createElement('a');
    linkDownload.href = URL.createObjectURL(arquivo);
    linkDownload.download = arquivo.name;
    linkDownload.click();
}

// ============================================
// Funções de Navegação de Páginas
// ============================================

function atualizarControlesNavegacao() {
    const temAnterior = estadoLeitor.paginaAtual > 0;
    const temProxima = estadoLeitor.paginaAtual < estadoLeitor.totalPaginas - 1;

    botaoPaginaAnterior.disabled = !temAnterior;
    botaoProximaPagina.disabled = !temProxima;

    paginaAtualElemento.textContent = estadoLeitor.paginaAtual + 1;
    totalPaginasElemento.textContent = estadoLeitor.totalPaginas;
}

function irParaPaginaAnterior() {
    if (estadoLeitor.paginaAtual > 0) {
        estadoLeitor.paginaAtual--;
        exibirDocumento();
        atualizarControlesNavegacao();
    }
}

function irParaProximaPagina() {
    if (estadoLeitor.paginaAtual < estadoLeitor.totalPaginas - 1) {
        estadoLeitor.paginaAtual++;
        exibirDocumento();
        atualizarControlesNavegacao();
    }
}

// ============================================
// Funções de Anotações
// ============================================

function salvarAnotacoes() {
    if (!estadoLeitor.documentoAtual) return;

    const anotacaoTexto = areaAnotacoes.value.trim();
    const chaveArmazenamento = `anotacoes_${estadoLeitor.documentoAtual.id}`;

    localStorage.setItem(chaveArmazenamento, anotacaoTexto);
    alert('Anotações salvas com sucesso!');
}

function carregarAnotacoes() {
    if (!estadoLeitor.documentoAtual) {
        areaAnotacoes.value = '';
        return;
    }

    const chaveArmazenamento = `anotacoes_${estadoLeitor.documentoAtual.id}`;
    const anotacoes = localStorage.getItem(chaveArmazenamento) || '';
    areaAnotacoes.value = anotacoes;
}

// ============================================
// Funções Utilitárias
// ============================================

function formatarTamanhoArquivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + tamanhos[i];
}

function truncarTexto(texto, limite) {
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
}

// ============================================
// Funções de Inicialização
// ============================================

function inicializarEventosLeitor() {
    // Upload
    entradaArquivo.addEventListener('change', procesarArquivoSelecionado);

    // Ferramentas
    botaoZoomAumentar.addEventListener('click', aumentarZoom);
    botaoZoomDiminuir.addEventListener('click', diminuirZoom);
    botaoRotacionar.addEventListener('click', rotacionarDocumento);
    botaoDownload.addEventListener('click', baixarDocumento);

    // Navegação
    botaoPaginaAnterior.addEventListener('click', irParaPaginaAnterior);
    botaoProximaPagina.addEventListener('click', irParaProximaPagina);

    // Anotações
    botaoSalvarAnotacoes.addEventListener('click', salvarAnotacoes);

    // Voltar
    botaoVoltar.addEventListener('click', () => {
        window.location.href = '../home/pagina_home.html';
    });

    // Carregar anotações ao selecionar documento
    const observadorDocumento = new MutationObserver(() => {
        carregarAnotacoes();
    });
}

function inicializarPaginaLeitor() {
    // Verificar autenticação
    if (!verificarAutenticacaoLeitor()) {
        return;
    }

    // Inicializar eventos
    inicializarEventosLeitor();

    // Exibir placeholder inicial
    exibirDocumento();
    atualizarControlesNavegacao();
}

// ============================================
// Execução Inicial
// ============================================

document.addEventListener('DOMContentLoaded', inicializarPaginaLeitor);
