import React, { useState, useEffect, useRef } from 'react';
import { Save, BookOpen, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/DadosReligiosos.css';

interface ReligiousData {
  data_batismo: string;
  data_primeira_comunhao: string;
  data_crisma: string;
}

const DadosReligiosos: React.FC = () => {
  const { canEdit, user } = useAuth();
  const [formData, setFormData] = useState<ReligiousData>({
    data_batismo: '',
    data_primeira_comunhao: '',
    data_crisma: '',
  });
  const [pendingDocDesc, setPendingDocDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    if (user?.id) {
      fetchReligiousData();
    }
  }, [user?.id]);

  const fetchReligiousData = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`${API_URL}/usuarios/${user?.id}/dados-religiosos/get`);
      if (response.data) {
        const data = response.data;
        // Format dates
        ['data_batismo', 'data_primeira_comunhao', 'data_crisma'].forEach(field => {
          if (data[field]) data[field] = data[field].split('T')[0];
        });
        setFormData(prev => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err) {
      console.error('Error fetching religious data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await api.post(`${API_URL}/usuarios/${user.id}/dados-religiosos`, formData);
      alert('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving religious data:', err);
      alert('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!pendingDocDesc.trim()) return alert('Informe a descrição do documento');

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('descricao', pendingDocDesc);

    setIsSaving(true);
    try {
      await api.post(`${API_URL}/usuarios/${user.id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPendingDocDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Documento enviado com sucesso!');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Erro ao enviar documento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando dados religiosos...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Dados Religiosos</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="section-title">
          <BookOpen size={20} /> <h3>Dados Religiosos</h3>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>Batismo</label>
            <input
              type="date"
              name="data_batismo"
              value={formData.data_batismo}
              onChange={handleInputChange}
              disabled={!canEdit}
            />
          </div>
          <div className="form-group">
            <label>1ª Comunhão</label>
            <input
              type="date"
              name="data_primeira_comunhao"
              value={formData.data_primeira_comunhao}
              onChange={handleInputChange}
              disabled={!canEdit}
            />
          </div>
          <div className="form-group">
            <label>Crisma</label>
            <input
              type="date"
              name="data_crisma"
              value={formData.data_crisma}
              onChange={handleInputChange}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="section-title mt-4">
          <h3>Anexar Certidão</h3>
        </div>

        <div className="form-grid-1">
          <div className="form-group full">
            <label>Descrição do documento</label>
            <input
              type="text"
              placeholder="Ex: Certidão de Batismo"
              value={pendingDocDesc}
              onChange={e => setPendingDocDesc(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="form-group full">
            <label>Anexar arquivo</label>
            <div className="file-input-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} onChange={uploadDocument} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" disabled={!canEdit} />
              <button type="button" className="btn-upload-doc" onClick={() => fileInputRef.current?.click()} disabled={!canEdit || isSaving}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSaving ? 'Enviando...' : 'Selecionar arquivo'}
              </button>
              <span style={{ color: '#555', fontSize: '0.95rem' }}>PDF/JPG/PNG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosReligiosos;
