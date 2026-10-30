import express, { NextFunction, Request, Response } from 'express';
import { auth } from '../../middlewares/auth';
import { AuthUser } from '../../../enums';
import { BlogController } from './blog.controller';
import { CloudinaryHelper } from '../../../helpers/uploadHelper';

const router = express.Router();
router.post('/',
    auth(AuthUser.DOCTOR),
    CloudinaryHelper.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        return BlogController.createBlog(req, res, next);
    });
router.get('/', BlogController.getAllBlogs);
router.get('/:id', BlogController.getBlog);
router.delete('/:id', auth(AuthUser.DOCTOR, AuthUser.ADMIN), BlogController.deleteBlog);
router.patch('/:id',
    auth(AuthUser.DOCTOR, AuthUser.ADMIN),
    CloudinaryHelper.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        return BlogController.updateBlog(req, res, next);
    }
)

export const BlogRoutes = router;