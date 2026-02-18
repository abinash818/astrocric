import axios from 'axios';

const API_URL = 'https://astrocric.onrender.com/api';

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
        const response = await axios.get(`${API_URL}${endpoint}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async post(endpoint, data) {
        const response = await axios.post(`${API_URL}${endpoint}`, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async put(endpoint, data) {
        const response = await axios.put(`${API_URL}${endpoint}`, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async delete(endpoint) {
        const response = await axios.delete(`${API_URL}${endpoint}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }
}

export default new ApiService();
