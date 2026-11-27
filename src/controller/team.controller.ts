import { Router,Request, Response,NextFunction } from "express";
import { TeamService } from "../service/team.service";
export class TeamController {
    static async getTeam(req:Request,res:Response){
        try {
             const userId = req.user?.id
             const page = parseInt(req.query.page as string,10) || 1
             const limit = parseInt(req.query.limit as string, 10) || 10;
             const search = (req.query.search as string) || ''
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        } 
        const result = await TeamService.getTeam(userId, page, limit, search)
         return res.status(200).json({
            team:result.team,
            pagination:{
                page:result.page,
                limit:result.limit,
                total:result.total,
                totalPages:result.totalPages
            }
         })
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
    static async getMemberDashboard(req:Request,res:Response){
        try {
         const userId = req.user?.id
          if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }

        const [completion,deadlines,projects] = await Promise.all([
           TeamService.getTaskCompletition(userId),
           TeamService.getUpcomingDeadlines(userId),
           TeamService.getMemberProjects(userId) 
        ])
        return res.status(200).json({completion,deadlines,projects})
        } catch (error) {
            return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        })  
        }
    }
    static async getAdminDashboard(req:Request,res:Response){
        try {
             const userId = req.user?.id
          if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const [completion,attention,activity]=await Promise.all([
           TeamService.getCompletion(userId),
           TeamService.getAttention(userId),
           TeamService.getActivity(userId) 
        ])
        return res.status(200).json({completion,attention,activity})
        } catch (error) {
          return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        })    
        }
    }
}