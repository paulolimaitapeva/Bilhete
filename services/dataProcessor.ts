
import * as XLSX from 'xlsx';
import { CardData } from '../types';

/**
 * Converte data serial do Excel para string formatada DD/MM/YYYY.
 * Lida com o erro clássico de datas que aparecem como números decimais.
 */
const formatExcelDate = (value: any): string => {
  if (value === undefined || value === null || value === '') return '';
  
  // Se for um objeto Date nativo do JS (xlsx pode retornar isso se cellDates: true)
  if (value instanceof Date) {
    const day = String(value.getUTCDate()).padStart(2, '0');
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const year = value.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  // Se for um número (Data serial do Excel, ex: 45293.0)
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && typeof value !== 'string') {
    // Excel baseia-se em 30/12/1899 para o cálculo serial
    const date = new Date(Math.round((numValue - 25569) * 86400 * 1000));
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    // Verifica se a data é válida
    if (isNaN(date.getTime())) return String(value);
    return `${day}/${month}/${year}`;
  }
  
  // Se for uma string que parece um número serial (ex: "45293")
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
    const n = parseFloat(value);
    const date = new Date(Math.round((n - 25569) * 86400 * 1000));
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    if (!isNaN(date.getTime())) return `${day}/${month}/${year}`;
  }
  
  return String(value).trim();
};

/**
 * Normaliza textos em Português Brasil (Proper Case para nomes)
 */
const normalizePTBR = (text: any): string => {
  if (text === undefined || text === null) return '';
  let cleanText = String(text)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return '';

  const exceptions = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];
  const acronyms = ['cpf', 'rg', 'rm', 'id', 'sesi', 'sp', 'ra'];

  return cleanText
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (acronyms.includes(word)) return word.toUpperCase();
      if (index > 0 && exceptions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const parseExcelFile = (buffer: ArrayBuffer): CardData[] => {
  const workbook = XLSX.read(buffer, { 
    type: 'array',
    cellDates: false, // Tratamos manualmente para maior controle sobre os decimais
    cellNF: true,
    cellText: false 
  });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Converte para JSON bruto para processarmos cada célula
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
  if (!jsonData || jsonData.length === 0) return [];

  return jsonData.map((row: any, index: number) => {
    // Helper para buscar valores ignorando maiúsculas/minúsculas e acentos nos cabeçalhos
    const getVal = (possibleKeys: string[]) => {
      const foundKey = Object.keys(row).find(k => {
        const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return possibleKeys.some(pk => normalizedKey === pk || normalizedKey.includes(pk));
      });
      return foundKey ? row[foundKey] : "";
    };

    const name = getVal(['nome', 'name', 'aluno', 'estudante']);
    const rm = getVal(['rm', 'registro', 'ra', 'matricula', 'id']);
    const numero = getVal(['numero', 'num', 'chamada', 'n']);
    const nascimento = getVal(['nascimento', 'data', 'nasc', 'datanasc']);
    const serie = getVal(['serie', 'ano', 'turma', 'grade', 'classe']);
    const cpf = getVal(['cpf']);
    const email = getVal(['email', 'e-mail', 'correio']);
    const senha = getVal(['senha', 'password', 'pass']);

    return {
      id: row.id || `row-${index}-${Date.now()}`,
      name: normalizePTBR(name),
      rm: String(rm).toUpperCase().trim(),
      numero: String(numero).toUpperCase().trim(),
      nascimento: formatExcelDate(nascimento),
      serie: String(serie).toUpperCase().trim(),
      cpf: String(cpf).trim(),
      email: String(email).trim().toLowerCase(),
      senha: String(senha).trim(),
    };
  }).filter(card => card.name || card.rm);
};
