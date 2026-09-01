<template>
    <div class="login-page">

        <div class="login-card">

            <div class="logo">
                PPT
            </div>

            <h1>Player Performance Tracker</h1>

            <p class="subtitle">
                Gestiona el rendiment del teu equip
            </p>

            <form @submit.prevent="handleLogin">

                <div class="form-group">
                    <label>Email</label>
                    <input
                        v-model="email"
                        type="email"
                        placeholder="coach@example.com"
                        required
                    />
                </div>

                <div class="form-group">
                    <label>Contrasenya</label>
                    <input
                        v-model="password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <p v-if="errorMessage" class="error">
                    {{ errorMessage }}
                </p>

                <button type="submit" :disabled="loading">
                    {{ loading ? 'Iniciant sessió...' : 'Iniciar sessió' }}
                </button>

            </form>

        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../stores/auth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();
const auth = useAuth();

async function handleLogin() {

    errorMessage.value = '';
    loading.value = true;

    try {

        await auth.login(email.value, password.value);

        router.push('/dashboard');

    } catch (error) {

        errorMessage.value =
            error instanceof Error
                ? error.message
                : 'Error iniciant sessió';

    } finally {

        loading.value = false;

    }
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f4f6f8;
    padding: 20px;
}

.login-card {
    width: 100%;
    max-width: 420px;
    background: white;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.logo {
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111827;
    color: white;
    border-radius: 14px;
    font-size: 20px;
    font-weight: bold;
}

h1 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 8px;
}

.subtitle {
    text-align: center;
    color: #6b7280;
    margin-bottom: 30px;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 7px;
    font-weight: 600;
}

input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 15px;
}

input:focus {
    outline: none;
    border-color: #111827;
}

button {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 8px;
    background: #111827;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error {
    color: #dc2626;
    margin-bottom: 15px;
    font-size: 14px;
}
</style>