import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import PlanilhaMensal from './PlanilhaMensal';
import '../../styles/Relatorios.css';

interface Categoria {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
  perfil: 'PERFIL_1' | 'PERFIL_2' | 'ANUAL' | 'PLANEJAMENTO';
}

interface ValidationItem {
  id: number;
  usuario_id: number;
  nome_missionario: string;
  mes_referencia: string;
  status: string;
  updated_at: string;
}

interface Props {
  casas: { id: number; nome: string }[];
  categorias: Categoria[];
  tipo: 'pendentes' | 'historico';
}

const ValidacoesOconomo: React.FC<Props> = ({ casas, categorias, tipo }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanilha, setSelectedPlanilha] = useState<ValidationItem | null>(null);

  // We need the economo's current house.
  const [casaId, setCasaId] = useState<number | null>(user?.casa_id || null);

  useEffect(() => {
    if (!casaId && user?.casa_id) {
      setCasaId(user.casa_id);
    }
  }, [user]);

  const fetchItems = async () => {
    if (!casaId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = tipo === 'pendentes' 
        ? `/financas-mensais/pendentes/casa/${casaId}` 
        : `/financas-mensais/historico/casa/${casaId}`;
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching validations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // Reset selected when tab changes
    setSelectedPlanilha(null);
  }, [tipo, casaId]);

  if (selectedPlanilha) {
    return (
      <div className="validation-review-container">
        <button 
          onClick={() => setSelectedPlanilha(null)}
          style={{ background: 'transparent', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', fontWeight: 600 }}
        >
          <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
          Voltar para a lista
        </button>
        <PlanilhaMensal 
          casas={casas} 
          categorias={categorias} 
          externalUsuarioId={selectedPlanilha.usuario_id}
          externalMes={selectedPlanilha.mes_referencia}
          onValidationComplete={() => {
            setSelectedPlanilha(null);
            fetchItems();
          }}
        />
      </div>
    );
  }

  return (
    <div className="validacoes-container">
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Carregando dados...</div>
      ) : items.length === 0 ? (
        <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
          {tipo === 'pendentes' ? <Clock size={40} color="#94a3b8" /> : <FileText size={40} color="#94a3b8" />}
          <h3 style={{ marginTop: '16px', color: '#475569' }}>
            {tipo === 'pendentes' ? 'Nenhuma planilha pendente de validação' : 'Nenhum histórico encontrado'}
          </h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> {item.mes_referencia}
                </span>
                {item.status === 'PENDENTE' && <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Aguardando</span>}
                {item.status === 'VALIDADO' && <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Aprovado</span>}
                {item.status === 'DEVOLVIDO' && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Devolvido</span>}
              </div>
              
              <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{item.nome_missionario}</h4>
              
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Enviado em: {new Date(item.updated_at).toLocaleString('pt-BR')}
              </div>

              <button 
                onClick={() => setSelectedPlanilha(item)}
                style={{ 
                  marginTop: '10px',
                  background: '#013375',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Visualizar Planilha
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidacoesOconomo;
