import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FileText, Calendar, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import '../styles/FinanceiroSpreadsheet.css';

interface ExtratoMes {
  id: number;
  mes_referencia: string;
  total_credito: number;
  total_debito: number;
  saldo: number;
  data_validacao: string;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  perfil: string;
}

interface DetalhesPlanilha {
  id: number;
  mes_referencia: string;
  itens: {
    categoria_id: number;
    valor: number;
  }[];
}

const ExtratosMensais: React.FC = () => {
  const { user } = useAuth();
  const [extratos, setExtratos] = useState<ExtratoMes[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [selectedExtrato, setSelectedExtrato] = useState<ExtratoMes | null>(null);
  const [detalhes, setDetalhes] = useState<DetalhesPlanilha | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [extratosRes, catRes] = await Promise.all([
        api.get(`/financas-mensais/usuario/${user?.id}/extratos`),
        api.get('/categorias-financas')
      ]);
      setExtratos(extratosRes.data || []);
      setCategorias(catRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = async (extrato: ExtratoMes) => {
    setSelectedExtrato(extrato);
    setIsModalLoading(true);
    setDetalhes(null);
    try {
      const res = await api.get(`/financas-mensais/usuario/${user?.id}/mes/${extrato.mes_referencia}`);
      setDetalhes(res.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes', err);
      alert('Erro ao carregar detalhes.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const getCategoriaNome = (id: number) => {
    return categorias.find(c => c.id === id)?.nome || 'Categoria Desconhecida';
  };

  // Pagination Logic
  const totalPages = Math.ceil(extratos.length / itemsPerPage);
  const paginatedExtratos = extratos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px' }}>
        <span style={{ color: '#64748b', fontSize: '16px' }}>Carregando extratos...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
          <FileText size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Extratos Mensais</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Histórico consolidado das suas prestações de contas validadas.
          </p>
        </div>
      </div>

      {extratos.length === 0 ? (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <Calendar size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#475569', margin: '0 0 8px 0' }}>Nenhum extrato validado</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Você ainda não possui planilhas validadas para visualização do extrato.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600, fontSize: '14px' }}>Mês Referência</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600, fontSize: '14px' }}>Data Validação</th>
                  <th style={{ padding: '16px 20px', color: '#059669', fontWeight: 600, fontSize: '14px' }}>Receitas</th>
                  <th style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600, fontSize: '14px' }}>Despesas</th>
                  <th style={{ padding: '16px 20px', color: '#0f172a', fontWeight: 600, fontSize: '14px' }}>Saldo</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: '14px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExtratos.map(ext => (
                  <tr key={ext.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#64748b" />
                        {ext.mes_referencia}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>
                      {ext.data_validacao ? new Date(ext.data_validacao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#059669', fontWeight: 600 }}>
                      R$ {Number(ext.total_credito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600 }}>
                      R$ {Number(ext.total_debito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px', color: Number(ext.saldo) >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                      R$ {Number(ext.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleOpenDetails(ext)}
                        style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', transition: 'background 0.2s' }}
                      >
                        <Eye size={16} /> Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Página {currentPage} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ background: currentPage === 1 ? '#e2e8f0' : 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ background: currentPage === totalPages ? '#e2e8f0' : 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detalhes Modal */}
      {selectedExtrato && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedExtrato(null); }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="#4f46e5" />
                  Detalhes do Extrato
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px', textTransform: 'capitalize' }}>{selectedExtrato.mes_referencia}</p>
              </div>
              <button onClick={() => setSelectedExtrato(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {isModalLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Carregando detalhes...</div>
              ) : detalhes && detalhes.itens && detalhes.itens.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Receitas */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '2px solid #d1fae5' }}>
                      <TrendingUp size={18} /> Receitas Detalhadas
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detalhes.itens.filter(i => categorias.find(c => c.id === i.categoria_id)?.tipo === 'CREDITO').length > 0 ? (
                        detalhes.itens.filter(i => categorias.find(c => c.id === i.categoria_id)?.tipo === 'CREDITO').map(item => (
                          <div key={item.categoria_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                            <span style={{ color: '#475569' }}>{getCategoriaNome(item.categoria_id)}</span>
                            <span style={{ fontWeight: 600, color: '#059669' }}>R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>Nenhuma receita registrada.</span>
                      )}
                    </div>
                  </div>

                  {/* Despesas */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '2px solid #fee2e2' }}>
                      <TrendingDown size={18} /> Despesas Detalhadas
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detalhes.itens.filter(i => categorias.find(c => c.id === i.categoria_id)?.tipo === 'DEBITO').length > 0 ? (
                        detalhes.itens.filter(i => categorias.find(c => c.id === i.categoria_id)?.tipo === 'DEBITO').map(item => (
                          <div key={item.categoria_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                            <span style={{ color: '#475569' }}>{getCategoriaNome(item.categoria_id)}</span>
                            <span style={{ fontWeight: 600, color: '#dc2626' }}>R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>Nenhuma despesa registrada.</span>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Nenhum detalhe encontrado para este mês.</div>
              )}
            </div>
            
            <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button onClick={() => setSelectedExtrato(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtratosMensais;
