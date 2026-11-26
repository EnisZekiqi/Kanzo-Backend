import { Router,Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken"
import { verifyAccess } from "./admin.routes";
import { TeamController } from "../controller/team.controller";

export const teamRouter = Router()


teamRouter.get('/company',verifyAccess,TeamController.getTeam)
teamRouter.patch('/company/role',verifyAccess,TeamController.changeRole)