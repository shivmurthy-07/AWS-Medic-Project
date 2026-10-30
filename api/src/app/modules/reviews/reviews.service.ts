import { Reviews } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import calculatePagination, { IOption } from "../../../shared/paginationHelper";
import { validatePayload, uuidSchema } from "../../../helpers/validation";
import { createReviewSchema, reviewListQuerySchema, reviewReplySchema, updateReviewSchema } from "./reviews.validation";

const create = async (user: any, payload: Reviews): Promise<Reviews> => {
    payload = validatePayload(createReviewSchema, payload) as Reviews;
    const isUserExist = await prisma.patient.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }
    const isDoctorExist = await prisma.doctor.findUnique({
        where: {
            id: payload.doctorId
        }
    })
    if(isUserExist){
        payload.patientId = isUserExist.id;
    }
    if (!isDoctorExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const result = await prisma.reviews.create({
        data: payload
    })
    return result
}

const getAllReviews = async (options: IOption): Promise<Reviews[] | null> => {
    const validatedOptions = validatePayload(reviewListQuerySchema, options);
    const { limit, skip } = calculatePagination(validatedOptions);
    const result = await prisma.reviews.findMany({
        skip,
        take: limit,
        include: {
            doctor: {
                select: {
                    firstName: true,
                    lastName: true,
                    img: true
                }
            },
            patient: {
                select: {
                    firstName: true,
                    lastName: true,
                    img: true
                }
            }
        }
    });
    return result;
}

const getSingleReview = async (id: string): Promise<Reviews | null> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.reviews.findUnique({
        where: {
            id: id
        },
        include: {
            doctor: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            patient: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
    return result;
}

const getDoctorReviews = async (id: string): Promise<Reviews[] | null> => {
    if (!id || id === 'undefined' || id === 'null') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Valid doctor ID is required to fetch reviews.');
    }
    id = validatePayload(uuidSchema, id);
    const isUserExist = await prisma.doctor.findUnique({
        where: {
            id: id
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const result = await prisma.reviews.findMany({
        where: {
            doctorId: isUserExist.id
        },
        include: {
            doctor: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            patient: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
    return result;
}

const deleteReviews = async (id: string): Promise<Reviews> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.reviews.delete({
        where: {
            id: id
        }
    });
    return result;
}

const updateReview = async (id: string, payload: Partial<Reviews>): Promise<Reviews> => {
    id = validatePayload(uuidSchema, id);
    payload = validatePayload(updateReviewSchema, payload) as Partial<Reviews>;
    const result = await prisma.reviews.update({
        data: payload,
        where: {
            id: id
        }
    })
    return result;
}

const replyReviewByDoctor = async (user: any, id: string, payload: Partial<Reviews>): Promise<Reviews> => {
    id = validatePayload(uuidSchema, id);
    const { response } = validatePayload(reviewReplySchema, payload);
    const isUserExist = await prisma.doctor.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const review = await prisma.reviews.findUnique({
        where: { id },
        select: { doctorId: true }
    });
    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Review was not found.');
    }
    if (review.doctorId !== isUserExist.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to reply to this review.');
    }

    const result = await prisma.reviews.update({
        data: {
            response
        },
        where: {
            id: id
        }
    })
    return result;
}


export const ReviewService = {
    create,
    getAllReviews,
    getDoctorReviews,
    deleteReviews,
    updateReview,
    getSingleReview,
    replyReviewByDoctor
}