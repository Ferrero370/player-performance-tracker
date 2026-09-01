import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import TeamsView from '../views/TeamsView.vue'
import PlayersView from '../views/PlayersView.vue'
import PlayerProfileView from '../views/PlayerProfileView.vue'
import MatchesView from '../views/MatchesView.vue'
import MainLayout from '../components/MainLayout.vue'

const router = createRouter({
    history: createWebHistory(),

    routes: [
        {
            path: '/login',
            component: LoginView
        },

        {
            path: '/',
            component: MainLayout,
            meta: { requiresAuth: true },

            children: [
                {
                    path: '',
                    redirect: '/dashboard'
                },
                {
                    path: 'dashboard',
                    component: DashboardView
                },
                {
                    path: 'teams',
                    component: TeamsView
                },
                {
                    path: 'players',
                    component: PlayersView
                },
                {
                    path: 'players/:id',
                    component: PlayerProfileView
                },
                {
                    path: 'matches',
                    component: MatchesView
                }
            ]
        }
    ]
})

router.beforeEach((to) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        return '/login'
    }

    if (to.path === '/login' && token) {
        return '/dashboard'
    }

    return true
})

export default router