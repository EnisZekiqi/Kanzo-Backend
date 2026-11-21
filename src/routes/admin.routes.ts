import { Router,Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { AdminController } from "../controller/admin.controller";
import { createProjectSchema, projectSchema } from "../schema/companySchema";

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

adminRouter.get('/invitation-link',verifyAccess,AdminController.getLink),
adminRouter.patch('/approve-invitation',verifyAccess,AdminController.approveAccess)
adminRouter.patch('/reject-invitation',verifyAccess,AdminController.rejectAccess)

adminRouter.get('/company/projects',verifyAccess,AdminController.getProjects)
adminRouter.post('/company/projects/create',verifyAccess,(req: Request, res: Response, next: NextFunction) => {
    const result = createProjectSchema.safeParse(req.body);
  
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
  
    req.body = result.data;
    next()},AdminController.createProject)

adminRouter.post('/company/projects/join-projects',verifyAccess,AdminController.joinProject)