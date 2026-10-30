import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";

const REPORT_URL = '/medical-reports';

export const medicalReportApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getDoctorReports: build.query({
            query: () => ({
                url: `${REPORT_URL}/doctor`,
                method: 'GET'
            }),
            providesTags: [tagTypes.reports]
        }),
        getPatientReports: build.query({
            query: (params) => ({
                url: `${REPORT_URL}/patient`,
                method: 'GET',
                params: params || {}
            }),
            providesTags: [tagTypes.reports]
        }),
        getPatientReportsByDoctor: build.query({
            query: (patientId) => ({
                url: `${REPORT_URL}/patient/${patientId}`,
                method: 'GET'
            }),
            providesTags: [tagTypes.reports]
        }),
        getSingleReport: build.query({
            query: (id) => ({
                url: `${REPORT_URL}/${id}`,
                method: 'GET'
            }),
            providesTags: [tagTypes.reports]
        }),
        uploadReportFile: build.mutation({
            query: (formData) => ({
                url: `${REPORT_URL}/upload`,
                method: 'POST',
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }),
        }),
        createMedicalReport: build.mutation({
            query: (data) => ({
                url: `${REPORT_URL}/create`,
                method: 'POST',
                data: data
            }),
            invalidatesTags: [tagTypes.reports]
        }),
        updateMedicalReport: build.mutation({
            query: ({ id, data }) => ({
                url: `${REPORT_URL}/${id}`,
                method: 'PATCH',
                data: data
            }),
            invalidatesTags: [tagTypes.reports]
        }),
        deleteMedicalReport: build.mutation({
            query: (id) => ({
                url: `${REPORT_URL}/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: [tagTypes.reports]
        }),
    })
});

export const {
    useGetDoctorReportsQuery,
    useGetPatientReportsQuery,
    useGetPatientReportsByDoctorQuery,
    useGetSingleReportQuery,
    useUploadReportFileMutation,
    useCreateMedicalReportMutation,
    useUpdateMedicalReportMutation,
    useDeleteMedicalReportMutation
} = medicalReportApi;
