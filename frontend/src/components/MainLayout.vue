<script setup lang="ts">
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { user, logout } = useAuth()

function handleLogout() {
    logout()
    router.push('/login')
}
</script>

<template>
    <div class="layout">

        <aside class="sidebar">

            <div class="logo">
                ⚽ PPT
            </div>

            <nav>
                <RouterLink to="/dashboard">
                    Dashboard
                </RouterLink>

                <RouterLink to="/teams">
                    Teams
                </RouterLink>

                <RouterLink to="/players">
                    Players
                </RouterLink>

                <RouterLink to="/matches">
                    Matches
                </RouterLink>
            </nav>

            <div class="user-section">
                <div class="user-name">
                    {{ user?.name }}
                </div>

                <button @click="handleLogout">
                    Logout
                </button>
            </div>

        </aside>

        <main class="content">
            <RouterView />
        </main>

    </div>
</template>

<style scoped>
.layout {
    min-height: 100vh;
    display: flex;
    background: #f5f6f8;
}

.sidebar {
    width: 230px;
    min-height: 100vh;
    background: #111827;
    color: white;
    display: flex;
    flex-direction: column;
    padding: 25px 15px;
    box-sizing: border-box;
}

.logo {
    font-size: 24px;
    font-weight: bold;
    padding: 0 10px 30px;
}

nav {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

nav a {
    color: #d1d5db;
    text-decoration: none;
    padding: 12px;
    border-radius: 8px;
}

nav a:hover {
    background: #374151;
    color: white;
}

nav a.router-link-active {
    background: #2563eb;
    color: white;
}

.user-section {
    margin-top: auto;
    padding: 15px 10px 0;
    border-top: 1px solid #374151;
}

.user-name {
    margin-bottom: 12px;
    font-size: 14px;
}

button {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 7px;
    cursor: pointer;
}

.content {
    flex: 1;
    min-width: 0;
}

@media (max-width: 700px) {
    .sidebar {
        width: 180px;
    }
}
</style>