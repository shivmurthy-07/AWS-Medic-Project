import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi"

const ADMIN_URL = '/admin'

export const adminApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getAdminStats: build.query({
            query: () => ({
                url: `${ADMIN_URL}/stats`,
                method: 'GET'
            }),
            providesTags: [tagTypes.admin]
        }),
        getAllAppointments: build.query({
            query: (arg) => ({
                url: `/appointment`,
                method: 'GET',
                params: arg
            }),
            transformResponse: (response) => {
                const appointments = Array.isArray(response) ? response : response?.data || [];
                return {
                    appointments,
                    meta: response?.meta || { total: appointments.length }
                };
            },
            providesTags: [tagTypes.appointments]
        }),
        getAllPatients: build.query({
            query: (arg) => ({
                url: `/patient`,
                method: 'GET',
                params: arg
            }),
            transformResponse: (response) => {
                const patients = Array.isArray(response) ? response : response?.data || [];
                return {
                    patients,
                    meta: response?.meta || { total: patients.length }
                };
            },
            providesTags: [tagTypes.patient]
        }),
    })
})

export const { 
    useGetAdminStatsQuery,
    useGetAllAppointmentsQuery,
    useGetAllPatientsQuery
} = adminApi;

export { useUpdateAppointmentMutation } from './appointmentApi';
