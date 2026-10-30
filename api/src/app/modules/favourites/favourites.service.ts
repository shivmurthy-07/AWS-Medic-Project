import { Favourites } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { validatePayload } from "../../../helpers/validation";
import { favouriteSchema } from "./favourites.validation";

const createFavourite = async (user: any, payload: Favourites): Promise<Favourites> => {
    const { doctorId } = validatePayload(favouriteSchema, payload);
    const isUserExist = await prisma.patient.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }
    const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, approvalStatus: true },
    });
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!');
    }
    if (doctor.approvalStatus !== 'APPROVED') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only approved doctors can be added to favourites.');
    }

    //check already have or not
    const isFavourite = await prisma.favourites.findFirst({
        where: {
            doctorId,
            patientId: isUserExist.id,
        }
    });

    if (isFavourite) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AllReady doctor is Favourite !!')
    } else {
        const favourites = await prisma.favourites.create({
            data: { doctorId, patientId: isUserExist.id }
        });
        return favourites;
    }
}
const removeFavourite = async (user: any, payload: Favourites): Promise<Favourites> => {
    const { doctorId } = validatePayload(favouriteSchema, payload);
    const isUserExist = await prisma.patient.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }

    //check already have or not
    const isFavourite = await prisma.favourites.findFirst({
        where: {
            doctorId,
            patientId: isUserExist.id,
        }
    });
    if(!isFavourite){
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor is not in Favourite !!')
    }else{
        const favourites = await prisma.favourites.delete({
            where: {
                id: isFavourite.id
            }
        })
        return favourites;
    }
}

const getPatientFavourites = async (user: any): Promise<Favourites[]> => {
    const isUserExist = await prisma.patient.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient Account is not found !!')
    }

    const favourites = await prisma.favourites.findMany({
        where: {
            patientId: isUserExist.id
        },
        include: {
            doctor: true
        }
    })
    return favourites;
}


export const FavouritesService = {
    createFavourite,
    removeFavourite,
    getPatientFavourites
}