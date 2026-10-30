import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const FEE_URL = '/fee';

export const feeApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getSpecializations: build.query({
            query: (params) => ({
                url: `${FEE_URL}/specializations`,
                method: 'GET',
                params,
            }),
            providesTags: [tagTypes.fees],
        }),
        createSpecialization: build.mutation({
            query: (data) => ({
                url: `${FEE_URL}/specializations`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),
        updateSpecialization: build.mutation({
            query: ({ id, data }) => ({
                url: `${FEE_URL}/specializations/${id}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),

        getConsultationServices: build.query({
            query: (params) => ({
                url: `${FEE_URL}/services`,
                method: 'GET',
                params,
            }),
            providesTags: [tagTypes.fees],
        }),
        createConsultationService: build.mutation({
            query: (data) => ({
                url: `${FEE_URL}/services`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),
        updateConsultationService: build.mutation({
            query: ({ id, data }) => ({
                url: `${FEE_URL}/services/${id}`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),

        getSpecializationFees: build.query({
            query: (params) => ({
                url: `${FEE_URL}/specialization-fees`,
                method: 'GET',
                params,
            }),
            providesTags: [tagTypes.fees],
        }),
        setSpecializationFee: build.mutation({
            query: (data) => ({
                url: `${FEE_URL}/specialization-fees`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),

        getDoctorFees: build.query({
            query: (doctorId) => ({
                url: `${FEE_URL}/doctor-fees/${doctorId}`,
                method: 'GET',
            }),
            providesTags: [tagTypes.fees],
        }),
        setDoctorFee: build.mutation({
            query: (data) => ({
                url: `${FEE_URL}/doctor-fees`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),

        createFeeChangeRequest: build.mutation({
            query: (data) => ({
                url: `${FEE_URL}/change-requests`,
                method: 'POST',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),
        getMyFeeChangeRequests: build.query({
            query: () => ({
                url: `${FEE_URL}/change-requests/my`,
                method: 'GET',
            }),
            providesTags: [tagTypes.fees],
        }),
        getAllFeeChangeRequests: build.query({
            query: (params) => ({
                url: `${FEE_URL}/change-requests`,
                method: 'GET',
                params,
            }),
            providesTags: [tagTypes.fees],
        }),
        reviewFeeChangeRequest: build.mutation({
            query: ({ id, data }) => ({
                url: `${FEE_URL}/change-requests/${id}/review`,
                method: 'PATCH',
                data,
            }),
            invalidatesTags: [tagTypes.fees],
        }),

        calculateConsultationFee: build.query({
            query: (params) => ({
                url: `${FEE_URL}/calculate`,
                method: 'GET',
                params,
            }),
        }),
    }),
});

export const {
    useGetSpecializationsQuery,
    useCreateSpecializationMutation,
    useUpdateSpecializationMutation,
    useGetConsultationServicesQuery,
    useCreateConsultationServiceMutation,
    useUpdateConsultationServiceMutation,
    useGetSpecializationFeesQuery,
    useSetSpecializationFeeMutation,
    useGetDoctorFeesQuery,
    useSetDoctorFeeMutation,
    useCreateFeeChangeRequestMutation,
    useGetMyFeeChangeRequestsQuery,
    useGetAllFeeChangeRequestsQuery,
    useReviewFeeChangeRequestMutation,
    useCalculateConsultationFeeQuery,
    useLazyCalculateConsultationFeeQuery,
} = feeApi;

