import { ref } from 'vue';
import { apiRequest } from '../services/api';

const token = ref<string | null>(localStorage.getItem('token'));

const user = ref<any>(
    JSON.parse(localStorage.getItem('user') || 'null')
);

async function login(email: string, password: string) {

    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password
        })
    });

    token.value = response.data.token;
    user.value = response.data.user;

    localStorage.setItem('token', response.data.token);
    localStorage.setItem(
        'user',
        JSON.stringify(response.data.user)
    );

    return response.data;
}

function logout() {

    token.value = null;
    user.value = null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export function useAuth() {
    return {
        token,
        user,
        login,
        logout
    };
}