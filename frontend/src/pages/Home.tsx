import React, { useState, useEffect } from 'react';
import {
  Users, Home as HouseIcon, Activity,
  Loader2, ArrowRight, Phone, Mail, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

interface DashboardStats {
  totalUsers?: number;
  totalHouses?: number;
  totalItineraries?: number;
  isMissionary?: boolean;
  houseName?: string;
  regional?: string;
  spreadsheetStatus?: string;
  recentActivities: Array<{ id: number, user: string, activity: string, time: string }>;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdminGeral, isRegional, canEdit } = useAuth();
  const isAdm = isAdminGeral || isRegional || canEdit;
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.post('/stats');
      setStatsData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: t('dashboard.stats.total_members'), value: statsData?.totalUsers?.toString() || '0', icon: <Users size={24} />, color: '#013375' },
    { label: t('dashboard.stats.obras'), value: '12', icon: <HouseIcon size={24} />, color: '#013375' },
    { label: t('dashboard.stats.paroquias'), value: '25', icon: <HouseIcon size={24} />, color: '#013375' },
    { label: t('dashboard.stats.pastoral'), value: '8', icon: <Activity size={24} />, color: '#013375' },
    { label: t('dashboard.stats.idosos'), value: '5', icon: <HouseIcon size={24} />, color: '#013375' },
    { label: t('dashboard.stats.seminaristas'), value: statsData?.totalUsers?.toString() || '0', icon: <Users size={24} />, color: '#013375', path: '/itinerario-formativo' },
  ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <h2>{t('dashboard.overview')}</h2>
        </div>
      </div>

      {isAdm && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="stat-card" 
              style={{ cursor: stat.path ? 'pointer' : 'default' }}
              onClick={() => stat.path && navigate(stat.path)}
            >
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="map-section card-lite" style={{ padding: '0', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={20} className="text-primary" /> Sede Regional RNSMM
            </h3>
          </div>
          <div className="map-container" style={{ flex: 1, position: 'relative' }}>
            <iframe
                title="Google Maps Sede RNSMM Home"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, minHeight: '350px' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent("R. Dr. Mário Vicente, 1108 - Ipiranga, São Paulo - SP")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
            ></iframe>
          </div>
          <div style={{ padding: '15px 24px', background: '#f8fafc', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>R. Dr. Mário Vicente, 1108 - Ipiranga, São Paulo - SP, 04270-001</span>
              <button 
                  onClick={() => navigate('/mapa')}
                  style={{ background: 'none', border: 'none', color: '#013375', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                  Ver Detalhes <ArrowRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> +55 11 97286-1612</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> faleconosco@scalabrinianos.com</span>
            </div>
          </div>
        </div>

        <div className="activity-section card-lite" style={{ padding: '24px' }}>
          <div className="section-header">
            <h3>{t('dashboard.recent_activity')}</h3>
          </div>
          <div className="activity-list">
            {(statsData?.recentActivities || []).map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-avatar">
                  {act.user.charAt(0)}
                </div>
                <div className="activity-details">
                  <p><strong>{act.user}</strong> {act.activity}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
