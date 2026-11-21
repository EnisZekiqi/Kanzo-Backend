import { Request,Response } from "express";
import { AdminService } from "../service/admin.service";

export class AdminController {
   static async getLink(req:Request,res:Response){
    try {
        const userId = req.user?.id
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await AdminService.getLink(userId)
        return res.status(200).json(result)
    } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    }
   }
   static async approveAccess(req:Request,res:Response){
    try {
        const userId = req.user?.id
        const {id} =req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        if (!id) {
        res.status(401).json({ error: "user id for approval is missing" });
        return;
        }
        const result = await AdminService.approveAccess(userId,id)
        return res.status(201).json(result)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })  
    }
   }
   static async rejectAccess(req:Request,res:Response){
    try {
        const userId = req.user?.id
        const {id} =req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        if (!id) {
        res.status(401).json({ error: "user id for approval is missing" });
        return;
        }
        const result = await AdminService.rejectAccess(userId,id)
        return res.status(201).json(result)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
   }
   static async getProjects(req:Request,res:Response){
    try {
         const userId = req.user?.id
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await AdminService.getProjects(userId)
        return res.status(200).json(result)
    } catch (error) {
         res.status(500).json({ error: 'Internal server error' })
    }
   }
   static async createProject(req:Request,res:Response){
    try {
        const userId = req.user?.id
        const {name,description,inviteCode,key} = req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        if (!name || !inviteCode || !key) {
            return res.status(400).json({
                error: "One of the fields is missing",
            });
}
        const result = await AdminService.createProject(
        userId,
        name,
        description,
        inviteCode,
        key
        );
        return res.status(201).json(result)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
   }
   static async joinProject(req:Request,res:Response){
    try {
        const userId = req.user?.id
        const {inviteCode} = req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        if (!inviteCode) {
            return res.status(400).json({
                error: "invitation key is missing",
            });
        }
        const result = await AdminService.joinProject(userId,inviteCode)
        return res.status(201).json({message:"Project joined successfully!", result})
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
   }
}