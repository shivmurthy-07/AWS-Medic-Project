import { baseApi } from './baseApi';
import { tagTypes } from '../tag-types';

const SUPER_ADMIN_URL = '/super-admin';

export const superAdminApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getSuperAdminDashboard: build.query({
            query: () => ({ url: `${SUPER_ADMIN_URL}/dashboard`, method: 'GET' }),
            transformResponse: (response) => response || {},
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminDoctors: build.query({
            query: (params) => ({ url: `${SUPER_ADMIN_URL}/doctors`, method: 'GET', params }),
            transformResponse: (response) => ({
                doctors: Array.isArray(response) ? response : response?.data || [],
                meta: response?.meta || { total: 0 },
            }),
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminDoctor: build.query({
            query: (id) => ({ url: `${SUPER_ADMIN_URL}/doctors/${id}`, method: 'GET' }),
            transformResponse: (response) => response,
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminPatients: build.query({
            query: (params) => ({ url: `${SUPER_ADMIN_URL}/patients`, method: 'GET', params }),
            transformResponse: (response) => ({
                patients: Array.isArray(response) ? response : response?.data || [],
                meta: response?.meta || { total: 0 },
            }),
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminUsers: build.query({
            query: (params) => ({ url: `${SUPER_ADMIN_URL}/users`, method: 'GET', params }),
            transformResponse: (response) => ({
                users: Array.isArray(response) ? response : response?.data || [],
                meta: response?.meta || { total: 0 },
            }),
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminAppointments: build.query({
            query: (params) => ({ url: `${SUPER_ADMIN_URL}/appointments`, method: 'GET', params }),
            transformResponse: (response) => ({
                appointments: Array.isArray(response) ? response : response?.data || [],
                meta: response?.meta || { total: 0 },
            }),
            providesTags: [tagTypes.superAdmin],
        }),
        getSuperAdminActivityLogs: build.query({
            query: (params) => ({ url: `${SUPER_ADMIN_URL}/activity-logs`, method: 'GET', params }),
            transformResponse: (response) => ({
                logs: Array.isArray(response) ? response : response?.data || [],
                meta: response?.meta || { total: 0 },
            }),
            providesTags: [tagTypes.superAdmin],
        }),
        changeSuperAdminDoctorStatus: build.mutation({
            query: ({ id, action, reason }) => ({
                url: `${SUPER_ADMIN_URL}/doctors/${id}/${action}`,
                method: 'PATCH',
                data: action === 'reject' ? { reason } : {},
            }),
            invalidatesTags: [tagTypes.superAdmin],
        }),
        changeSuperAdminPatientStatus: build.mutation({
            query: ({ id, isActive }) => ({
                url: `${SUPER_ADMIN_URL}/patients/${id}/status`,
                method: 'PATCH',
                data: { isActive },
            }),
            invalidatesTags: [tagTypes.superAdmin],
        }),
        changeSuperAdminUserRole: build.mutation({
            query: ({ id, role }) => ({
                url: `${SUPER_ADMIN_URL}/users/${id}/role`,
                method: 'PATCH',
                data: { role },
            }),
            invalidatesTags: [tagTypes.superAdmin],
        }),
        superAdminLogout: build.mutation({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
    }),
});

export const {
    useGetSuperAdminDashboardQuery,
    useGetSuperAdminDoctorsQuery,
    useGetSuperAdminDoctorQuery,
    useGetSuperAdminPatientsQuery,
    useGetSuperAdminUsersQuery,
    useGetSuperAdminAppointmentsQuery,
    useGetSuperAdminActivityLogsQuery,
    useChangeSuperAdminDoctorStatusMutation,
    useChangeSuperAdminPatientStatusMutation,
    useChangeSuperAdminUserRoleMutation,
    useSuperAdminLogoutMutation,
} = superAdminApi;
