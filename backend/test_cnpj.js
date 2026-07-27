const { validateCNPJ, formatCNPJ } = require('./cnpjHelper');

const testCases = [
  { cnpj: '19.JA2.KO8/Z001-51', expected: true, desc: 'Novo CNPJ Alfanumérico da Receita Federal' },
  { cnpj: '19JA2KO8Z00151', expected: true, desc: 'CNPJ Alfanumérico sem pontuação' },
  { cnpj: '00.000.000/0001-91', expected: true, desc: 'CNPJ Numérico Tradicional (Banco do Brasil)' },
  { cnpj: '19.JA2.KO8/Z001-52', expected: false, desc: 'CNPJ Alfanumérico com DV incorreto' },
  { cnpj: '00.000.000/0001-00', expected: false, desc: 'CNPJ Numérico com DV incorreto' },
  { cnpj: '11.111.111/1111-11', expected: false, desc: 'CNPJ com todos os caracteres iguais' },
];

console.log('--- TESTANDO VALIDAÇÃO DE CNPJ ALFANUMÉRICO E NUMÉRICO ---');
let allPassed = true;

testCases.forEach(({ cnpj, expected, desc }) => {
  const isValid = validateCNPJ(cnpj);
  const formatted = formatCNPJ(cnpj);
  const passed = isValid === expected;
  if (!passed) allPassed = false;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${desc}: ${cnpj} -> Formatted: ${formatted} | Result: ${isValid} (Expected: ${expected})`);
});

if (allPassed) {
  console.log('\nSUCCESS: Todos os testes do CNPJ Alfanumérico e Numérico passaram!');
} else {
  console.error('\nERROR: Alguns testes falharam.');
  process.exit(1);
}
