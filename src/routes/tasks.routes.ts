import { Router,Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { verifyAccess } from "./admin.routes";
import { createTaskSchema } from "../schema/tasksSchema";
import { TasksController } from "../controller/tasks.controller";

export const tasksRouter = Router()

///Admin & Owner Endpoints 

tasksRouter.post('/admin/create',verifyAccess,
    (req: Request, res: Response, next: NextFunction) => {
        const result = createTaskSchema.safeParse(req.body);
    
if (!result.success) {
 return res.status(400).json({ errors: result.error.issues });
}
    
 req.body = result.data;
 next()},TasksController.createTask)

tasksRouter.get('/admin/projects/active',verifyAccess,TasksController.getProjects)
tasksRouter.get('/member/projects/active',verifyAccess,TasksController.getProjectsMember)
tasksRouter.patch('/member/projects/change-status',verifyAccess,TasksController.changeStatus)
