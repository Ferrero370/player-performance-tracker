<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../services/api'

interface Team {
    id: number
    name: string
}

interface Player {
    id: number
    name: string
    position: string
    teamId: number
}

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

interface Activity {
    id: number
    playerId: number
    playerName: string
    type: string
    duration: number
    rpe: number
    activityDate: string
}

const teams = ref<Team[]>([])
const players = ref<Player[]>([])
const matches = ref<Match[]>([])
const activities = ref<Activity[]>([])

const loading = ref(true)
const error = ref('')

const totalTrainingLoad = computed(() => {
    return activities.value.reduce(
        (total, activity) => total + activity.duration * activity.rpe,
        0
    )
})

const averageRpe = computed(() => {
    if (activities.value.length === 0) return 0

    const total = activities.value.reduce(
        (sum, activity) => sum + activity.rpe,
        0
    )

    return (total / activities.value.length).toFixed(1)
})

const wins = computed(() => {
    return matches.value.filter(
        match => match.teamGoals > match.opponentGoals
    ).length
})

const losses = computed(() => {
    return matches.value.filter(
        match => match.teamGoals < match.opponentGoals
    ).length
})

const draws = computed(() => {
    return matches.value.filter(
        match => match.teamGoals === match.opponentGoals
    ).length
})

function getResult(match: Match) {
    if (match.teamGoals > match.opponentGoals) return 'win'
    if (match.teamGoals < match.opponentGoals) return 'loss'
    return 'draw'
}

function formatResult(match: Match) {
    const result = getResult(match)

    if (result === 'win') return 'Victòria'
    if (result === 'loss') return 'Derrota'
    return 'Empat'
}

function formatDate(date: string) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
}

