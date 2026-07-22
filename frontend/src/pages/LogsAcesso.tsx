import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, User, Activity, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Perfis.css';

interface AccessLogEntry {
  id: number;
  usuario_nome: string;
  usuario_login: string;
  tipo: 'LOGIN' | 'LOGOUT' | 'FALHA' | 'TROCA_SENHA';
  ip_address: string;
  detalhes: string;
  created_at: string;
}

const LogsAcesso: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`${API_URL}/logs-acesso`);
      setLogs(res.data);
      setError(null);
    } catch {
      setError(t('missionaries.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString(i18n.language === 'es' ? 'es-ES' : 'pt-BR');
  };

  const getTipoClass = (tipo: string) => {
    switch (tipo) {
      case 'LOGIN': return 'acao-criar'; // green
      case 'FALHA': return 'acao-remover'; // red
      case 'LOGOUT': return 'acao-default'; // gray
      case 'TROCA_SENHA': return 'acao-editar'; // orange/blue
      default: return 'acao-default';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <ShieldCheck size={24} color="#10b981" />
          <h2>{t('logs.title')}</h2>
        </div>
        <button className="btn-filter" onClick={fetchLogs}>{t('financeiro.actions.refresh')}</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Activity size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">{t('logs.stats.total')}</span>
            <h3 className="stat-value">{logs.length}</h3>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><User size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">{t('logs.stats.success')}</span>
            <h3 className="stat-value">{logs.filter(l => l.tipo === 'LOGIN').length}</h3>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><AlertCircle size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">{t('logs.stats.failure')}</span>
            <h3 className="stat-value">{logs.filter(l => l.tipo === 'FALHA').length}</h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>{t('common.loading')}</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button className="btn-retry" onClick={fetchLogs}>{t('common.retry')}</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('logs.table.datetime')}</th>
                <th>{t('logs.table.user')}</th>
                <th>{t('logs.table.type')}</th>
                <th>{t('logs.table.ip')}</th>
                <th>{t('logs.table.details')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="#888" />
                      {formatDate(log.created_at)}
                    </div>
                  </td>
                  <td>
                    <div className="bold">{log.usuario_nome || 'Desconhecido'}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{log.usuario_login}</div>
                  </td>
                  <td><span className={`status-tag status-${log.tipo.toLowerCase()} ${getTipoClass(log.tipo)}`}>{log.tipo}</span></td>
                  <td style={{ fontFamily: 'monospace', color: '#666' }}>{log.ip_address}</td>
                  <td style={{ fontSize: '13px' }}>{log.detalhes}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>{t('logs.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogsAcesso;
