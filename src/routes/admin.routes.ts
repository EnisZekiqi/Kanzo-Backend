import { Router,Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { AdminController } from "../controller/admin.controller";
import { createProjectSchema, editProjectSchema, projectSchema } from "../schema/companySchema";

export const adminRouter = Router()

export const verifyAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      message: "Access Denied: No Token Provided",
    });
  }

  try {
    const verified = jwt.verify(accessToken, process.env.JWT_SECRET!);

    (req as Request & { user?: unknown }).user = verified;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or Expired Token!",
    });
  }
}
///invitation link routes 
adminRouter.get('/invitation-link',verifyAccess,AdminController.getLink),
adminRouter.patch('/approve-invitation',verifyAccess,AdminController.approveAccess)
adminRouter.patch('/reject-invitation',verifyAccess,AdminController.rejectAccess)

//Projects routes
adminRouter.get('/company/projects',verifyAccess,AdminController.getProjects)
adminRouter.post('/company/projects/create',verifyAccess,(req: Request, res: Response, next: NextFunction) => {
    const result = createProjectSchema.safeParse(req.body);
  
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
  
    req.body = result.data;
    next()},AdminController.createProject)

adminRouter.patch('/company/projects/archive',verifyAccess,AdminController.archiveProjects)    
adminRouter.patch('/company/projects/active',verifyAccess,AdminController.activeProject)    
adminRouter.patch('/company/projects/delete',verifyAccess,AdminController.deleteProject)
adminRouter.patch('/company/projects/rearchive',verifyAccess,AdminController.reArchive)
adminRouter.patch('/company/projects/update',verifyAccess,(req: Request, res: Response, next: NextFunction) => {
    const body = req.body?.payload && typeof req.body.payload === "object"
      ? { ...req.body.payload, projectId: req.body.projectId }
      : req.body;
    const result = editProjectSchema.safeParse(body);
  
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
  
    req.body = result.data;
    next()},AdminController.editProject)

adminRouter.get('/company/projects/member',verifyAccess,AdminController.getMemberProjects)
adminRouter.post('/company/projects/join-projects',verifyAccess,AdminController.joinProject)
