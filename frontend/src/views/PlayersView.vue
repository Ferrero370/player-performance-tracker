<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../services/api'

interface Player {
    id: number
    name: string
    position: string
    teamId: number
}

const router = useRouter()

const players = ref<Player[]>([])
const loading = ref(true)
const error = ref('')

async function loadPlayers() {
    try {
        const response = await apiRequest('/players')
        players.value = response.data
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : 'Error carregant les jugadores'
    } finally {
        loading.value = false
    }
}

function openPlayer(playerId: number) {
    router.push(`/players/${playerId}`)
}

onMounted(loadPlayers)
</script>

<template>
    <div class="players-page">

        <header class="page-header">
            <div>
                <h1>Jugadores</h1>
                <p>Consulta i gestiona les jugadores dels teus equips</p>
            </div>
        </header>

        <div v-if="loading" class="message">
            Carregant jugadores...
        </div>

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>

        <div v-else-if="players.length === 0" class="message">
            No hi ha jugadores registrades.
        </div>

        <div v-else class="players-table-wrapper">

            <table class="players-table">

                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Posició</th>
                        <th>Equip</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>

                    <tr
                        v-for="player in players"
                        :key="player.id"
                    >
                        <td>
                            <strong>{{ player.name }}</strong>
                        </td>

                        <td>
                            {{ player.position }}
                        </td>

                        <td>
                            #{{ player.teamId }}
                        </td>

                        <td class="actions">
                            <button @click="openPlayer(player.id)">
                                Veure perfil
                            </button>
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    </div>
</template>

<style scoped>
.players-page {
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

.players-table-wrapper {
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    overflow-x: auto;
}

.players-table {
    width: 100%;
    border-collapse: collapse;
}

.players-table th,
.players-table td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.players-table th {
    font-size: 13px;
    text-transform: uppercase;
    color: #666;
}

.players-table tbody tr:last-child td {
    border-bottom: none;
}

.actions {
    text-align: right !important;
}

.actions button {
    width: auto;
    padding: 8px 14px;
    background: #2563eb;
    color: white;
    border-radius: 7px;
    border: none;
    cursor: pointer;
}

.actions button:hover {
    background: #1d4ed8;
}

@media (max-width: 700px) {
    .players-page {
        padding: 20px;
    }

    .players-table th,
    .players-table td {
        padding: 12px;
    }
}
</style>