
import React from 'react';

interface HeaderProps {
  onGeneratePDF?: () => void;
  isGenerating?: boolean;
  hasData?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGeneratePDF, isGenerating, hasData }) => {
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 no-print">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-12 h-10 bg-slate-900 rounded flex items-center justify-center text-white shadow-lg">
            <span className="font-black italic text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BadgeMaster <span className="text-red-600 font-black">SESI</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Gestão de Identidade Escolar</p>
          </div>
        </div>
        <div className="flex gap-4">
          {hasData && (
            <button 
              disabled={isGenerating}
              onClick={onGeneratePDF} 
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 ${
                isGenerating 
                  ? 'bg-slate-400 cursor-not-allowed text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar PDF (A4)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;