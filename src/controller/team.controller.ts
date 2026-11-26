import { Router,Request, Response,NextFunction } from "express";
import { TeamService } from "../service/team.service";
export class TeamController {
    static async getTeam(req:Request,res:Response){
        try {
             const userId = req.user?.id
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        } 
        const result = await TeamService.getTeam(userId)
         return res.status(200).json(result)
        } catch (error) {
           return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        }) 
        }
    }
    static async changeRole(req:Request,res:Response){
        try {
          const userId = req.user?.id
          const {memberId,status} = req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }    
        const result = await TeamService.changeRole(userId,memberId,status)
         return res.status(202).json(result)
        } catch (error) {
            return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        }) 
        }
    }
}