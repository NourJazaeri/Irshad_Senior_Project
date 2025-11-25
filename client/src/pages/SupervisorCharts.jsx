import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { getSupervisorDashboard } from "../services/dashboardApi";
import GroupProgressCard from "../components/charts/GroupProgressCard";
import StatusDistributionCard from "../components/charts/StatusDistributionCard";
import ProgressByTraineeChart from "../components/charts/ProgressByTraineeChart";
import AverageScoreChart from "../components/charts/AverageScoreChart";
import ExportReportCard from "../components/charts/ExportReportCard";
import TraineeProgressTable from "../components/charts/TraineeProgressTable";
import '../styles/supervisor.css';

export default function SupervisorCharts() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supervisor, setSupervisor] = useState(null);

  // Fetch dashboard data and auto-refresh every 30s
  useEffect(() => {
    const user = getCurrentUser();
    setSupervisor(user);
    console.log('⚡ SupervisorCharts mounted - Current user:', user);
    
    if (!user?.id) {
      console.error('❌ No supervisor ID found');
      setError("Unable to identify supervisor. Please log in again.");
      setLoading(false);
      return;
    }

    let interval;
    let mounted = true;

    async function fetchDashboard() {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError("");
        console.log('📊 Fetching dashboard for supervisor:', user.id);
        const data = await getSupervisorDashboard(user.id);
        console.log('✅ Dashboard data received:', data);
        
        if (mounted) {
          setDashboard(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Dashboard error:', err);
        if (mounted) {
          setError("Failed to load dashboard data: " + (err.message || ''));
          setLoading(false);
        }
      }
    }

    // Fetch immediately on mount
    console.log('🚀 Starting initial fetch...');
    fetchDashboard();
    
    // Auto-refresh disabled - data loads once on page load
    // Users can manually refresh by navigating away and back, or reloading the page
    
    return () => {
      console.log('🧹 Cleaning up SupervisorCharts');
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div id="supervisor-dashboard-root" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }} className="no-export">
        <ExportReportCard />
      </div>

      {loading ? (
        <div className="sv-card sv-card-muted sv-loading-state" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="sv-spinner"></div>
          <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '15px' }}>Loading dashboard...</div>
        </div>
      ) : error ? (
        <div className="sv-card" style={{ padding: '40px', textAlign: 'center', background: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ color: '#dc2626', fontSize: '16px', fontWeight: '500' }}>{error}</div>
        </div>
      ) : dashboard ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Row 1: Group Progress Overview */}
          <div 
            className="sv-card sv-card-pad sv-group-card-enhanced"
            style={{ 
              animation: 'fadeInUp 0.5s ease-out forwards',
              opacity: 0,
              animationDelay: '0s'
            }}
          >
            <div className="sv-section-title" style={{ marginTop: 0, marginBottom: '8px', fontSize: '24px' }}>Group Progress Overview</div>
            <div style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Real-time completion metrics by team</div>
            <GroupProgressCard groupStats={dashboard.groupStats} />
          </div>

          {/* Row 2: Status Distribution - Full Width for Better Layout */}
          <div 
            className="sv-card sv-card-pad sv-group-card-enhanced"
            style={{ 
              animation: 'fadeInUp 0.5s ease-out forwards',
              opacity: 0,
              animationDelay: '0.1s'
            }}
          >
            <div className="sv-section-title" style={{ marginTop: 0, marginBottom: '8px', fontSize: '24px' }}>Group Performance Comparison</div>
            <div style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Overall performance by team</div>
            <StatusDistributionCard statusDistribution={dashboard.statusDistribution} />
          </div>

          {/* Row 3: Progress by Trainee and Average Score */}
          <div className="sv-grid sv-grid-2">
            <div 
              className="sv-card sv-card-pad sv-group-card-enhanced"
              style={{ 
                animation: 'fadeInUp 0.5s ease-out forwards',
                opacity: 0,
                animationDelay: '0.2s'
              }}
            >
              <ProgressByTraineeChart traineeStats={dashboard.traineeStats} />
            </div>
            <div 
              className="sv-card sv-card-pad sv-group-card-enhanced"
              style={{ 
                animation: 'fadeInUp 0.5s ease-out forwards',
                opacity: 0,
                animationDelay: '0.3s'
              }}
            >
              <AverageScoreChart traineeStats={dashboard.traineeStats} />
            </div>
          </div>

          {/* Row 4: Trainee Progress Table - Full Width */}
          <div 
            className="sv-card sv-card-pad sv-group-card-enhanced"
            style={{ 
              animation: 'fadeInUp 0.5s ease-out forwards',
              opacity: 0,
              animationDelay: '0.4s'
            }}
          >
            <TraineeProgressTable traineeStats={dashboard.traineeStats} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
