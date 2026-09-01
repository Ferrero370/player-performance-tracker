<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiRequest } from '../services/api'

interface Team {
    id: number
    name: string
    coachId: number
}

const teams = ref<Team[]>([])
const loading = ref(true)
const error = ref('')

async function loadTeams() {
    try {
        const response = await apiRequest('/teams')
        teams.value = response.data
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : 'Error carregant els equips'
    } finally {
        loading.value = false
    }
}

onMounted(loadTeams)
</script>

<template>
    <div class="teams-page">

        <header class="page-header">
            <div>
                <h1>Equips</h1>
                <p>Gestiona els teus equips</p>
            </div>
        </header>

        <div v-if="loading" class="message">
            Carregant equips...
        </div>

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>

        <div v-else-if="teams.length === 0" class="message">
            No tens cap equip registrat.
        </div>

        <div v-else class="teams-grid">

            <div
                v-for="team in teams"
                :key="team.id"
                class="team-card"
            >
                <div class="team-icon">
                    ⚽
                </div>

                <div class="team-info">
                    <h2>{{ team.name }}</h2>
                    <span>Equip #{{ team.id }}</span>
                </div>

                <button>
                    Veure equip
                </button>
            </div>

        </div>

    </div>
</template>

<style scoped>
.teams-page {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 30px;
}

.page-header h1 {
    margin: 0;
    font-size: 32px;
}

.page-header p {
    margin-top: 5px;
    color: #666;
}

.teams-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.team-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.team-icon {
    width: 55px;
    height: 55px;
    border-radius: 12px;
    background: #f0f4ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
}

.team-info {
    flex: 1;
}

.team-info h2 {
    margin: 0 0 5px;
    font-size: 19px;
}

.team-info span {
    color: #777;
    font-size: 14px;
}

.team-card button {
    width: auto;
    padding: 9px 15px;
    background: #2563eb;
    color: white;
}

.message {
    padding: 25px;
    background: white;
    border-radius: 12px;
    border: 1px solid #ddd;
}

.error {
    color: #dc2626;
}

@media (max-width: 700px) {
    .teams-page {
        padding: 20px;
    }

    .teams-grid {
        grid-template-columns: 1fr;
    }

    .team-card {
        padding: 20px;
    }
}
</style>