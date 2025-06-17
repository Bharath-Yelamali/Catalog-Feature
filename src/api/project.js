// src/api/project.js
// Centralized API utility for frontend

export async function fetchProjects(token) {
  const res = await fetch('/api/projects', {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.value || [];
}
