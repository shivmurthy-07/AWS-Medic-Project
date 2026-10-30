import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { Blogs, Prisma } from "@prisma/client";
import { IBlogFilters, blogSearchablFields } from "./blog.interface";
import calculatePagination, { IOption } from "../../../shared/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { Request } from "express";
import { IUpload } from "../../../interfaces/file";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";
import { parseJsonPayload, uuidSchema, validatePayload } from "../../../helpers/validation";
import { blogListQuerySchema, createBlogSchema, updateBlogSchema } from "./blog.validation";

const createBlog = async (req: Request): Promise<Blogs> => {
    const user = req.user as any;
    const file = req.file as IUpload;
    const data: Prisma.BlogsUncheckedCreateInput = {
        ...validatePayload(createBlogSchema, parseJsonPayload(req.body.data)),
        userId: user.userId,
    };

    const isUserExist = await prisma.doctor.findUnique({
        where: {
            id: user.userId
        }
    })
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    data.userId = isUserExist.id;
    if (file) {
        const uploadImage = await CloudinaryHelper.uploadFile(file);
        if (uploadImage) {
            data.img = uploadImage.secure_url;
        } else {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to Updated Image');
        }
    }
    return await prisma.blogs.create({ data });
}

const getAllBlogs = async (filters: IBlogFilters, options: IOption): Promise<IGenericResponse<Blogs[]>> => {
    const validatedFiltersAndOptions = validatePayload(blogListQuerySchema, { ...filters, ...options });
    filters = {
        searchTerm: validatedFiltersAndOptions.searchTerm,
        title: validatedFiltersAndOptions.title,
        description: validatedFiltersAndOptions.description,
    };
    options = {
        limit: validatedFiltersAndOptions.limit,
        page: validatedFiltersAndOptions.page,
        sortBy: validatedFiltersAndOptions.sortBy,
        sortOrder: validatedFiltersAndOptions.sortOrder,
    };
    const { limit, page, skip } = calculatePagination(options);
    const { searchTerm, ...filterData } = filters;

    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            OR: blogSearchablFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    };
    const cleanFilterEntries = Object.entries(filterData).filter(([_, value]) => value !== undefined && value !== null && value !== '');
    if (cleanFilterEntries.length > 0) {
        andConditions.push({
            AND: cleanFilterEntries.map(([key, value]) => ({
                [key]: { equals: value }
            }))
        });
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.blogs.findMany({
        skip,
        take: limit,
        where: whereConditions,
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    designation: true
                }
            }
        },
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        }
    })
    const total = await prisma.blogs.count({ where: whereConditions });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    }
}

const getBlog = async (id: string): Promise<Blogs | null> => {
    id = validatePayload(uuidSchema, id);
    const result = await prisma.blogs.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    designation: true
                }
            }
        }
    });
    return result;
}

const deleteBlog = async (id: string, user: any): Promise<Blogs | null> => {
    id = validatePayload(uuidSchema, id);
    const blog = await prisma.blogs.findUnique({ where: { id }, select: { userId: true } });
    if (!blog) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Blog was not found.');
    }
    if (user.role !== 'admin' && blog.userId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to delete this blog.');
    }
    const result = await prisma.blogs.delete({
        where: { id }
    });
    return result;
}

const updateBlog = async (req: Request): Promise<Blogs | null> => {
    const file = req.file as IUpload;
    const id = validatePayload(uuidSchema, req.params.id);
    const blogData: Prisma.BlogsUpdateInput = validatePayload(updateBlogSchema, parseJsonPayload(req.body.data));
    const user = req.user as any;
    const existingBlog = await prisma.blogs.findUnique({ where: { id }, select: { userId: true } });
    if (!existingBlog) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Blog was not found.');
    }
    if (user.role !== 'admin' && existingBlog.userId !== user.userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorised to update this blog.');
    }
    if (file) {
        const uploadImage = await CloudinaryHelper.uploadFile(file);
        if (uploadImage) {
            blogData.img = uploadImage.secure_url;
        } else {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to Updated Image');
        }
    }
    const result = await prisma.blogs.update({
        where: { id },
        data: blogData
    });
    return result;
}

export const BlogService = {
    createBlog,
    getAllBlogs,
    getBlog,
    deleteBlog,
    updateBlog
}