onMounted(async () => {
    try {
        const [
            teamsResponse,
            playersResponse,
            matchesResponse,
            activitiesResponse
        ] = await Promise.all([
            apiRequest('/teams'),
            apiRequest('/players'),
            apiRequest('/matches'),
            apiRequest('/activities')
        ])

        teams.value = teamsResponse.data
        players.value = playersResponse.data
        matches.value = matchesResponse.data
        activities.value = activitiesResponse.data

    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : 'Error carregant les dades'
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="dashboard">

```
    <header class="header">
        <div>
            <h1>Dashboard</h1>
            <p>Resum del rendiment dels teus equips</p>
        </div>
    </header>

    <div v-if="loading" class="message">
        Carregant dades...
    </div>

    <div v-else-if="error" class="message error">
        {{ error }}
    </div>

    <template v-else>

        <!-- Estadístiques principals -->

        <section class="cards">

            <div class="card">
                <span class="card-title">Equips</span>
                <strong>{{ teams.length }}</strong>
            </div>

            <div class="card">
                <span class="card-title">Jugadores</span>
                <strong>{{ players.length }}</strong>
            </div>

            <div class="card">
                <span class="card-title">Partits</span>
                <strong>{{ matches.length }}</strong>
            </div>

            <div class="card">
                <span class="card-title">Activitats</span>
                <strong>{{ activities.length }}</strong>
            </div>

        </section>

        <!-- Rendiment dels partits -->

        <section class="section">

            <h2>Rendiment en partits</h2>

            <div class="performance">

                <div class="performance-card">
                    <span>Victòries</span>
                    <strong>{{ wins }}</strong>
                </div>

                <div class="performance-card">
                    <span>Empats</span>
                    <strong>{{ draws }}</strong>
                </div>

                <div class="performance-card">
                    <span>Derrotes</span>
                    <strong>{{ losses }}</strong>
                </div>

            </div>

        </section>

        <!-- Càrrega -->

        <section class="section">

            <h2>Càrrega d'entrenament</h2>

            <div class="load-grid">

                <div class="load-card">
                    <span>Càrrega total registrada</span>
                    <strong>{{ totalTrainingLoad }}</strong>
                </div>

                <div class="load-card">
                    <span>RPE mitjà</span>
                    <strong>{{ averageRpe }}</strong>
                </div>

                <div class="load-card">
                    <span>Activitats registrades</span>
                    <strong>{{ activities.length }}</strong>
                </div>

            </div>

        </section>

        <!-- Últims partits -->

        <section class="section">

            <h2>Últims partits</h2>

            <div v-if="matches.length === 0" class="empty">
                No hi ha partits registrats.
            </div>

            <div v-else class="matches">

                <div
                    v-for="match in matches.slice(0, 5)"
                    :key="match.id"
                    class="match"
                >

                    <div class="match-teams">
                        <strong>{{ match.teamName }}</strong>

                        <span>vs</span>

                        <strong>{{ match.opponent }}</strong>
                    </div>

                    <div class="score">
                        {{ match.teamGoals }} -
                        {{ match.opponentGoals }}
                    </div>

                    <div
                        class="result"
                        :class="getResult(match)"
                    >
                        {{ formatResult(match) }}
                    </div>

                    <small>
                        {{ formatDate(match.date) }}
                    </small>

                </div>

            </div>

        </section>

        <!-- Últimes activitats -->

        <section class="section">

            <h2>Últimes activitats</h2>

            <div v-if="activities.length === 0" class="empty">
                No hi ha activitats registrades.
            </div>

            <div v-else class="activities">

                <div
                    v-for="activity in activities.slice(0, 5)"
                    :key="activity.id"
                    class="activity"
                >

                    <div>
                        <strong>
                            {{ activity.playerName }}
                        </strong>

                        <span>
                            {{ activity.type }}
                        </span>
                    </div>

                    <div class="activity-data">
                        {{ activity.duration }} min
                    </div>

                    <div class="activity-data">
                        RPE {{ activity.rpe }}
                    </div>

                    <div class="activity-load">
                        Càrrega:
                        {{ activity.duration * activity.rpe }}
                    </div>

                    <small>
                        {{ formatDate(activity.activityDate) }}
                    </small>

                </div>

            </div>

        </section>

    </template>

</div>
```

</template>

<style scoped>
.dashboard {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
}

.header {
    margin-bottom: 30px;
}

.header h1 {
    margin: 0;
    font-size: 32px;
}

.header p {
    margin-top: 5px;
    color: #666;
}

/* Estadístiques */

.cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;
}

.card,
.performance-card,
.load-card {
    padding: 25px;
    border: 1px solid #ddd;
    border-radius: 12px;
    background: white;
}

.card-title,
.performance-card span,
.load-card span {
    display: block;
    color: #666;
    margin-bottom: 10px;
}

.card strong,
.performance-card strong,
.load-card strong {
    font-size: 32px;
}

/* Seccions */

.section {
    margin-bottom: 40px;
}

.section h2 {
    margin-bottom: 20px;
}

/* Rendiment */

.performance {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

/* Càrrega */

.load-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

/* Partits */

.matches {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.match {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 20px;
    align-items: center;
    padding: 18px 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: white;
}

.match-teams {
    display: flex;
    gap: 10px;
}

.score {
    font-size: 20px;
    font-weight: bold;
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

/* Activitats */

.activities {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.activity {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    gap: 20px;
    align-items: center;
    padding: 18px 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: white;
}

.activity div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.activity div:first-child span {
    color: #666;
    font-size: 14px;
}

.activity-data {
    color: #555;
}

.activity-load {
    font-weight: bold;
}

.empty {
    padding: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
}

.message {
    padding: 20px;
}

.error {
    color: red;
}

/* Responsive */

@media (max-width: 900px) {

    .cards {
        grid-template-columns: repeat(2, 1fr);
    }

    .match {
        grid-template-columns: 1fr auto;
    }

    .activity {
        grid-template-columns: 1fr auto;
    }
}

@media (max-width: 600px) {

    .dashboard {
        padding: 20px;
    }

    .cards,
    .performance,
    .load-grid {
        grid-template-columns: 1fr;
    }

    .match {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .activity {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
</style>
