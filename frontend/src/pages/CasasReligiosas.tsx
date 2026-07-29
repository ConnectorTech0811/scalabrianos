import React, { useState, useMemo, useEffect } from 'react';
import { Edit2, X, Loader2, AlertCircle, Plus, Trash2, Download, Home as HomeIcon, Save, Eye, Search, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { formatCNPJ, validateCNPJ, cleanCNPJ } from '../utils/cnpjHelper';
import '../styles/CasasReligiosas.css';

interface ReligiousHouse {
  id: number;
  nome: string;
  cnpj?: string;
  endereco: string;
  status: 'ATIVO' | 'INATIVO';
  missionarios_count: number;
  regional?: string;
  data_referencia_casa?: string;
  paroco?: string;
  vigario_paroquial?: string;
  tipo?: string;
  pm_code?: string;
}

const NOMENCLATURES = [
  { code: 'CI', label: 'Casas de Idosos – CI' },
  { code: 'CR', label: 'Casas Religiosas – CR' },
  { code: 'M', label: 'Obras – M' },
  { code: 'P', label: 'Paróquia – P' },
  { code: 'PV', label: 'Pastoral Vocacional - PV' },
  { code: 'CS', label: 'Seminário - CS' },
];

const CasasReligiosas: React.FC = () => {
  const { t } = useTranslation();
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [houses, setHouses] = useState<ReligiousHouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [editingHouse, setEditingHouse] = useState<ReligiousHouse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchHouses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterCity, filterCountry, filterStatus]);

  const fetchHouses = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/casas-religiosas/get');
      setHouses(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError(t('casas.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      const matchesName = house.nome.toLowerCase().includes(filterName.toLowerCase());
      const matchesCity = (house.endereco || '').toLowerCase().includes(filterCity.toLowerCase());
      const matchesCountry = (house.regional || '').toLowerCase().includes(filterCountry.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || house.status === filterStatus;
      return matchesName && matchesCity && matchesCountry && matchesStatus;
    });
  }, [houses, filterName, filterCity, filterCountry, filterStatus]);

  const totalPages = Math.ceil(filteredHouses.length / itemsPerPage);
  const paginatedHouses = useMemo(() => {
    return filteredHouses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredHouses, currentPage]);

  const handleClearFilters = () => {
    setFilterName('');
    setFilterCity('');
    setFilterCountry('');
    setFilterStatus('Todos');
  };

  const handleOpenEdit = (house: ReligiousHouse) => {
    setEditingHouse({ ...house });
    setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;

    if (editingHouse.cnpj) {
      const clean = cleanCNPJ(editingHouse.cnpj);
      if (clean && !validateCNPJ(editingHouse.cnpj)) {
        alert('O CNPJ digitado é inválido. Verifique os números/letras segundo o padrão da Receita Federal.');
        return;
      }
    }

    setSaveLoading(true);
    try {
      const payload = {
        ...editingHouse,
        cnpj: editingHouse.cnpj ? formatCNPJ(editingHouse.cnpj) : ''
      };
      if (editingHouse.id === 0) {
        await api.post('/casas-religiosas', payload);
      } else {
        await api.post(`/casas-religiosas/${editingHouse.id}/update`, payload);
      }
      await fetchHouses();
      setIsModalOpen(false);
      setEditingHouse(null);
    } catch (err) {
      console.error('Error saving house:', err);
      alert(t('common.error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNewHouse = () => {
    setEditingHouse({ id: 0, nome: '', endereco: '', status: 'ATIVO', missionarios_count: 0 });
    setIsModalOpen(true);
  };

  const handleDeleteHouse = async (id: number) => {
    if (!window.confirm(t('common.confirm_delete') || 'Deseja excluir?')) return;
    try {
      await api.post(`/casas-religiosas/${id}/delete`);
      await fetchHouses();
    } catch (err) {
      console.error('Error deleting house:', err);
      alert(t('common.error'));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <HomeIcon size={24} />
          <h2>{t('casas.title')}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-export">
            <Download size={18} /> {t('financeiro.actions.export')}
          </button>
          {canEdit && (
            <button className="btn-new" onClick={handleNewHouse}>
              <Plus size={18} /> {t('casas.new_house')}
            </button>
          )}
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label>PRESENÇA MISSIONÁRIA</label>
            <input
              type="text"
              placeholder="Filtrar por nome..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>CIDADE</label>
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>PAÍS</label>
            <input
              type="text"
              placeholder="Filtrar por país..."
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>STATUS</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>

        <div className="filters-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-clear" onClick={handleClearFilters} style={{ background: '#64748b', color: 'white', border: 'none' }}>
            Limpar
          </button>
          <button className="btn-filter-main" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#032b57', color: 'white', border: 'none' }}>
            <Search size={18} /> Filtrar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <Loader2 className="animate-spin" size={40} />
          <p>{t('casas.loading')}</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>PRESENÇA MISSIONÁRIA</th>
                <th>CIDADE/UF</th>
                <th>PAÍS</th>
                <th className="center">STATUS</th>
                <th className="center">PM</th>
                <th className="center">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHouses.map((house) => (
                <tr key={house.id}>
                  <td>#{house.id}</td>
                  <td className="bold">{house.nome}</td>
                  <td>{house.endereco || '---'}</td>
                  <td>{house.regional || '---'}</td>
                  <td className="center">
                    <span className={`status-tag ${house.status.toLowerCase()}`}>
                      {house.status}
                    </span>
                  </td>
                  <td className="center">
                    <span className="pm-code">{house.pm_code || '---'}</span>
                  </td>
                  <td className="center">
                    <div className="house-actions">
                      <button 
                        className="btn-action-icon finance" 
                        title={t('casas.cost_registration')}
                        onClick={() => navigate('/financeiro', { state: { house_id: house.id } })}
                      >
                        <DollarSign size={16} />
                      </button>
                      {canEdit && (
                        <>
                          <button 
                            className="btn-action-icon edit" 
                            title={t('common.edit')}
                            onClick={() => handleOpenEdit(house)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-action-icon delete" 
                            title={t('common.delete')}
                            onClick={() => handleDeleteHouse(house.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        className="btn-action-icon view" 
                        title={t('common.view')}
                        onClick={() => navigate(`/casas-religiosas/${house.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredHouses.length === 0 && (
            <div className="no-results" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <p>{t('casas.no_houses_found')}</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {isModalOpen && editingHouse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingHouse.id === 0 ? t('casas.new_house') : t('casas.edit_house')}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveHouse} className="house-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>{t('casas.tipo')}</label>
                  <select
                    value={editingHouse.tipo || ''}
                    onChange={(e) => setEditingHouse({ ...editingHouse, tipo: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {NOMENCLATURES.map(n => <option key={n.code} value={n.code}>{n.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('casas.pm')}</label>
                  <input
                    type="text"
                    placeholder="Ex: CR01"
                    value={editingHouse.pm_code || ''}
                    onChange={(e) => setEditingHouse({ ...editingHouse, pm_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('casas.name')}</label>
                <input
                  type="text"
                  placeholder="Nome da presença..."
                  value={editingHouse.nome}
                  onChange={(e) => setEditingHouse({ ...editingHouse, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>CNPJ (Alfanumérico ou Numérico)</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00 ou 19.JA2.KO8/Z001-51"
                  value={editingHouse.cnpj || ''}
                  onChange={(e) => setEditingHouse({ ...editingHouse, cnpj: formatCNPJ(e.target.value) })}
                  maxLength={18}
                />
                {editingHouse.cnpj && cleanCNPJ(editingHouse.cnpj).length === 14 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    marginTop: '4px',
                    color: validateCNPJ(editingHouse.cnpj) ? '#166534' : '#dc2626'
                  }}>
                    {validateCNPJ(editingHouse.cnpj) ? '✓ CNPJ Válido (Padrão Receita Federal)' : '✕ CNPJ Inválido (Verifique o número/letras)'}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>{t('casas.address')}</label>
                <input
                  type="text"
                  placeholder="Endereço completo..."
                  value={editingHouse.endereco}
                  onChange={(e) => setEditingHouse({ ...editingHouse, endereco: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>{t('casas.country')}</label>
                  <input
                    type="text"
                    placeholder="Ex: Brasil"
                    value={editingHouse.regional || ''}
                    onChange={(e) => setEditingHouse({ ...editingHouse, regional: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('casas.status')}</label>
                  <select
                    value={editingHouse.status}
                    onChange={(e) => setEditingHouse({ ...editingHouse, status: e.target.value as any })}
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-save" disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasasReligiosas;
