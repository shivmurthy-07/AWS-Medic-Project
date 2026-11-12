import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout/DashboardLayout';
import {
    useCreateReviewMutation,
    useGetDoctorReviewsQuery,
    useGetPatientReviewsQuery,
} from '../../../redux/api/reviewsApi';
import { useGetPatientAppointmentsQuery } from '../../../redux/api/appointmentApi';
import { useGetDoctorsQuery } from '../../../redux/api/doctorApi';
import useAuthCheck from '../../../redux/hooks/useAuthCheck';
import { getUserInfo } from '../../../service/auth.service';
import {
    Card,
    Avatar,
    Rate,
    Tag,
    Empty,
    Spin,
    Input,
    Select,
    Button,
    Radio,
    Space,
    message,
} from 'antd';
import { FaThumbsUp, FaThumbsDown, FaStar, FaSearch, FaUserMd, FaPaperPlane } from 'react-icons/fa';
import moment from 'moment';
import './Reviews.css';

const { TextArea } = Input;
const RATING_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const DoctorReviews = () => {
    const { data: loginInfo } = useAuthCheck();
    const auth = getUserInfo();
    const doctorId = loginInfo?.id || auth?.userId;
    const { data, isError, isLoading } = useGetDoctorReviewsQuery(doctorId, { skip: !doctorId });
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');

    const filteredReviews = data?.filter((review) => {
        const patientName = `${review?.patient?.firstName || ''} ${review?.patient?.lastName || ''}`.toLowerCase();
        const matchesSearch = patientName.includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter === 'all' || Number(review?.star) === parseInt(ratingFilter, 10);
        return matchesSearch && matchesRating;
    });

    const averageRating = data?.length
        ? (data.reduce((sum, review) => sum + (Number(review?.star) || 0), 0) / data.length).toFixed(1)
        : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: data?.filter((r) => Number(r?.star) === star)?.length || 0,
        percentage: data?.length
            ? (((data?.filter((r) => Number(r?.star) === star)?.length || 0) / data.length) * 100).toFixed(0)
            : 0,
    }));

    const stats = [
        {
            title: 'Total Reviews',
            count: data?.length || 0,
            color: 'primary',
        },
        {
            title: 'Average Rating',
            count: averageRating,
            icon: <FaStar />,
            color: 'warning',
        },
        {
            title: 'Recommended',
            count: data?.filter((r) => r?.isRecommended)?.length || 0,
            color: 'success',
        },
    ];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="text-center p-5">
                    <Spin size="large" />
                </div>
            </DashboardLayout>
        );
    }

    if (isError) {
        return (
            <DashboardLayout>
                <Card>
                    <Empty description="Something went wrong loading reviews" />
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Patient Reviews</h3>
                </div>

                <div className="stats-mini-grid mb-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className={`stat-mini-card stat-mini-card-${stat.color}`}>
                            <div className="stat-mini-details">
                                <div className="stat-mini-title">{stat.title}</div>
                                <div className="stat-mini-count">
                                    {stat.icon && <span className="me-2">{stat.icon}</span>}
                                    {stat.count}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card className="mb-4">
                    <h5 className="mb-3">Rating Distribution</h5>
                    {ratingDistribution.map((item) => (
                        <div key={item.star} className="rating-bar-container mb-2">
                            <span className="rating-star">{item.star} <FaStar className="text-warning" /></span>
                            <div className="rating-bar">
                                <div
                                    className="rating-bar-fill"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                            <span className="rating-count">{item.count}</span>
                        </div>
                    ))}
                </Card>

                <Card>
                    <div className="table-toolbar mb-4">
                        <Input
                            placeholder="Search by patient name..."
                            prefix={<FaSearch />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Select
                            value={ratingFilter}
                            onChange={setRatingFilter}
                            style={{ width: 150 }}
                        >
                            <Select.Option value="all">All Ratings</Select.Option>
                            <Select.Option value="5">5 Stars</Select.Option>
                            <Select.Option value="4">4 Stars</Select.Option>
                            <Select.Option value="3">3 Stars</Select.Option>
                            <Select.Option value="2">2 Stars</Select.Option>
                            <Select.Option value="1">1 Star</Select.Option>
                        </Select>
                    </div>

                    {filteredReviews?.length === 0 ? (
                        <Empty description="No reviews found" />
                    ) : (
                        <div className="reviews-list">
                            {filteredReviews?.map((review) => (
                                <div key={review?.id} className="review-card">
                                    <div className="review-header">
                                        <div className="d-flex align-items-center">
                                            <Avatar
                                                src={review?.patient?.img}
                                                size={50}
                                            />
                                            <div className="ms-3">
                                                <h6 className="mb-1">
                                                    {review?.patient?.firstName} {review?.patient?.lastName}
                                                </h6>
                                                <div className="text-muted small">
                                                    {moment(review?.createdAt).format('MMM DD, YYYY')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <Rate disabled value={Number(review?.star) || 0} style={{ fontSize: 16 }} />
                                            <div className="mt-2">
                                                <Tag
                                                    color={review?.isRecommended ? 'success' : 'error'}
                                                    icon={review?.isRecommended ? <FaThumbsUp /> : <FaThumbsDown />}
                                                >
                                                    {review?.isRecommended ? 'Recommended' : 'Not Recommended'}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="review-body">
                                        <p className="mb-0">{review?.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

const PatientReviews = () => {
    const [searchParams] = useSearchParams();
    const initialDoctorId = searchParams.get('doctorId') || undefined;

    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
    const [rating, setRating] = useState(5);
    const [isRecommended, setIsRecommended] = useState(true);
    const [description, setDescription] = useState('');

    const { data: myReviews = [], isLoading: reviewsLoading, refetch } = useGetPatientReviewsQuery();
    const { data: appointments = [] } = useGetPatientAppointmentsQuery({});
    const { data: doctorsResponse } = useGetDoctorsQuery({ limit: 100 });
    const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

    useEffect(() => {
        if (initialDoctorId) {
            setSelectedDoctorId(initialDoctorId);
        }
    }, [initialDoctorId]);

    const doctorOptions = useMemo(() => {
        const optionMap = new Map();

        appointments.forEach((apt) => {
            const doc = apt?.doctor;
            if (!doc?.id || optionMap.has(doc.id)) return;
            const name = `Dr. ${[doc.firstName, doc.lastName].filter(Boolean).join(' ')}`.trim();
            const spec = doc.specialization ? ` — ${doc.specialization}` : '';
            optionMap.set(doc.id, {
                value: doc.id,
                label: `${name}${spec} (Consulted)`,
            });
        });

        (doctorsResponse?.doctors || []).forEach((doc) => {
            if (!doc?.id || optionMap.has(doc.id)) return;
            const name = `Dr. ${[doc.firstName, doc.lastName].filter(Boolean).join(' ')}`.trim();
            const spec = doc.specialization ? ` — ${doc.specialization}` : '';
            optionMap.set(doc.id, {
                value: doc.id,
                label: `${name}${spec}`,
            });
        });

        return Array.from(optionMap.values());
    }, [appointments, doctorsResponse]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDoctorId) {
            message.warning('Please select a doctor to review.');
            return;
        }
        if (!rating) {
            message.warning('Please select a star rating.');
            return;
        }
        const trimmed = description.trim();
        if (trimmed.length < 10) {
            message.warning('Please write at least 10 characters in your review.');
            return;
        }

        try {
            await createReview({
                data: {
                    doctorId: selectedDoctorId,
                    star: String(rating),
                    isRecommended,
                    description: trimmed,
                },
            }).unwrap();
            message.success('Thank you! Your review has been submitted.');
            setDescription('');
            setRating(5);
            setIsRecommended(true);
            refetch();
        } catch (err) {
            message.error(err?.data?.message || 'Unable to submit review. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="dashboard-card">
                <div className="dashboard-card-header mb-4">
                    <div>
                        <h3 className="dashboard-card-title mb-1">Doctor Reviews &amp; Feedback</h3>
                        <p className="text-muted small mb-0">
                            Share your experience with your healthcare provider and view the reviews you have submitted.
                        </p>
                    </div>
                </div>

                <Card className="mb-4" title="Write a Review">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Select Doctor</label>
                                <Select
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Choose a doctor you consulted"
                                    value={selectedDoctorId}
                                    onChange={setSelectedDoctorId}
                                    options={doctorOptions}
                                    style={{ width: '100%' }}
                                    size="large"
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold d-block">Your Rating</label>
                                <div className="d-flex align-items-center gap-3 pt-1">
                                    <Rate tooltips={RATING_LABELS} value={rating} onChange={setRating} style={{ fontSize: 22 }} />
                                    <span className="text-muted small fw-medium">
                                        {rating ? RATING_LABELS[rating - 1] : 'Select rating'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold d-block">Would you recommend this doctor?</label>
                                <Radio.Group
                                    value={isRecommended}
                                    onChange={(e) => setIsRecommended(e.target.value)}
                                >
                                    <Space size="large">
                                        <Radio value={true}>
                                            <FaThumbsUp className="text-success me-1" /> Yes, I recommend
                                        </Radio>
                                        <Radio value={false}>
                                            <FaThumbsDown className="text-danger me-1" /> No
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold">Your Review</label>
                                <TextArea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your consultation experience, doctor communication, and care quality (minimum 10 characters)..."
                                    maxLength={2000}
                                    showCount
                                />
                            </div>
                            <div className="col-12 d-flex justify-content-end">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<FaPaperPlane />}
                                    loading={isSubmitting}
                                >
                                    Submit Review
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                <Card title={`My Submitted Reviews (${myReviews.length})`}>
                    {reviewsLoading ? (
                        <div className="text-center p-4">
                            <Spin />
                        </div>
                    ) : myReviews.length === 0 ? (
                        <Empty description="You haven't submitted any reviews yet." />
                    ) : (
                        <div className="reviews-list">
                            {myReviews.map((review) => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <div className="d-flex align-items-center">
                                            <Avatar
                                                src={review?.doctor?.img}
                                                icon={<FaUserMd />}
                                                size={50}
                                            />
                                            <div className="ms-3">
                                                <h6 className="mb-1">
                                                    Dr. {review?.doctor?.firstName} {review?.doctor?.lastName}
                                                </h6>
                                                <div className="text-muted small">
                                                    {review?.doctor?.specialization || 'Specialist'} ·{' '}
                                                    {moment(review?.createdAt).format('MMM DD, YYYY')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <Rate disabled value={Number(review?.star) || 0} style={{ fontSize: 16 }} />
                                            <div className="mt-2">
                                                <Tag
                                                    color={review?.isRecommended ? 'success' : 'error'}
                                                    icon={review?.isRecommended ? <FaThumbsUp /> : <FaThumbsDown />}
                                                >
                                                    {review?.isRecommended ? 'Recommended' : 'Not Recommended'}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="review-body">
                                        <p className="mb-0">{review?.description}</p>
                                        {review?.response && (
                                            <div className="mt-3 p-2 rounded bg-white border-start border-3 border-success">
                                                <div className="small fw-semibold text-success">Doctor Response:</div>
                                                <div className="small text-muted">{review.response}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

const Reviews = () => {
    const { role } = useAuthCheck();
    return role === 'doctor' ? <DoctorReviews /> : <PatientReviews />;
};

export default Reviews;
