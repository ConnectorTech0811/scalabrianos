/**
 * Helper para validação e formatação do CNPJ Alfanumérico (padrão Receita Federal a partir de 2026)
 * e do CNPJ Numérico Tradicional.
 * 
 * Regra do CNPJ Alfanumérico (Receita Federal):
 * - Formato: XX.XXX.XXX/XXXX-XX (14 caracteres alfanuméricos sem pontuação).
 * - Posições 1 a 12 (índices 0 a 11): Podem conter números (0-9) ou letras maiúsculas (A-Z).
 * - Posições 13 e 14 (índices 12 e 13): Dígitos Verificadores (DV) estritamente numéricos (0-9).
 * - Algoritmo Módulo 11 com tabela ASCII menos 48:
 *   - '0'..'9' -> 0..9 (valor = ASCII - 48)
 *   - 'A'..'Z' -> 17..42 (valor = ASCII - 48, ex: 'A'=65-48=17, 'Z'=90-48=42)
 */

const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Remove pontuações mantendo apenas caracteres alfanuméricos e convertendo para maiúsculas.
 * @param {string} cnpj 
 * @returns {string}
 */
function cleanCNPJ(cnpj) {
  if (!cnpj) return '';
  return String(cnpj).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Retorna o valor numérico equivalente para cálculo do Módulo 11 (ASCII - 48).
 * @param {string} char 
 * @returns {number}
 */
function getCharVal(char) {
  const code = char.charCodeAt(0);
  return code - 48; // '0'->0..9, 'A'->17.. 'Z'->42
}

/**
 * Valida se um CNPJ é válido (Numérico Tradicional ou Novo Alfanumérico).
 * @param {string} cnpj 
 * @returns {boolean}
 */
function validateCNPJ(cnpj) {
  const cleaned = cleanCNPJ(cnpj);

  // Deve ter exatamente 14 caracteres alfanuméricos
  if (cleaned.length !== 14) return false;

  // Sequências com todos os caracteres iguais são inválidas (ex: 00000000000000 ou AAAAAAAAAAAAAA)
  if (/^([A-Z0-9])\1{13}$/.test(cleaned)) return false;

  // Posições 1 a 12 devem ser alfanuméricas (A-Z ou 0-9)
  if (!/^[A-Z0-9]{12}/.test(cleaned)) return false;

  // DVs (posições 13 e 14) devem ser estritamente numéricos (0-9)
  if (!/[0-9]{2}$/.test(cleaned)) return false;

  // 1º Dígito Verificador (DV1)
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += getCharVal(cleaned[i]) * WEIGHTS_DV1[i];
  }
  const rem1 = sum1 % 11;
  const expectedDV1 = rem1 < 2 ? 0 : 11 - rem1;
  const actualDV1 = parseInt(cleaned[12], 10);

  if (expectedDV1 !== actualDV1) return false;

  // 2º Dígito Verificador (DV2)
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += getCharVal(cleaned[i]) * WEIGHTS_DV2[i];
  }
  const rem2 = sum2 % 11;
  const expectedDV2 = rem2 < 2 ? 0 : 11 - rem2;
  const actualDV2 = parseInt(cleaned[13], 10);

  return expectedDV2 === actualDV2;
}

/**
 * Formata um CNPJ para a máscara XX.XXX.XXX/XXXX-XX (aceita números e letras).
 * @param {string} cnpj 
 * @returns {string}
 */
function formatCNPJ(cnpj) {
  const cleaned = cleanCNPJ(cnpj).slice(0, 14);
  if (!cleaned) return '';

  let res = cleaned.slice(0, 2);
  if (cleaned.length > 2) res += '.' + cleaned.slice(2, 5);
  if (cleaned.length > 5) res += '.' + cleaned.slice(5, 8);
  if (cleaned.length > 8) res += '/' + cleaned.slice(8, 12);
  if (cleaned.length > 12) res += '-' + cleaned.slice(12, 14);

  return res;
}

module.exports = {
  cleanCNPJ,
  validateCNPJ,
  formatCNPJ,
  getCharVal
};
