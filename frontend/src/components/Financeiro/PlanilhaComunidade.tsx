import React, { useState, useEffect } from 'react';
import {
  Save, Loader2,
  Calendar, FileText, Download, TrendingUp, TrendingDown, Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface Categoria {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  perfil: string;
}

interface Item {
  categoria_id: number;
  valor: number;
}

interface EntryLog {
  id: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoriaNome: string;
  valor: number;
  obs: string;
  timestamp: Date;
}

const formatCurrencyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseMaskedCurrency = (masked: string): number => {
  const clean = masked.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const numToDigits = (n: number): string => {
  const cents = Math.round(n * 100);
  return cents > 0 ? cents.toString() : '';
};

interface PlanilhaData {
  id?: number;
  casa_id: number;
  mes_referencia: string;
  status: string;
  total_credito: number;
  total_debito: number;
  num_missas_superior: number;
  anexo_path: string | null;
  apontamentos_economo?: string;
  apontamentos_superior?: string;
  itens: Item[];
}

interface Props {
  casas: { id: number; nome: string }[];
  categorias: Categoria[];
}

const PlanilhaComunidade: React.FC<Props> = ({ casas, categorias }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedMes, setSelectedMes] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCasa, setSelectedCasa] = useState('');
  const [planilha, setPlanilha] = useState<PlanilhaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<number, number>>({});
  const [numMissas, setNumMissas] = useState(0);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Insertion form state
  const [tempReceitaCat, setTempReceitaCat] = useState('');
  const [tempReceitaVal, setTempReceitaVal] = useState('');
  const [tempDespesaCat, setTempDespesaCat] = useState('');
  const [tempDespesaVal, setTempDespesaVal] = useState('');
  const [obsReceita, setObsReceita] = useState('');
  const [obsDespesa, setObsDespesa] = useState('');
  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);

  useEffect(() => {
    if (user?.casa_id && !selectedCasa) {
      setSelectedCasa(user.casa_id.toString());
    }
  }, [user]);

  useEffect(() => {
    if (selectedCasa && selectedMes) {
      loadPlanilha();
    }
  }, [selectedCasa, selectedMes]);

  const loadPlanilha = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/financas-comunidade/${selectedCasa}/${selectedMes}`);
      if (res.data) {
        setPlanilha(res.data);
        const vals: Record<number, number> = {};
        res.data.itens.forEach((it: any) => {
          vals[it.categoria_id] = parseFloat(it.valor);
        });
        setEditValues(vals);
        setNumMissas(res.data.num_missas_superior || 0);
        setAnexoUrl(res.data.anexo_path || null);
      } else {
        setPlanilha(null);
        setEditValues({});
        setNumMissas(0);
        setAnexoUrl(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    let cre = 0;
    let deb = 0;
    categorias.filter(c => c.perfil === 'PERFIL_2').forEach(cat => {
      const val = editValues[cat.id] || 0;
      if (cat.tipo === 'CREDITO') cre += val;
      else deb += val;
    });
    return { credito: cre, debito: deb, saldo: cre - deb };
  };

  const handleAddItem = (tipo: 'CREDITO' | 'DEBITO') => {
    const catId = tipo === 'CREDITO' ? tempReceitaCat : tempDespesaCat;
    const valStr = tipo === 'CREDITO' ? tempReceitaVal : tempDespesaVal;

    if (!catId) { alert('Selecione uma categoria.'); return; }
    const num = parseMaskedCurrency(valStr);
    if (isNaN(num) || num <= 0) { alert('Informe um valor válido.'); return; }

    const id = parseInt(catId);
    const currentVal = editValues[id] || 0;
    setEditValues({
      ...editValues,
      [id]: currentVal + num
    });

    const catNome = categorias.find(c => c.id === id)?.nome || '';
    const obs = tipo === 'CREDITO' ? obsReceita : obsDespesa;
    setEntryLogs(prev => [{ id: `${Date.now()}-${id}`, tipo, categoriaNome: catNome, valor: num, obs, timestamp: new Date() }, ...prev]);

    if (tipo === 'CREDITO') {
       setTempReceitaVal('');
       setObsReceita('');
    } else {
       setTempDespesaVal('');
       setObsDespesa('');
    }
  };

  const handleSave = async () => {
    if (!selectedCasa) return alert('Selecione uma casa.');
    setIsSaving(true);

    let finalAnexoPath = anexoUrl;
    if (anexoFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('arquivo', anexoFile);
      formData.append('descricao', `Recibo Comunidade ${selectedMes}`);
      try {
        const upRes = await api.post(`/usuarios/${user?.id}/documentos`, formData);
        finalAnexoPath = upRes.data.arquivo_path;
      } catch {
        alert('Erro no upload do anexo.');
      } finally {
        setIsUploading(false);
      }
    }

    const totals = calculateTotals();
    const payload = {
      casa_id: parseInt(selectedCasa),
      mes_referencia: selectedMes,
      total_credito: totals.credito,
      total_debito: totals.debito,
      num_missas_superior: numMissas,
      anexo_path: finalAnexoPath,
      status: planilha?.status || 'PENDENTE_ECONOMO',
      itens: Object.entries(editValues).map(([id, val]) => ({
        categoria_id: parseInt(id),
        valor: val
      }))
    };

    try {
      await api.post('/financas-comunidade', payload);
      alert(t('common.save') + '!');
      loadPlanilha();
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const exportToExcel = () => {
    const totals = calculateTotals();
    const casaNome = casas.find(c => String(c.id) === selectedCasa)?.nome || 'Comunidade';

    // Build the sheet data
    const rows: any[] = [];
    rows.push(['PRESTAÇÃO DE CONTAS MENSAL - COMUNIDADE']);
    rows.push([`Casa: ${casaNome}`]);
    rows.push([`Mês: ${selectedMes}`]);
    rows.push([]);

    // Headers
    rows.push(['CÓDIGO', 'RECEITAS', 'VALOR (R$)', '', 'CÓDIGO', 'DESPESAS', 'VALOR (R$)']);

    const receitas = categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2');
    const despesas = categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2');
    const maxLength = Math.max(receitas.length, despesas.length + 2); // +2 for totals/missas

    for (let i = 0; i < maxLength; i++) {
      const rec = receitas[i];
      const dep = despesas[i];
      
      const row = [
        rec ? String(rec.codigo || '') : '',
        rec ? String(rec.nome || '') : '',
        rec ? (editValues[rec.id] || 0) : '',
        '',
        dep ? String(dep.codigo || '') : '',
        dep ? String(dep.nome || '') : '',
        dep ? (editValues[dep.id] || 0) : ''
      ];

      // Add extra rows for totals/missas at the end of despesas column
      if (i === despesas.length) {
        row[4] = '50';
        row[5] = 'SUPERÁVIT / DÉFICIT';
        row[6] = totals.saldo;
      } else if (i === despesas.length + 1) {
        row[4] = '70';
        row[5] = 'MISSAS CELEBRADAS';
        row[6] = numMissas;
      }

      rows.push(row);
    }

    rows.push([]);
    rows.push(['', 'TOTAL RECEITAS:', totals.credito, '', '', 'TOTAL DESPESAS:', totals.debito]);
    rows.push(['', '', '', '', '', 'SALDO:', totals.saldo]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 5 }, { wch: 10 }, { wch: 30 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comunidade');
    XLSX.writeFile(wb, `Comunidade_${casaNome.replace(' ', '_')}_${selectedMes}.xlsx`);
  };

  const totals = calculateTotals();

  return (
    <div className="planilha-mensal-content">
      <div className="filters-card">
        <div className="filters-grid-premium" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="filter-item">
            <label><Calendar size={14} /> {t('planilha.month_year', 'Mês/Ano')}</label>
            <input type="month" value={selectedMes} onChange={e => setSelectedMes(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>{t('planilha.community', 'Comunidade Religiosa')}</label>
            <select value={selectedCasa} onChange={e => setSelectedCasa(e.target.value)}>
              <option value="">{t('planilha.select_house')}</option>
              {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="filter-item">
             <label>{t('planilha.actions', 'Ações')}</label>
             <button className="btn-export-small" onClick={exportToExcel} style={{ width: '100%', height: '40px', justifyContent: 'center' }}>
                <Download size={16} /> {t('financeiro.actions.export')}
             </button>
          </div>
        </div>
      </div>

      <div className="spreedsheet-container card-lite" style={{ padding: '30px', marginTop: '20px' }}>
        <div className="spreedsheet-header" style={{ marginBottom: '30px', borderBottom: '2px solid #013375', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div className="header-info">
               <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#013375', margin: 0 }}>Prestação de Contas MENSAL - Casa Religiosa</h3>
               <div style={{ display: 'flex', gap: '30px', marginTop: '10px', fontSize: '0.95rem' }}>
                 <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>Preenchimento pelo ecônomo ou superior local.</p>
               </div>
           </div>
           <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-save" 
              onClick={handleSave} 
              disabled={isSaving || isUploading}
              style={{ background: '#013375', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Prestação
            </button>
           </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} /></div>
        ) : (
          <>
            <div className="insertion-fields-card" style={{ marginBottom: '20px', padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* RECEITA COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontWeight: 800, color: '#166534', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> Receita
            </span>
            <select
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
              value={tempReceitaCat}
              onChange={e => setTempReceitaCat(e.target.value)}
            >
              <option value="">Selecione a categoria...</option>
              {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2').map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '0 0 120px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                  value={tempReceitaVal}
                  onChange={e => setTempReceitaVal(formatCurrencyMask(e.target.value))}
                />
              </div>
              <input
                type="text"
                placeholder="Observação da receita..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                value={obsReceita}
                onChange={e => setObsReceita(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleAddItem('CREDITO')}
              style={{ width: '100%', padding: '12px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Adicionar Receita
            </button>
          </div>

          {/* DESPESA COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingDown size={14} /> Despesa
            </span>
            <select
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
              value={tempDespesaCat}
              onChange={e => setTempDespesaCat(e.target.value)}
            >
              <option value="">Selecione a categoria...</option>
              {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2').map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '0 0 120px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                  value={tempDespesaVal}
                  onChange={e => setTempDespesaVal(formatCurrencyMask(e.target.value))}
                />
              </div>
              <input
                type="text"
                placeholder="Observação da despesa..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                value={obsDespesa}
                onChange={e => setObsDespesa(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleAddItem('DEBITO')}
              style={{ width: '100%', padding: '12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Adicionar Despesa
            </button>
          </div>
        </div>
      </div>

            <div className="spreadsheet-grid" style={{ display: 'flex', gap: '20px' }}>
              {/* RECEITAS */}
              <div className="spreadsheet-column" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <h4 className="column-title credito" style={{ background: '#dcfce7', color: '#166534', padding: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <TrendingUp size={18} /> {t('planilha.receitas')}
                </h4>
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                      <div style={{ width: '40px' }}>CÓD.</div>
                      <div style={{ flex: 1 }}>DESCRIÇÃO</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>VALOR (R$)</div>
                   </div>
                </div>
                <div style={{ padding: '2px 0' }}>
                  {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2').map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#166534' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="text"
                            placeholder="0,00"
                            value={formatCurrencyMask(numToDigits(editValues[cat.id] || 0))}
                            onChange={e => {
                              const masked = formatCurrencyMask(e.target.value);
                              setEditValues({ ...editValues, [cat.id]: parseMaskedCurrency(masked) });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 700, fontSize: '12px', color: '#0f172a', outline: 'none' }}
                            disabled={planilha?.status === 'VALIDADO'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #bcf0da', color: '#166534' }}>
                   <span>TOTAL RECEITAS</span>
                   <span>R$ {totals.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* DESPESAS */}
              <div className="spreadsheet-column" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <h4 className="column-title debito" style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <TrendingDown size={18} /> {t('planilha.despesas')}
                </h4>
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                      <div style={{ width: '40px' }}>CÓD.</div>
                      <div style={{ flex: 1 }}>DESCRIÇÃO</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>VALOR (R$)</div>
                   </div>
                </div>
                <div style={{ padding: '2px 0' }}>
                  {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2').map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#991b1b' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="text"
                            placeholder="0,00"
                            value={formatCurrencyMask(numToDigits(editValues[cat.id] || 0))}
                            onChange={e => {
                              const masked = formatCurrencyMask(e.target.value);
                              setEditValues({ ...editValues, [cat.id]: parseMaskedCurrency(masked) });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 700, fontSize: '12px', color: '#0f172a', outline: 'none' }}
                            disabled={planilha?.status === 'VALIDADO'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #fecaca', color: '#991b1b' }}>
                   <span>TOTAL DESPESAS</span>
                   <span>R$ {totals.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ padding: '15px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>SUPERÁVIT / DÉFICIT (= 30 - 40)</span>
                    <strong style={{ fontSize: '16px', color: totals.saldo >= 0 ? '#166534' : '#991b1b' }}>
                      R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>Missas celebradas ad mentem Superioris n.º</span>
                    <input
                      type="number"
                      value={numMissas}
                      onChange={e => setNumMissas(parseInt(e.target.value) || 0)}
                      style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, background: '#fff' }}
                    />
                  </div>
                </div>
              </div>
            </div>


            <div className="spreadsheet-summary" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    id="anexo-comunidade"
                    style={{ display: 'none' }}
                    onChange={e => setAnexoFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="anexo-comunidade" className="btn-save" style={{ cursor: 'pointer', background: '#013375', color: 'white', border: 'none', height: '38px', padding: '0 20px', margin: 0 }}>
                    <FileText size={18} /> {anexoFile ? anexoFile.name : (anexoUrl ? t('planilha.replace_files') : t('planilha.attach_files'))}
                  </label>
                  {anexoUrl && (
                    <a href={`${api.defaults.baseURL}${anexoUrl}`} target="_blank" rel="noreferrer" className="btn-icon-view" title="Ver Anexo">
                      <FileText size={20} />
                    </a>
                  )}
                </div>
            </div>

            {/* ═══════════════ DEMONSTRATIVO DETALHADO ═══════════════ */}
            {(() => {
              const receitaMap: Record<string, number> = {};
              const despesaMap: Record<string, number> = {};

              // From grid
              categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2' && (editValues[c.id] || 0) > 0)
                .forEach(c => { receitaMap[c.nome] = (receitaMap[c.nome] || 0) + (editValues[c.id] || 0); });
              categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2' && (editValues[c.id] || 0) > 0)
                .forEach(c => { despesaMap[c.nome] = (despesaMap[c.nome] || 0) + (editValues[c.id] || 0); });

              // From individual logs
              entryLogs.filter(e => e.tipo === 'CREDITO').forEach(e => { receitaMap[e.categoriaNome] = (receitaMap[e.categoriaNome] || 0) + e.valor; });
              entryLogs.filter(e => e.tipo === 'DEBITO').forEach(e => { despesaMap[e.categoriaNome] = (despesaMap[e.categoriaNome] || 0) + e.valor; });

              const totalRec = Object.values(receitaMap).reduce((s, v) => s + v, 0);
              const totalDep = Object.values(despesaMap).reduce((s, v) => s + v, 0);
              const totalSaldo = totalRec - totalDep;
              const hasData = Object.keys(receitaMap).length > 0 || Object.keys(despesaMap).length > 0;

              if (!hasData) return null;
              return (
                <div style={{
                  marginTop: '32px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #c7d2fe',
                  boxShadow: '0 8px 32px -4px rgba(99,102,241,0.12), 0 2px 8px -2px rgba(99,102,241,0.08)',
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
                }}>
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(90deg, #03077fff 0%, #453bf2ff 100%)',
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px' }}>
                        <FileText size={20} color="#fff" />
                      </div>
                      <div>
                        <div style={{ color: '#c7d2fe', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Relatório de Lançamentos</div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>Demonstrativo da Comunidade</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#a5f3c3', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Receitas</div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>R$ {totalRec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#fca5a5', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Despesas</div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>R$ {totalDep.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#c7d2fe', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Saldo</div>
                        <div style={{ color: totalSaldo >= 0 ? '#a5f3c3' : '#fca5a5', fontSize: '18px', fontWeight: 800 }}>R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>

                    {/* ══ SEÇÃO 1 — Itens da Planilha ══ */}
                    {(() => {
                      const planilhaReceitas = categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2' && (editValues[c.id] || 0) > 0);
                      const planilhaDespesas = categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2' && (editValues[c.id] || 0) > 0);
                      const hasPlanilha = planilhaReceitas.length > 0 || planilhaDespesas.length > 0;
                      return (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg,#0369a1,#0ea5e9)', borderRadius: '2px' }} />
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Itens da Planilha ({planilhaReceitas.length + planilhaDespesas.length})
                            </span>
                            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>
                              — valores digitados diretamente nas linhas da grade
                            </span>
                          </div>
                          {hasPlanilha ? (
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #bae6fd' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ background: 'linear-gradient(90deg,#0369a1,#0ea5e9)' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#e0f2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', color: '#e0f2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categoria</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#e0f2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor (R$)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {planilhaReceitas.map((cat, idx) => (
                                    <tr key={`pr-${cat.id}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
                                      <td style={{ padding: '9px 14px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#d1fae5', color: '#065f46' }}>
                                          ▲ Receita
                                        </span>
                                      </td>
                                      <td style={{ padding: '9px 14px', color: '#0c4a6e', fontWeight: 600 }}>{cat.nome}</td>
                                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#065f46' }}>
                                        {(editValues[cat.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                  {planilhaDespesas.map((cat, idx) => (
                                    <tr key={`pd-${cat.id}`} style={{ background: (planilhaReceitas.length + idx) % 2 === 0 ? '#fff' : '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
                                      <td style={{ padding: '9px 14px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>
                                          ▼ Despesa
                                        </span>
                                      </td>
                                      <td style={{ padding: '9px 14px', color: '#0c4a6e', fontWeight: 600 }}>{cat.nome}</td>
                                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#991b1b' }}>
                                        {(editValues[cat.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '12px', fontStyle: 'italic' }}>
                              Nenhum valor preenchido na planilha ainda.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Divisor */}
                    <div style={{ borderTop: '2px dashed #c7d2fe', marginBottom: '24px' }} />

                    {/* ══ SEÇÃO 2 — Lançamentos Individuais ══ */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg,#03077f,#453bf2)', borderRadius: '2px' }} />
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#312e81', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Lançamentos Individuais ({entryLogs.length})
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>
                          — inseridos via campos de Receita / Despesa
                        </span>
                      </div>
                      {entryLogs.length > 0 ? (
                        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #c7d2fe' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ background: 'linear-gradient(90deg,#03077fff,#453bf2ff)' }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#c7d2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#c7d2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categoria</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#c7d2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observação</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#c7d2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data / Hora</th>
                                <th style={{ padding: '10px 14px', textAlign: 'right', color: '#c7d2fe', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor (R$)</th>
                                <th style={{ padding: '10px 10px', textAlign: 'center', color: '#c7d2fe', fontWeight: 700, fontSize: '10px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {entryLogs.map((entry, idx) => (
                                <tr key={entry.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f5f3ff', borderBottom: '1px solid #e0e7ff' }}>
                                  <td style={{ padding: '10px 14px' }}>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                                      background: entry.tipo === 'CREDITO' ? '#d1fae5' : '#fee2e2',
                                      color: entry.tipo === 'CREDITO' ? '#065f46' : '#991b1b',
                                    }}>
                                      {entry.tipo === 'CREDITO' ? '▲ Receita' : '▼ Despesa'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#312e81', fontWeight: 600 }}>{entry.categoriaNome}</td>
                                  <td style={{ padding: '10px 14px', color: '#64748b', fontStyle: entry.obs ? 'normal' : 'italic', maxWidth: '220px', wordBreak: 'break-word' }}>
                                    {entry.obs || <span style={{ color: '#cbd5e1' }}>—</span>}
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <span style={{ display: 'inline-block', background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                      {entry.timestamp.toLocaleDateString('pt-BR')}
                                    </span>
                                    <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, marginLeft: '4px' }}>
                                      {entry.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: entry.tipo === 'CREDITO' ? '#065f46' : '#991b1b' }}>
                                    {entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                                    <button
                                      title="Remover lançamento"
                                      onClick={() => setEntryLogs(prev => prev.filter(e => e.id !== entry.id))}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: '14px', lineHeight: 1, padding: '2px 4px', borderRadius: '4px' }}
                                    >✕</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', background: '#f5f3ff', borderRadius: '10px', border: '1px dashed #c7d2fe', fontSize: '12px', fontStyle: 'italic' }}>
                          Nenhum lançamento individual. Use os campos "Adicionar Receita / Despesa" acima.
                        </div>
                      )}
                    </div>

                    {/* Divisor */}
                    <div style={{ borderTop: '2px dashed #c7d2fe', marginBottom: '24px' }} />

                    {/* ══ Resumo consolidado (planilha + individuais) ══ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ width: '4px', height: '18px', background: 'linear-gradient(180deg,#059669,#dc2626)', borderRadius: '2px' }} />
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumo Consolidado</span>
                      <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>— planilha + lançamentos individuais</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ border: '1px solid #a7f3d0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(90deg,#059669,#10b981)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingUp size={14} color="#fff" />
                          <span style={{ fontWeight: 800, fontSize: '11px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receitas da Casa</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff' }}>
                          <thead>
                            <tr style={{ background: '#ecfdf5' }}>
                              <th style={{ padding: '6px 12px', textAlign: 'left', color: '#065f46', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Categoria</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right', color: '#065f46', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(receitaMap).map(([nome, val]) => (
                              <tr key={nome} style={{ borderBottom: '1px solid #f0fdf4' }}>
                                <td style={{ padding: '7px 12px', color: '#334155' }}>{nome}</td>
                                <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#065f46' }}>R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {Object.keys(receitaMap).length === 0 && (
                              <tr><td colSpan={2} style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Nenhuma receita lançada.</td></tr>
                            )}
                          </tbody>
                          <tfoot style={{ background: '#d1fae5', borderTop: '2px solid #a7f3d0' }}>
                            <tr>
                              <td style={{ padding: '8px 12px', fontWeight: 800, color: '#065f46', fontSize: '11px' }}>TOTAL</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#065f46' }}>R$ {totalRec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <div style={{ border: '1px solid #fecaca', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(90deg,#dc2626,#ef4444)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingDown size={14} color="#fff" />
                          <span style={{ fontWeight: 800, fontSize: '11px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Despesas da Casa</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff' }}>
                          <thead>
                            <tr style={{ background: '#fef2f2' }}>
                              <th style={{ padding: '6px 12px', textAlign: 'left', color: '#991b1b', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Categoria</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right', color: '#991b1b', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(despesaMap).map(([nome, val]) => (
                              <tr key={nome} style={{ borderBottom: '1px solid #fef2f2' }}>
                                <td style={{ padding: '7px 12px', color: '#334155' }}>{nome}</td>
                                <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: '#991b1b' }}>R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {Object.keys(despesaMap).length === 0 && (
                              <tr><td colSpan={2} style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Nenhuma despesa lançada.</td></tr>
                            )}
                          </tbody>
                          <tfoot style={{ background: '#fee2e2', borderTop: '2px solid #fecaca' }}>
                            <tr>
                              <td style={{ padding: '8px 12px', fontWeight: 800, color: '#991b1b', fontSize: '11px' }}>TOTAL</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#991b1b' }}>R$ {totalDep.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanilhaComunidade;
