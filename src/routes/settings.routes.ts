import { Router,Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { verifyAccess } from "./admin.routes";
import { SettingsController } from "../controller/settings.controller";
import { editCompanySchmea, editUserSchema } from "../schema/companySchema";

export const settingsRouter = Router()

settingsRouter.patch('/user/edit',verifyAccess,
    (req: Request, res: Response, next: NextFunction) => {
        const result = editUserSchema.safeParse(req.body);
    
if (!result.success) {
 return res.status(400).json({ errors: result.error.issues });
}
    
 req.body = result.data;
 next()},
 SettingsController.editUser)

 settingsRouter.patch('/admin/edit',verifyAccess,(req: Request, res: Response, next: NextFunction) => {
        const result = editCompanySchmea.safeParse(req.body);
    
if (!result.success) {
 return res.status(400).json({ errors: result.error.issues });
}
    
 req.body = result.data;
 next()},SettingsController.editCompany)


