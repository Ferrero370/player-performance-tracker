<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiRequest } from '../services/api'

interface Match {
    id: number
    teamId: number
    teamName: string
    opponent: string
    date: string
    homeAway: string
    teamGoals: number
    opponentGoals: number
}

const matches = ref<Match[]>([])
const loading = ref(true)
const error = ref('')

async function loadMatches() {
    try {
        const response = await apiRequest('/matches')
        matches.value = response.data
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : 'Error carregant els partits'
    } finally {
        loading.value = false
    }
}

function formatDate(date: string) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
}

function getResult(match: Match) {
    if (match.teamGoals > match.opponentGoals) return 'win'
    if (match.teamGoals < match.opponentGoals) return 'loss'
    return 'draw'
}

onMounted(loadMatches)
</script>

<template>
    <div class="matches-page">

        <header class="page-header">
            <div>
                <h1>Partits</h1>
                <p>Historial de partits dels teus equips</p>
            </div>
        </header>

        <div v-if="loading" class="message">
            Carregant partits...
        </div>

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>

        <div v-else-if="matches.length === 0" class="message">
            Encara no hi ha partits registrats.
        </div>

        <div v-else class="matches-list">

            <div
                v-for="match in matches"
                :key="match.id"
                class="match-card"
            >

                <div class="match-date">
                    {{ formatDate(match.date) }}
                </div>

                <div class="match-info">

                    <div class="teams">

                        <strong>
                            {{ match.teamName }}
                        </strong>

                        <span class="score">
                            {{ match.teamGoals }}
                            -
                            {{ match.opponentGoals }}
                        </span>

                        <strong>
                            {{ match.opponent }}
                        </strong>

                    </div>

                    <div class="match-details">

                        <span>
                            {{
                                match.homeAway === 'home'
                                    ? '🏠 Local'
                                    : '✈️ Visitant'
                            }}
                        </span>

                        <span
                            class="result"
                            :class="getResult(match)"
                        >
                            {{
                                getResult(match) === 'win'
                                    ? 'Victòria'
                                    : getResult(match) === 'loss'
                                        ? 'Derrota'
                                        : 'Empat'
                            }}
                        </span>

                    </div>

                </div>

            </div>

        </div>

    </div>
</template>

<style scoped>
.matches-page {
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

.message {
    padding: 25px;
    background: white;
    border-radius: 12px;
    border: 1px solid #ddd;
}

.error {
    color: #dc2626;
}

.matches-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.match-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 25px;
}

.match-date {
    min-width: 90px;
    font-size: 14px;
    color: #666;
}

.match-info {
    flex: 1;
}

.teams {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 25px;
    font-size: 17px;
}

.score {
    font-size: 24px;
    font-weight: bold;
    min-width: 70px;
    text-align: center;
}

.match-details {
    margin-top: 12px;
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 13px;
    color: #666;
}

.result {
    font-weight: bold;
}

.result.win {
    color: #16a34a;
}

.result.loss {
    color: #dc2626;
}

.result.draw {
    color: #ca8a04;
}

@media (max-width: 700px) {
    .matches-page {
        padding: 20px;
    }

    .match-card {
        flex-direction: column;
        align-items: stretch;
    }

    .match-date {
        min-width: auto;
    }

    .teams {
        gap: 10px;
        font-size: 14px;
    }

    .score {
        font-size: 20px;
    }
}
</style>