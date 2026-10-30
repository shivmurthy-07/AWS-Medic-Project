import { baseApi } from './baseApi';

export const chatbotApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        sendChatMessage: build.mutation({
            query: (data) => ({
                url: '/chatbot/message',
                method: 'POST',
                data,
            }),
        }),
    }),
});

export const { useSendChatMessageMutation } = chatbotApi;

