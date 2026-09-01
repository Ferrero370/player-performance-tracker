<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiRequest } from '../services/api'
import LoadChart from '../components/LoadChart.vue'

interface Player {
    id: number
    name: string
    position: string
    teamId: number
    team: string
}

interface Statistics {
    matches: number
    starts: number
    minutesPlayed: number
    goals: number
    assists: number
}

interface Load {
    currentWeekLoad: number
    previousAverageLoad: number | null
    changePercentage: number | null
    loadStatus: string
}

interface Week {
    week: string
    weekStart: string
    load: number
}

interface Profile {
    player: Player
    statistics: Statistics
    load: Load
}

const route = useRoute()
const router = useRouter()

const profile = ref<Profile | null>(null)
const weeklyLoad = ref<Week[]>([])
const loading = ref(true)
const error = ref('')

async function loadProfile() {
try {
    const playerId = route.params.id

    const [profileResponse, weeklyLoadResponse] =
        await Promise.all([
            apiRequest(`/players/${playerId}/profile`),
            apiRequest(`/players/${playerId}/load/weekly`)
        ])

    profile.value = profileResponse.data
    weeklyLoad.value = weeklyLoadResponse.data.weeks

} catch (err) {
    error.value =
        err instanceof Error
            ? err.message
            : 'Error carregant el perfil'
} finally {
    loading.value = false
}
}


function goBack() {
    router.push('/players')
}

onMounted(loadProfile)
</script>

<template>
    <div class="profile-page">

        <div v-if="loading" class="message">
            Carregant perfil...
        </div>

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>

        <template v-else-if="profile">

            <!-- Capçalera -->

            <header class="profile-header">

                <button
                    class="back-button"
                    @click="goBack"
                >
                    ← Tornar a jugadores
                </button>

                <div class="player-header">

                    <div class="avatar">
                        {{ profile.player.name.charAt(0) }}
                    </div>

                    <div>
                        <h1>{{ profile.player.name }}</h1>

                        <p>
                            {{ profile.player.position }}
                            ·
                            {{ profile.player.team }}
                        </p>
                    </div>

                </div>

            </header>

            <!-- Estadístiques -->

            <section class="section">

                <h2>Estadístiques</h2>

                <div class="stats-grid">

                    <div class="stat-card">
                        <span>Partits</span>
                        <strong>
                            {{ profile.statistics.matches }}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span>Titularitats</span>
                        <strong>
                            {{ profile.statistics.starts }}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span>Minuts</span>
                        <strong>
                            {{ profile.statistics.minutesPlayed }}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span>Gols</span>
                        <strong>
                            {{ profile.statistics.goals }}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span>Assistències</span>
                        <strong>
                            {{ profile.statistics.assists }}
                        </strong>
                    </div>

                </div>

            </section>

            <!-- Càrrega -->

            <section class="section">

                <h2>Càrrega d'entrenament</h2>

                <div class="load-grid">

                    <div class="load-card">

                        <span>Càrrega aquesta setmana</span>

                        <strong>
                            {{ profile.load.currentWeekLoad }}
                        </strong>

                    </div>

                    <div class="load-card">

                        <span>Mitjana setmanes anteriors</span>

                        <strong>
                            {{
                                profile.load.previousAverageLoad
                                ?? '-'
                            }}
                        </strong>

                    </div>

                    <div class="load-card">

                        <span>Variació</span>

                        <strong
                            :class="{
                                positive:
                                    profile.load.changePercentage !== null &&
                                    profile.load.changePercentage > 10,

                                negative:
                                    profile.load.changePercentage !== null &&
                                    profile.load.changePercentage < -10
                            }"
                        >
                            {{
                                profile.load.changePercentage !== null
                                    ? profile.load.changePercentage + '%'
                                    : '-'
                            }}
                        </strong>

                    </div>

                </div>

                <div
                    v-if="profile.load.changePercentage !== null"
                    class="load-status"
                >
                    Estat de la càrrega:

                    <strong>
                        {{
                            profile.load.loadStatus === 'increased'
                                ? 'Augmentada'
                                : profile.load.loadStatus === 'decreased'
                                    ? 'Disminuïda'
                                    : 'Estable'
                        }}
                    </strong>
                </div>

                <h3 class="chart-title">Evolució de la càrrega</h3>

                <LoadChart
                    v-if="weeklyLoad.length > 0"
                    :weeks="weeklyLoad"
                />

                <div v-else class="no-data">
                    Encara no hi ha prou dades per mostrar l'evolució.
                </div>

            </section>

        </template>

    </div>
</template>

<style scoped>
.profile-page {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
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

.profile-header {
    margin-bottom: 40px;
}

.back-button {
    width: auto;
    background: transparent;
    border: none;
    padding: 0;
    margin-bottom: 25px;
    color: #2563eb;
    cursor: pointer;
    font-size: 15px;
}

.player-header {
    display: flex;
    align-items: center;
    gap: 20px;
}

.avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
}

.player-header h1 {
    margin: 0;
    font-size: 32px;
}

.player-header p {
    margin-top: 6px;
    color: #666;
}

.section {
    margin-bottom: 40px;
}

.section h2 {
    margin-bottom: 20px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
}

.stat-card,
.load-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
}

.stat-card span,
.load-card span {
    display: block;
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
}

.stat-card strong,
.load-card strong {
    font-size: 28px;
}

.load-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.positive {
    color: #dc2626;
}

.negative {
    color: #16a34a;
}

.load-status {
    margin-top: 15px;
    padding: 15px 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
}

@media (max-width: 900px) {
    .stats-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 600px) {
    .profile-page {
        padding: 20px;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .load-grid {
        grid-template-columns: 1fr;
    }

    .player-header h1 {
        font-size: 25px;
    }
}

.chart-title {
    margin-top: 30px;
    margin-bottom: 15px;
}

.no-data {
    padding: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
    color: #666;
}
</style>