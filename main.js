
import { parseExcelFile } from './services/dataProcessor.js';

// State
let cards = [];
let activeTab = 'upload';
let isGeneratingPDF = false;

// DOM Elements
const uploadSection = document.getElementById('section-upload');
const reviewSection = document.getElementById('section-review');
const previewSection = document.getElementById('section-preview');
const badgesToPrint = document.getElementById('badges-to-print');
const reviewTableBody = document.getElementById('review-table-body');
const exportBtn = document.getElementById('export-pdf-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// Init
function init() {
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('btn-show-upload').addEventListener('click', () => switchTab('upload'));
    document.getElementById('btn-show-review').addEventListener('click', () => switchTab('review'));
    document.getElementById('btn-show-preview').addEventListener('click', () => switchTab('preview'));
    document.getElementById('btn-clear').addEventListener('click', handleClear);
    document.getElementById('btn-preview-from-review').addEventListener('click', () => switchTab('preview'));
    document.getElementById('btn-print-native').addEventListener('click', handleNativePrint);
    exportBtn.addEventListener('click', generatePDF);

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
            cards = parseExcelFile(buffer);
            if (cards.length === 0) throw new Error("Nenhum dado encontrado.");
            switchTab('review');
        } catch (err) {
            alert(err.message || "Erro no processamento.");
        } finally {
            showLoading(false);
        }
    };
    reader.readAsArrayBuffer(file);
}

function updateUI() {
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
    document.getElementById('header-actions').classList.toggle('hidden', cards.length === 0);

    if (activeTab === 'review') renderReviewTable();
    if (activeTab === 'preview') renderPreviewCards();
}

function renderReviewTable() {
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
    badgesToPrint.innerHTML = '';
    cards.forEach((card, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'badge-wrapper';
        wrapper.innerHTML = `
      <div class="sesi-badge-card">
        <div class="badge-lateral"><div class="badge-lateral-text">EDUCAÇÃO</div></div>
        <div class="badge-logo-container">
          <span class="badge-logo-text">SESI</span>
          <div class="badge-logo-line"></div>
          <span class="badge-logo-sub">SÃO PAULO</span>
        </div>
        <div class="badge-content">
          <div style="display: flex; justify-content: flex-end"><span style="font-size: 9px; color: #cbd5e1; font-weight: bold">DOC. IDENTIFICAÇÃO ESCOLAR</span></div>
          <div>
            <span class="badge-label">ALUNO(A)</span>
            <h2 class="badge-name">${card.name || 'NOME DO ESTUDANTE'}</h2>
          </div>
          <div style="display: flex; gap: 35px; margin-top: 5px">
            <div><span class="badge-label">RM</span><span class="badge-info-val">${card.rm || '---'}</span></div>
            <div><span class="badge-label">SÉRIE / TURMA</span><span class="badge-info-val">${card.serie || '---'}</span></div>
            <div><span class="badge-label">Nº</span><span class="badge-info-val">${card.numero || '---'}</span></div>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 5px">
            <div style="display: flex; justify-content: space-between; align-items: flex-end">
              <div><span class="badge-label">E-MAIL INSTITUCIONAL</span><span style="font-size: 13px; font-weight: bold; color: #475569">${card.email || '---'}</span></div>
              <div style="text-align: right">
                <span class="badge-label" style="font-size: 9px">SENHA</span>
                <span style="font-size: 11px; padding: 2px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-weight: bold">${card.senha || '*******'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
        badgesToPrint.appendChild(wrapper);

        // Add page break every 3 cards
        if ((idx + 1) % 3 === 0 && idx !== cards.length - 1) {
            const br = document.createElement('div');
            br.className = 'html2pdf__page-break';
            badgesToPrint.appendChild(br);
        }
    });
}

async function generatePDF() {
    if (cards.length === 0) return;
    showLoading(true, "Gerando seu PDF...");

    // Wait for DOM
    await new Promise(r => setTimeout(r, 500));

    const opt = {
        margin: 0,
        filename: `SESI_Crachas_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], after: '.html2pdf__page-break' }
    };

    try {
        await html2pdf().set(opt).from(badgesToPrint).save();
    } catch (err) {
        console.error(err);
        alert("Erro ao gerar PDF. Tente imprimir pelo navegador.");
    } finally {
        showLoading(false);
    }
}

function handleNativePrint() {
    window.print();
}

function handleClear() {
    if (confirm("Limpar todos os dados?")) {
        cards = [];
        activeTab = 'upload';
        document.getElementById('file-input').value = '';
        updateUI();
    }
}

function showLoading(show, text = "") {
    loadingOverlay.classList.toggle('hidden', !show);
    if (show) document.getElementById('loading-text').innerText = text;
}

document.addEventListener('DOMContentLoaded', init);
