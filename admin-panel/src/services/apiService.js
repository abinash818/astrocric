import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('admin_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('admin_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('admin_token');
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
        };
    }

    async get(endpoint) {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async post(endpoint, data) {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async put(endpoint, data) {
        const response = await axios.put(`${API_BASE_URL}${endpoint}`, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async delete(endpoint) {
        const response = await axios.delete(`${API_BASE_URL}${endpoint}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }
}

export default new ApiService();
