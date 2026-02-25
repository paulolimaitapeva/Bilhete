
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import IDCard from './components/IDCard';
import { CardData } from './types';
import { parseExcelFile } from './services/dataProcessor';

declare var html2pdf: any;

const App: React.FC = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parsedData = parseExcelFile(buffer);
        if (parsedData.length === 0) throw new Error("Nenhum dado encontrado.");
        setCards(parsedData);
        setActiveTab('review');
      } catch (err: any) {
        setError(err.message || "Erro no processamento.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generatePDF = async () => {
    if (cards.length === 0) return;
    setIsGeneratingPDF(true);
    setActiveTab('preview');
    
    // Pequena pausa para garantir que o DOM está pronto
    await new Promise(r => setTimeout(r, 1000));
    
    const element = document.getElementById('badges-to-print');
    if (!element) {
      alert("Erro ao localizar área de impressão.");
      setIsGeneratingPDF(false);
      return;
    }

    const opt = {
      margin: [10, 5, 10, 5],
      filename: `SESI_Crachas_${Date.now()}.pdf`,
      image: { type: 'png' }, // PNG é mais estável
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], after: '.html2pdf__page-break' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("Falha no download automático. Use o botão 'Imprimir no Navegador'.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleNativePrint = () => {
    setActiveTab('preview');
    // Timeout para garantir que o React mudou a aba antes de abrir o diálogo de impressão
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const updateCardField = (id: string, field: keyof CardData, value: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleClear = () => {
    if (confirm("Limpar todos os dados carregados?")) {
      setCards([]);
      setError(null);
      setActiveTab('upload');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans">
      <Header onGeneratePDF={generatePDF} isGenerating={isGeneratingPDF} hasData={cards.length > 0} />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        
        <div className="no-print flex border-b border-slate-300 mb-8 gap-8">
          <button onClick={() => setActiveTab('upload')} className={`pb-4 px-2 font-bold text-xs uppercase ${activeTab === 'upload' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-400'}`}>1. Importar</button>
          <button onClick={() => setActiveTab('review')} disabled={!cards.length} className={`pb-4 px-2 font-bold text-xs uppercase ${activeTab === 'review' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-400'}`}>2. Revisar ({cards.length})</button>
          <button onClick={() => setActiveTab('preview')} disabled={!cards.length} className={`pb-4 px-2 font-bold text-xs uppercase ${activeTab === 'preview' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-400'}`}>3. Visualizar</button>
        </div>

        {activeTab === 'upload' && (
          <div className="bg-white p-20 rounded-3xl shadow-sm text-center border border-slate-200 no-print">
            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase italic">Gerador de Crachás SESI</h2>
            <p className="text-slate-500 mb-10">Carregue sua planilha Excel para gerar identificações profissionais.</p>
            <label className="inline-flex items-center gap-4 bg-slate-900 hover:bg-black text-white font-bold py-5 px-14 rounded-2xl cursor-pointer shadow-xl transition-all active:scale-95">
              SELECIONAR EXCEL (.XLSX)
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
            </label>
            {error && <div className="mt-8 text-red-600 font-bold bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}
          </div>
        )}

        {activeTab === 'review' && cards.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden no-print">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Conferência de Dados</h2>
              <div className="flex gap-4">
                <button onClick={handleClear} className="text-slate-400 hover:text-red-600 font-bold text-xs uppercase">Limpar</button>
                <button onClick={() => setActiveTab('preview')} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors">Visualizar Crachás</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-500">
                  <tr>
                    <th className="p-4">Nome Completo</th>
                    <th className="p-4">RM</th>
                    <th className="p-4">Série</th>
                    <th className="p-4">E-mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cards.map(card => (
                    <tr key={card.id}>
                      <td className="p-4"><input className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold" value={card.name} onChange={e => updateCardField(card.id, 'name', e.target.value)} /></td>
                      <td className="p-4 font-mono text-slate-500">{card.rm}</td>
                      <td className="p-4 font-bold uppercase">{card.serie}</td>
                      <td className="p-4 text-xs text-slate-400">{card.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'preview' && cards.length > 0 && (
          <div>
            <div className="no-print flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Prévia de Impressão</h2>
                <p className="text-slate-500">Confira o layout antes de gerar o documento final.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handleNativePrint} className="px-6 py-4 border-2 border-slate-900 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  IMPRIMIR NO NAVEGADOR
                </button>
                <button disabled={isGeneratingPDF} onClick={generatePDF} className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2">
                  {isGeneratingPDF ? 'GERANDO...' : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      BAIXAR PDF
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div id="badges-to-print" className="bg-white flex flex-col items-center">
              {cards.map((card, idx) => (
                <div key={card.id} className="badge-wrapper py-6 w-full flex justify-center bg-white">
                  <IDCard data={card} />
                </div>
              ))}
            </div>
          </div>
        )}

        {(isLoading || isGeneratingPDF) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center no-print">
            <div className="bg-white p-12 rounded-[2rem] shadow-2xl text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="font-black text-xl text-slate-900 uppercase italic">
                {isLoading ? "Processando Excel..." : "Gerando seu PDF..."}
              </p>
              <p className="text-slate-400 text-xs mt-2 font-bold tracking-widest uppercase">Isso pode levar alguns segundos</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
