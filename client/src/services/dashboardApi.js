import axios from "axios";

export async function getSupervisorDashboard(supervisorId) {
  const token = localStorage.getItem("token");
  const { data } = await axios.get(`/api/supervisor/dashboard/${supervisorId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}
