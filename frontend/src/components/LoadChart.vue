<script setup lang="ts">
import { computed } from 'vue'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface Week {
    week: string
    weekStart: string
    load: number
}

const props = defineProps<{
    weeks: Week[]
}>()

const orderedWeeks = computed(() => {
    return [...props.weeks].reverse()
})

const chartData = computed(() => ({
    labels: orderedWeeks.value.map((week) => {
        const [year, month, day] = week.weekStart.split('-')
        return `${day}/${month}`
    }),

    datasets: [
        {
            label: 'Càrrega',
            data: orderedWeeks.value.map(week => week.load),
            tension: 0.3,
            fill: false
        }
    ]
}))

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
        legend: {
            display: false
        }
    },

    scales: {
        y: {
            beginAtZero: true
        }
    }
}
</script>

<template>
    <div class="chart-container">
        <Line
            :data="chartData"
            :options="chartOptions"
        />
    </div>
</template>

<style scoped>
.chart-container {
    height: 350px;
    padding: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
}
</style>
