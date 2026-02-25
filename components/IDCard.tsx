
import React from 'react';
import { CardData } from '../types';

interface IDCardProps {
  data: CardData;
}

const IDCard: React.FC<IDCardProps> = ({ data }) => {
  // 200mm x 80mm -> 756px x 302px (aprox em 96dpi)
  // Usar pixels é mais seguro para o html2canvas
  return (
    <div 
      className="sesi-badge-card"
      style={{
        width: '756px',
        height: '302px',
        backgroundColor: '#ffffff',
        border: '2px solid #1e293b',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a'
      }}
    >
      {/* Faixa Lateral Vermelha */}
      <div style={{ width: '45px', backgroundColor: '#E30613', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', letterSpacing: '4px' }}>
          EDUCAÇÃO
        </div>
      </div>

      {/* Logo SESI */}
      <div style={{ width: '220px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRight: '2px solid #1e293b', flexShrink: 0 }}>
        <span style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', color: '#0f172a' }}>SESI</span>
        <div style={{ height: '5px', width: '130px', backgroundColor: '#E30613', marginTop: '2px' }}></div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginTop: '10px', letterSpacing: '1px' }}>SÃO PAULO</span>
      </div>

      {/* Área de Dados */}
      <div style={{ flex: 1, padding: '20px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#cbd5e1' }}>DOC. IDENTIFICAÇÃO ESCOLAR</span>
        </div>

        <div>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>ALUNO(A)</span>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '2px 0 0 0', textTransform: 'uppercase', lineHeight: '1.1' }}>
            {data.name || 'NOME DO ESTUDANTE'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '35px', marginTop: '5px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>RM</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{data.rm || '---'}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>SÉRIE / TURMA</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>{data.serie || '---'}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>Nº</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{data.numero || '---'}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>E-MAIL INSTITUCIONAL</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>{data.email || '---'}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', display: 'block' }}>SENHA</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: 'bold' }}>
                {data.senha || '*******'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDCard;
