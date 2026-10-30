import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserInfo } from '../../service/auth.service';
import {
    FaRobot,
    FaComments,
    FaPaperPlane,
    FaTimes,
    FaRedo,
    FaUser,
    FaExclamationTriangle,
    FaStethoscope,
    FaCalendarAlt,
    FaFileMedical,
    FaRupeeSign,
} from 'react-icons/fa';
import { useSendChatMessageMutation } from '../../redux/api/chatbotApi';
import defaultAvatar from '../../images/avatar.jpg';
import './MediBot.css';

const INITIAL_QUICK_REPLIES = [
    '🩺 Find a Doctor',
    '📅 How to Book',
    '📑 View Medical Reports',
    '💳 Consultation Fees',
    '🦷 Dental Specialists',
    '❤️ Heart & Cardiology',
    '🚨 Emergency Help',
];

const INITIAL_MESSAGES = [
    {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Hello! I'm MediBot, your MediConnect Healthcare Assistant.**\n\nI can help you find verified doctors, check consultation fees, guide you through booking appointments, or locate your diagnostic reports.\n\nHow can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: INITIAL_QUICK_REPLIES,
    },
];

const MediBot = () => {
    const location = useLocation();
    const userInfo = getUserInfo();
    const isPatient = userInfo?.role === 'patient';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen, messages]);

    // Strictly restrict MediBot only to the patient module
    if (!isPatient) {
        return null;
    }

    const handleSend = async (textToSend) => {
        const text = (textToSend || inputValue).trim();
        if (!text || isLoading) return;

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');

        try {
            const res = await sendChatMessage({ message: text }).unwrap();
            // Handle both unwrapped and wrapped payloads safely
            const data = (res && typeof res === 'object' && res.reply)
                ? res
                : (res?.data?.reply ? res.data : (res?.data || res || {}));

            const botMsg = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: data.reply || `I received your question about "${text}". You can explore our verified doctors or view your patient dashboard below:`,
                isEmergency: Boolean(data.isEmergency),
                doctors: Array.isArray(data.doctors) ? data.doctors : [],
                actions: Array.isArray(data.actions) ? data.actions : [],
                quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies : [],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            console.error('Chatbot API error:', err);
            // Intelligent client fallback matching project features
            const lower = text.toLowerCase();
            let fallbackReply = `As your MediConnect Assistant, I can help you find specialists, view diagnostic reports, or book appointments.`;
            let doctors = [];
            let actions = [
                { label: 'Browse Doctors', link: '/doctors', type: 'primary' },
                { label: 'Patient Dashboard', link: '/dashboard', type: 'secondary' },
            ];

            if (lower.includes('doctor') || lower.includes('list')) {
                fallbackReply = `👨‍⚕️ **MediConnect Doctors:**\n\nWe have 22 verified specialists across 18 medical disciplines ready for consultation. You can browse the full directory below:`;
                actions = [{ label: 'View All Doctors', link: '/doctors', type: 'primary' }];
            } else if (lower.includes('heart') || lower.includes('cardio')) {
                fallbackReply = `Cardiology consultations are available with our Senior Interventional Cardiologists. You can book an in-person or online appointment right away.`;
                actions = [{ label: 'Find Cardiologists', link: '/doctors?specialist=Cardiology', type: 'primary' }];
            } else if (lower.includes('dental') || lower.includes('tooth')) {
                fallbackReply = `Our dental surgeons specialize in painless root canals, smile makeovers, and cosmetic dentistry.`;
                actions = [{ label: 'Find Dentists', link: '/doctors?specialist=Dentistry', type: 'primary' }];
            } else if (lower.includes('report') || lower.includes('xray') || lower.includes('lab')) {
                fallbackReply = `Your digital X-Rays, MRIs, and blood test reports are available in your Patient Dashboard.`;
                actions = [
                    { label: 'X-Ray & Imaging', link: '/dashboard/imaging-reports', type: 'primary' },
                    { label: 'Laboratory Reports', link: '/dashboard/lab-reports', type: 'secondary' },
                ];
            } else if (lower.includes('fee') || lower.includes('price')) {
                fallbackReply = `Consultation fees are dynamic based on specialty: routine checkups (₹350-₹600), specialist initial consultations (₹600-₹1200), and super-specialty visits (₹800-₹1800).`;
                actions = [{ label: 'Browse Doctors & Fees', link: '/doctors', type: 'primary' }];
            }

            const fallbackMsg = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: fallbackReply,
                doctors,
                actions,
                quickReplies: ['👨‍⚕️ Doctors List', 'Book Appointment', 'Medical Reports', 'Consultation Fees'],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, fallbackMsg]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickReply = (reply) => {
        handleSend(reply);
    };

    const handleActionClick = (link) => {
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
            setIsOpen(false);
        }
    };

    const handleResetChat = () => {
        setMessages(INITIAL_MESSAGES);
    };

    const formatContent = (content) => {
        return content.split('\n').map((line, idx) => {
            // Bold parser: **text**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={idx} style={{ marginBottom: line.trim() === '' ? '8px' : '3px' }}>
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </div>
            );
        });
    };

    const activeQuickReplies = messages[messages.length - 1]?.quickReplies || INITIAL_QUICK_REPLIES;

    return (
        <>
            {/* Floating Action Button */}
            <button
                className="medibot-fab"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open MediConnect AI Healthcare Assistant"
                title="Chat with MediBot AI Assistant"
            >
                {isOpen ? <FaTimes /> : <FaRobot />}
                <span className="medibot-fab__badge" />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="medibot-window" role="dialog" aria-label="MediBot Health Assistant">
                    {/* Header */}
                    <div className="medibot-header">
                        <div className="medibot-header__info">
                            <div className="medibot-header__avatar">
                                <FaRobot />
                            </div>
                            <div>
                                <h3 className="medibot-header__title">MediBot Assistant</h3>
                                <p className="medibot-header__status">
                                    <span className="medibot-header__status-dot" />
                                    Healthcare AI · Online
                                </p>
                            </div>
                        </div>
                        <div className="medibot-header__actions">
                            <button
                                className="medibot-header__btn"
                                onClick={handleResetChat}
                                title="Reset conversation"
                            >
                                <FaRedo />
                            </button>
                            <button
                                className="medibot-header__btn"
                                onClick={() => setIsOpen(false)}
                                title="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="medibot-body">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`medibot-msg medibot-msg--${msg.role === 'user' ? 'user' : 'bot'}`}
                            >
                                <div className="medibot-msg__avatar">
                                    {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                                </div>
                                <div className="medibot-msg__bubble">
                                    {formatContent(msg.content)}

                                    {/* Emergency Alert Box */}
                                    {msg.isEmergency && (
                                        <div className="medibot-emergency">
                                            <FaExclamationTriangle style={{ marginRight: '6px' }} />
                                            <strong>Emergency Warning:</strong> If someone is in immediate danger or
                                            unresponsive, call <strong>112 / 108</strong> without delay!
                                        </div>
                                    )}

                                    {/* Recommended Doctor Cards */}
                                    {msg.doctors && msg.doctors.length > 0 && (
                                        <div style={{ marginTop: '10px' }}>
                                            {msg.doctors.map((doc) => (
                                                <div key={doc.id} className="medibot-doc-card">
                                                    <img
                                                        src={doc.img || defaultAvatar}
                                                        alt={doc.name}
                                                        className="medibot-doc-card__img"
                                                        onError={(e) => {
                                                            e.target.src = defaultAvatar;
                                                        }}
                                                    />
                                                    <div className="medibot-doc-card__info">
                                                        <h4 className="medibot-doc-card__name">{doc.name}</h4>
                                                        <p className="medibot-doc-card__spec">
                                                            {doc.specialization} · {doc.degree || 'MD'}
                                                        </p>
                                                        {doc.clinicName && (
                                                            <p className="medibot-doc-card__clinic">
                                                                🏥 {doc.clinicName}
                                                            </p>
                                                        )}
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                marginTop: '4px',
                                                            }}
                                                        >
                                                            <span className="medibot-doc-card__fee">
                                                                ₹{doc.price || '500'}
                                                            </span>
                                                            <button
                                                                className="medibot-doc-card__btn"
                                                                onClick={() => handleActionClick(`/booking/${doc.id}`)}
                                                            >
                                                                Book Now
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Link Buttons */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="medibot-actions">
                                            {msg.actions.map((act, aIdx) => (
                                                <button
                                                    key={aIdx}
                                                    className={`medibot-action-btn medibot-action-btn--${act.type || 'primary'}`}
                                                    onClick={() => handleActionClick(act.link)}
                                                >
                                                    {act.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="medibot-msg__time">{msg.timestamp}</div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Animation */}
                        {isLoading && (
                            <div className="medibot-msg medibot-msg--bot">
                                <div className="medibot-msg__avatar">
                                    <FaRobot />
                                </div>
                                <div className="medibot-msg__bubble">
                                    <div className="medibot-typing">
                                        <span className="medibot-typing__dot" />
                                        <span className="medibot-typing__dot" />
                                        <span className="medibot-typing__dot" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies Chips */}
                    {activeQuickReplies && activeQuickReplies.length > 0 && (
                        <div className="medibot-quick-replies">
                            {activeQuickReplies.map((qr, qIdx) => (
                                <button
                                    key={qIdx}
                                    className="medibot-chip"
                                    onClick={() => handleQuickReply(qr)}
                                    disabled={isLoading}
                                >
                                    {qr}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="medibot-footer">
                        <form
                            className="medibot-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                className="medibot-input"
                                placeholder="Ask about symptoms, doctors, fees..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="medibot-send-btn"
                                disabled={!inputValue.trim() || isLoading}
                                title="Send message"
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                        <p className="medibot-disclaimer">
                            MediBot is for informational & scheduling help. In an emergency, please dial 112 / 108.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default MediBot;

