import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const DOC_URL = '/doctor';

export const doctorApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getDoctors: build.query({
            query: (arg) => ({
                url: `${DOC_URL}`,
                method: 'GET',
                params: arg,
            }),
            transformResponse: (response) => {
                return {
                    doctors: response?.data || [],
                    meta: response?.meta || {},
                };
            },
            providesTags: [tagTypes.doctor],
        }),
        getDoctor: build.query({
            query: (id) => ({
                url: `${DOC_URL}/${id}`,
                method: 'GET',
            }),
            providesTags: [tagTypes.doctor],
        }),
        updateDoctor: build.mutation({
            query: ({ data, id }) => ({
                url: `${DOC_URL}/${id}`,
                method: 'PATCH',
                data: data,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        addDoctorEducation: build.mutation({
            query: (data) => ({
                url: `${DOC_URL}/education`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        deleteDoctorEducation: build.mutation({
            query: (eduId) => ({
                url: `${DOC_URL}/education/${eduId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        addDoctorExperience: build.mutation({
            query: (data) => ({
                url: `${DOC_URL}/experience`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        deleteDoctorExperience: build.mutation({
            query: (expId) => ({
                url: `${DOC_URL}/experience/${expId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        addDoctorAward: build.mutation({
            query: (data) => ({
                url: `${DOC_URL}/award`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
        deleteDoctorAward: build.mutation({
            query: (awardId) => ({
                url: `${DOC_URL}/award/${awardId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [tagTypes.doctor],
        }),
    }),
});

export const {
    useGetDoctorsQuery,
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useAddDoctorEducationMutation,
    useDeleteDoctorEducationMutation,
    useAddDoctorExperienceMutation,
    useDeleteDoctorExperienceMutation,
    useAddDoctorAwardMutation,
    useDeleteDoctorAwardMutation,
} = doctorApi;
