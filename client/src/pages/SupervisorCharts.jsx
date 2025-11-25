import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { getSupervisorDashboard } from "../services/dashboardApi";
import GroupProgressCard from "../components/charts/GroupProgressCard";
import StatusDistributionCard from "../components/charts/StatusDistributionCard";
import ProgressByTraineeChart from "../components/charts/ProgressByTraineeChart";
import AverageScoreChart from "../components/charts/AverageScoreChart";
import ExportReportCard from "../components/charts/ExportReportCard";
import TraineeProgressTable from "../components/charts/TraineeProgressTable";

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
      <div className="flex justify-end items-center mb-6 no-export">
        <ExportReportCard />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-lg text-gray-500">Loading…</div>
      ) : error ? (
        <div className="bg-red-100 rounded-xl shadow p-10 text-center text-lg text-red-600">{error}</div>
      ) : dashboard ? (
        <div className="space-y-6">
          {/* Row 1: Group Progress Overview */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="font-bold text-xl mb-2">Group Progress Overview</div>
            <div className="text-gray-500 mb-6 text-sm">Real-time completion metrics by team</div>
            <GroupProgressCard groupStats={dashboard.groupStats} />
          </div>

          {/* Row 2: Status Distribution - Full Width for Better Layout */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="font-bold text-xl mb-2">Group Performance Comparison</div>
            <div className="text-gray-500 mb-6 text-sm">Overall performance by team</div>
            <StatusDistributionCard statusDistribution={dashboard.statusDistribution} />
          </div>

          {/* Row 3: Progress by Trainee and Average Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <ProgressByTraineeChart traineeStats={dashboard.traineeStats} />
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <AverageScoreChart traineeStats={dashboard.traineeStats} />
            </div>
          </div>

          {/* Row 4: Trainee Progress Table - Full Width */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <TraineeProgressTable traineeStats={dashboard.traineeStats} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
