// State
let cards = [];
let activeTab = 'upload';
let isGeneratingPDF = false;

// DOM Elements
let uploadSection, reviewSection, previewSection, badgesToPrint, reviewTableBody, exportBtn, loadingOverlay;

// Init
function init() {
    uploadSection = document.getElementById('section-upload');
    reviewSection = document.getElementById('section-review');
    previewSection = document.getElementById('section-preview');
    badgesToPrint = document.getElementById('badges-to-print');
    reviewTableBody = document.getElementById('review-table-body');
    exportBtn = document.getElementById('export-pdf-btn');
    loadingOverlay = document.getElementById('loading-overlay');

    if (!uploadSection || !exportBtn) {
        console.error("Erro crítico: Elementos do DOM não encontrados.");
        return;
    }

    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('btn-show-upload').addEventListener('click', () => switchTab('upload'));
    document.getElementById('btn-show-review').addEventListener('click', () => switchTab('review'));
    document.getElementById('btn-show-preview').addEventListener('click', () => switchTab('preview'));
    document.getElementById('btn-clear').addEventListener('click', handleClear);
    document.getElementById('btn-preview-from-review').addEventListener('click', () => switchTab('preview'));
    document.getElementById('btn-print-native').addEventListener('click', handleNativePrint);

    exportBtn.addEventListener('click', generatePDF);
    document.getElementById('header-export-btn').addEventListener('click', generatePDF);

    updateUI();
}

function switchTab(tab) {
    if (cards.length === 0 && tab !== 'upload') return;
    activeTab = tab;
    updateUI();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading(true, "Processando Excel...");

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const buffer = e.target.result;
            if (typeof window.parseExcelFile !== 'function') {
                throw new Error("Erro de carregamento: Função de processamento Excel não encontrada.");
            }
            cards = window.parseExcelFile(buffer);
            console.log("Cartões carregados:", cards.length);
            if (cards.length === 0) throw new Error("Nenhum dado encontrado na planilha.");
            switchTab('review');
        } catch (err) {
            alert(err.message || "Erro no processamento.");
        } finally {
            showLoading(false);
        }
    };
    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
        showLoading(false);
    };
    reader.readAsArrayBuffer(file);
}

function updateUI() {
    if (!uploadSection) return;

    // Update Tabs Visibility
    uploadSection.classList.toggle('hidden', activeTab !== 'upload');
    reviewSection.classList.toggle('hidden', activeTab !== 'review');
    previewSection.classList.toggle('hidden', activeTab !== 'preview');

    // Update Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        btn.classList.toggle('active', activeTab === tab);
        if (tab !== 'upload') btn.disabled = cards.length === 0;
    });

    // Update Contextual Buttons
    const headerActions = document.getElementById('header-actions');
    if (headerActions) headerActions.classList.toggle('hidden', cards.length === 0);

    if (activeTab === 'review') renderReviewTable();
    if (activeTab === 'preview') renderPreviewCards();
}

function renderReviewTable() {
    if (!reviewTableBody) return;
    reviewTableBody.innerHTML = '';
    cards.forEach(card => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><input class="cell-edit" value="${card.name}" data-id="${card.id}" data-field="name"></td>
      <td style="font-family: monospace; color: #64748b;">${card.rm}</td>
      <td style="font-weight: bold;">${card.serie}</td>
      <td style="font-size: 0.75rem; color: #94a3b8;">${card.email}</td>
    `;

        // Auto-update state on edit
        tr.querySelector('input').addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const val = e.target.value;
            cards = cards.map(c => c.id === id ? { ...c, name: val } : c);
        });

        reviewTableBody.appendChild(tr);
    });
}

function renderPreviewCards() {
    if (!badgesToPrint) return;
    badgesToPrint.innerHTML = '';
    cards.forEach((card, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'badge-wrapper';
        wrapper.innerHTML = `
      <div class="sesi-badge-card">
        <div class="badge-header">
            <div class="badge-lateral"><div class="badge-lateral-text">EDUCAÇÃO</div></div>
            <div class="badge-logo-container">
                <span class="badge-logo-text">SESI</span>
                <div class="badge-logo-line"></div>
                <span class="badge-logo-sub">SÃO PAULO</span>
            </div>
        </div>
        <div class="badge-content">
          <div style="display: flex; justify-content: flex-end"><span style="font-size: 8px; color: #cbd5e1; font-weight: bold">DOC. IDENTIFICAÇÃO ESCOLAR</span></div>
          <div>
            <span class="badge-label">ALUNO(A)</span>
            <h2 class="badge-name">${card.name || 'NOME DO ESTUDANTE'}</h2>
          </div>
          <div style="display: flex; gap: 30px; margin-top: 3px">
            <div><span class="badge-label">RM</span><span class="badge-info-val">${card.rm || '---'}</span></div>
            <div><span class="badge-label">SÉRIE / TURMA</span><span class="badge-info-val">${card.serie || '---'}</span></div>
            <div><span class="badge-label">Nº</span><span class="badge-info-val">${card.numero || '---'}</span></div>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 3px">
            <div style="display: flex; justify-content: space-between; align-items: flex-end">
              <div><span class="badge-label">E-MAIL INSTITUCIONAL</span><span style="font-size: 11px; font-weight: bold; color: #475569">${card.email || '---'}</span></div>
              <div style="text-align: right">
                <span class="badge-label" style="font-size: 8px">SENHA</span>
                <span style="font-size: 10px; padding: 1px 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-weight: bold">${card.senha || '*******'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
        badgesToPrint.appendChild(wrapper);

        // Add page break every 6 cards (3 rows of 2 columns)
        if ((idx + 1) % 6 === 0 && idx !== cards.length - 1) {
            const br = document.createElement('div');
            br.className = 'html2pdf__page-break';
            badgesToPrint.appendChild(br);
        }
    });
}

async function generatePDF() {
    if (cards.length === 0) return;

    if (typeof window.html2pdf !== 'function') {
        alert("Erro: Biblioteca de geração de PDF não carregada. Por favor, verifique sua internet e recarregue a página.");
        return;
    }

    if (isGeneratingPDF) return;
    isGeneratingPDF = true;

    // Garantir que a aba de preview está visível (OBRIGATÓRIO para html2canvas capturar)
    const originalTab = activeTab;
    switchTab('preview');

    showLoading(true, "Gerando seu PDF Colorido...");

    // Atraso para garantir que o navegador "pintou" os elementos na tela
    await new Promise(r => setTimeout(r, 1200));

    const element = document.getElementById('badges-to-print');

    const opt = {
        margin: 0,
        filename: `SESI_Crachas_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1200 // Largura fixa para estabilizar o layout interno
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], after: '.html2pdf__page-break' }
    };

    try {
        await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("Erro na geração de PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF. Tente imprimir pelo navegador.");
    } finally {
        isGeneratingPDF = false;
        showLoading(false);
        // Opcional: voltar para a aba original se desejar
        // switchTab(originalTab);
    }
}

function handleNativePrint() {
    window.print();
}

function handleClear() {
    if (confirm("Limpar todos os dados?")) {
        cards = [];
        activeTab = 'upload';
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        updateUI();
    }
}

function showLoading(show, text = "") {
    if (!loadingOverlay) return;
    loadingOverlay.classList.toggle('hidden', !show);
    if (show) {
        const loadingTextElem = document.getElementById('loading-text');
        if (loadingTextElem) loadingTextElem.innerText = text;
    }
}

document.addEventListener('DOMContentLoaded', init);
