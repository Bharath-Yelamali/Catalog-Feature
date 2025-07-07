/**
 * project.js
 *
 * Centralized API utility functions for fetching project data from the backend.
 *
 * - Provides a function to fetch all projects for use in the React frontend.
 * - Supports Bearer token authentication for secure API access.
 * - Designed for use with a backend route at /api/projects (proxied or direct).
 */

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
