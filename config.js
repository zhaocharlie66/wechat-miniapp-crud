// Cloudflare Pages 部署时，建议将 API_BASE 设为 '/api'
// 这样可通过“将 /api/* 路由绑定到现有 Worker”的方式打通前后端同域
window.API_BASE = window.API_BASE || '/api';
