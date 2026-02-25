
import { CSVRow, CardData } from '../types';

/**
 * Normaliza textos em Português Brasil (Proper Case)
 * Remove artefatos de codificação e garante acentuação correta.
 */
const normalizePTBR = (text: string): string => {
  if (!text) return '';
  
  // 1. Limpeza profunda: Remove BOM (\uFEFF), caracteres de controle e espaços duplicados
  let cleanText = text
    .replace(/^\uFEFF/, "") 
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const exceptions = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];
  const acronyms = ['cpf', 'rg', 'rm', 'id', 'sesi', 'sp'];

  return cleanText
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (acronyms.includes(word)) return word.toUpperCase();
      if (index > 0 && exceptions.includes(word)) return word;
      // Capitaliza preservando acentos brasileiros (ex: Á, É, Í...)
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const parseCSV = (text: string): CardData[] => {
  // Garante remoção de BOM no início do arquivo completo antes do split
  const sanitizedText = text.replace(/^\uFEFF/, "");
  const lines = sanitizedText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Limpa cabeçalhos para evitar que o BOM quebre a detecção da primeira coluna
  const headers = lines[0]
    .split(delimiter)
    .map(h => h.trim().toLowerCase().replace(/^\uFEFF/, "").replace(/["']/g, ''));

  const results: CardData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/["']/g, ''));
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      if (header) row[header] = values[index] || '';
    });

    const name = row.name || row.nome || row['nome completo'] || '';
    const rm = row.rm || row.registro || '';
    const numero = row.numero || row.num || row['nº'] || '';
    const nascimento = row.nascimento || row.nasc || row['data de nascimento'] || '';
    const serie = row.serie || row.ano || row.turma || '';
    const cpf = row.cpf || '';
    const email = row.email || row['e-mail'] || '';
    const senha = row.senha || row.password || '';

    if (name || rm) { 
      results.push({
        id: row.id || `idx-${i}`,
        name: normalizePTBR(name),
        rm: rm.toUpperCase(),
        numero: numero.toUpperCase(),
        nascimento: nascimento,
        serie: normalizePTBR(serie),
        cpf: cpf,
        email: email.trim().toLowerCase(),
        senha: senha,
        ...row 
      });
    }
  }

  return results;
};
