import React, { useState, useEffect } from 'react';
import { Search, Filter, Lock, Eye, EyeOff, Trash2, X, Save, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, type UserRole } from '../context/AuthContext';
import api from '../api';
import '../styles/Perfis.css';

interface AdminProfile {
  id: number;
  nome: string;
  login: string;
  password?: string;
  role: UserRole;
  status: 'ATIVO' | 'INATIVO';
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
  permissoes?: Record<string, boolean>;
}

const PERMISSIONS_LIST = [
  { id: 'dados_civis', label: '1. Dados Civis (visualização)' },
  { id: 'contatos', label: '2. Contatos (visualização)' },
  { id: 'dados_religiosos', label: '3. Dados Religiosos (visualização)' },
  { id: 'itinerario_formativo', label: '4. Itinerário Formativo (Visualização)' },
  { id: 'formacao_academica', label: '5. Formação Acadêmica (Visualização)' },
  { id: 'atividade_missionaria', label: '6. Atividade Missionária (Visualização)' },
  { id: 'saude', label: '7. Saúde (Visualização)' },
  { id: 'previdenciario_ir', label: '8. Previdenciário/IR (Visualização)' },
  { id: 'conta_bancaria', label: '9. Conta Bancária (Visualização)' },
  { id: 'documentos', label: '10. Documentos (Visualização)' },
  { id: 'obras_realizadas', label: '11. Obras realizadas (Visualização)' },
  { id: 'observacoes', label: '12. Observações (Visualização)' },
  { id: 'quadro_pessoal', label: '13. Quadro de Pessoal CV (Visualização)' },
];

const ADMIN_ROLES: UserRole[] = ['ADMIN_GERAL', 'COLABORADOR', 'INTERMITENTE', 'PADRE', 'REGISTRO_REGIONAL'];

