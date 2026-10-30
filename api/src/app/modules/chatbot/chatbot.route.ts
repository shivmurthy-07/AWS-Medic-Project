import express from 'express';
import { ChatbotController } from './chatbot.controller';

const router = express.Router();

router.post('/message', ChatbotController.handleMessage);

export const ChatbotRouter = router;

