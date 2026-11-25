import { Request, Response } from "express";
import { SettingsService } from "../service/settings.service";

export class SettingsController {
    static async editUser(req:Request,res:Response){
        try {
         const userId = req.user?.id
         const {firstName,lastName,currentPassword,newPassword} = req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await SettingsService.editUser(userId, {
            firstName,
            lastName,
            currentPassword,
            newPassword,
        })
            return res.status(200).json(result)
        } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        });
        }
    }
    static async editCompany(req:Request,res:Response){
        try {
         const userId = req.user?.id
         const {slug,domain,description,logoUrl}=req.body

        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await SettingsService.editCompany(userId,{
            slug,domain,description,logoUrl
        })
        return res.status(200).json(result)
        } catch (error) {
           return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        }); 
        }
    }
}