const Administradores: React.FC = () => {
  const { t } = useTranslation();
  const { canEdit } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/usuarios/get');
      const adminOnly = response.data.filter((u: AdminProfile) => ADMIN_ROLES.includes(u.role));
      setProfiles(adminOnly);
      setError(null);
    } catch (err: any) {
      setError(t('missionaries.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editingProfile) {
      setEditingProfile({ ...editingProfile, password: pass });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_GERAL': return t('admins.roles.admin_geral');
      case 'COLABORADOR': return t('admins.roles.colaborador');
      case 'INTERMITENTE': return t('admins.roles.intermitente');
      case 'PADRE': return 'Missionário';
      case 'REGISTRO_REGIONAL': return 'Registro Regional';
      default: return role;
    }
  };

  const handleOpenEdit = (profile: AdminProfile) => {
    let perms = profile.permissoes || {};
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = {};
      }
    }
    setEditingProfile({ ...profile, permissoes: perms });
    setIsModalOpen(true);
  };

  const handleNewProfile = () => {
    setEditingProfile({
      id: 0,
      nome: '',
      login: '',
      password: '',
      role: 'COLABORADOR',
      status: 'ATIVO',
      situacao: 'ATIVO',
      permissoes: {}
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    if (!editingProfile) return;
    const currentPerms = { ...editingProfile.permissoes };
    currentPerms[permId] = !currentPerms[permId];
    setEditingProfile({ ...editingProfile, permissoes: currentPerms });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSaveLoading(true);
    try {
      if (editingProfile.id === 0) {
        await api.post('/usuarios', editingProfile);
      } else {
        await api.put(`/usuarios/${editingProfile.id}`, editingProfile);
      }
      await fetchProfiles();
      setIsModalOpen(false);
    } catch {
      alert(t('common.error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProfile = async (profile: AdminProfile) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${profile.nome} (${profile.login})? Isso apagará todas as informações associadas.`)) {
      return;
    }

    try {
      await api.post(`/usuarios/${profile.id}/delete`);
      await fetchProfiles();
    } catch {
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const filtered = profiles.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? p.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <Lock size={24} />
          <h2>{t('admins.title')}</h2>
        </div>
        {canEdit && (
          <button className="btn-new" onClick={handleNewProfile}>{t('admins.new_btn')}</button>
        )}
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>{t('admins.filters.search')}</label>
          <div className="search-input">
            <input type="text" placeholder={t('common.loading').replace('...', '') + "..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>{t('admins.filters.role')}</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">{t('missionaries.filters.all')}</option>
            <option value="ADMIN_GERAL">{t('admins.roles.admin_geral')}</option>

            <option value="COLABORADOR">{t('admins.roles.colaborador')}</option>
            <option value="INTERMITENTE">{t('admins.roles.intermitente')}</option>
            <option value="PADRE">Missionário</option>
            <option value="REGISTRO_REGIONAL">Registro Regional</option>
          </select>
        </div>
        <button className="btn-filter"><Filter size={18} /> {t('missionaries.filters.filter_btn')}</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>{t('common.loading')}</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button onClick={fetchProfiles} className="btn-retry">{t('common.retry')}</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>{t('missionaries.table.id')}</th>
                <th>{t('missionaries.table.name')}</th>
                <th>{t('missionaries.table.login')}</th>
                <th className="center">{t('admins.filters.role')}</th>
                <th className="center">{t('missionaries.table.status')}</th>
                <th>{t('missionaries.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(profile => (
                <tr key={profile.id}>
                  <td>#{profile.id}</td>
                  <td className="bold">{profile.nome}</td>
                  <td>{profile.login}</td>
                  <td className="center"><span className={`role-tag ${profile.role.toLowerCase()}`}>{getRoleLabel(profile.role)}</span></td>
                  <td className="center"><span className={`status-tag ${profile.status.toLowerCase()}`}>{profile.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon-view" onClick={() => handleOpenEdit(profile)}><Eye size={18} /></button>
                      {canEdit && (
                        <button className="btn-icon-delete" type="button" onClick={() => handleDeleteProfile(profile)}><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && editingProfile && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header" style={{ padding: '25px 35px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#013375', color: 'white', padding: '8px', borderRadius: '10px' }}>
                  <ShieldCheck size={20} />
                </div>
                <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                  {editingProfile.id === 0 ? 'Novo Registro' : `Editar ${getRoleLabel(editingProfile.role)}`}
                </h3>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ padding: '35px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>

                {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
                <div className="form-column">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#013375', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '20px', borderLeft: '4px solid #013375', paddingLeft: '12px' }}>
                        Dados de Acesso
                      </h4>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>{t('missionaries.wizard.civil.full_name')}</label>
                      <input
                        type="text"
                        value={editingProfile.nome}
                        onChange={e => setEditingProfile({ ...editingProfile, nome: e.target.value })}
                        required
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        placeholder="Ex: João Silva"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>{t('missionaries.wizard.access.email')}</label>
                      <input
                        type="email"
                        value={editingProfile.login}
                        onChange={e => setEditingProfile({ ...editingProfile, login: e.target.value })}
                        required
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.95rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>
                        {editingProfile.id === 0 ? t('missionaries.wizard.access.password') : 'Redefinir Senha'}
                      </label>
                      <div className="password-group" style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={editingProfile.password || ''}
                            onChange={e => setEditingProfile({ ...editingProfile, password: e.target.value })}
                            required={editingProfile.id === 0}
                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.95rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <button type="button" onClick={generateRandomPassword} style={{ background: '#f1f5f9', color: '#013375', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 18px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                          Gerar
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'block', fontSize: '0.85rem' }}>Perfil de Acesso</label>
                        <select value={editingProfile.role} onChange={e => setEditingProfile({ ...editingProfile, role: e.target.value as UserRole })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.9rem', cursor: 'pointer', background: 'white' }}>
                          <option value="ADMIN_GERAL">{t('admins.roles.admin_geral')}</option>
                          <option value="COLABORADOR">{t('admins.roles.colaborador')}</option>
                          <option value="INTERMITENTE">{t('admins.roles.intermitente')}</option>
                          <option value="PADRE">Missionário</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'block', fontSize: '0.85rem' }}>{t('missionaries.table.status')}</label>
                        <select value={editingProfile.status} onChange={e => setEditingProfile({ ...editingProfile, status: e.target.value as 'ATIVO' | 'INATIVO' })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.9rem', cursor: 'pointer', background: 'white' }}>
                          <option value="ATIVO">ATIVO</option>
                          <option value="INATIVO">INATIVO</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: PERMISSÕES */}
                <div className="form-column">
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#013375', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: '10px', borderLeft: '4px solid #013375', paddingLeft: '12px' }}>
                        Permissões de Visualização
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, paddingLeft: '16px' }}>Defina o que este usuário poderá visualizar nos perfis.</p>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      flex: 1,
                      maxHeight: '440px',
                      overflowY: 'auto',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '8px'
                    }}>
                      {PERMISSIONS_LIST.map(perm => {
                        const isChecked = !!editingProfile.permissoes?.[perm.id];
                        return (
                          <label key={perm.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: isChecked ? 'linear-gradient(to right, #eff6ff, #ffffff)' : 'transparent',
                            border: `1px solid ${isChecked ? '#bfdbfe' : 'transparent'}`,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '6px',
                              border: `2px solid ${isChecked ? '#013375' : '#cbd5e1'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isChecked ? '#013375' : 'white',
                              transition: 'all 0.2s'
                            }}>
                              {isChecked && <ShieldCheck size={14} color="white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.id)}
                              style={{ display: 'none' }}
                            />
                            <span style={{ color: isChecked ? '#013375' : '#475569', fontWeight: isChecked ? 700 : 500 }}>
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '25px 35px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '12px', padding: '12px 25px', fontWeight: 700, fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-save" disabled={saveLoading} style={{ borderRadius: '12px', padding: '12px 35px', fontWeight: 800, fontSize: '0.9rem', background: '#013375', color: 'white', boxShadow: '0 4px 6px -1px rgba(1, 51, 117, 0.3)' }}>
                  {saveLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingProfile.id === 0 ? 'Criar Acesso' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administradores;
