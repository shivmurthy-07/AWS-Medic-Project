import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { ChatbotService } from './chatbot.service';

const handleMessage = catchAsync(async (req: Request, res: Response) => {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'A message string is required.',
        });
    }

    const result = await ChatbotService.processChatMessage(message, history);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Chatbot response generated successfully.',
        data: result,
    });
});

export const ChatbotController = {
    handleMessage,
};

