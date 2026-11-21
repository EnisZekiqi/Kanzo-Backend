import { Request,Response } from "express";
import { CompanyService } from "../service/company.service";

export class CompanyController {
    static async getDetails(req:Request,res:Response){
        try {
        const userId = req.user?.id
        if (!userId) {
            res.status(401).json({ error: "Verification token is missing." });
            return;
        }
        const result = await CompanyService.getDetails(userId)
        return res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
    static async createCompany(req:Request,res:Response){
        try {
        const userId = req.user?.id
        const {name,slug,domain,description,logoUrl} = req.body
        if (!userId) {
            res.status(401).json({ error: "Verification token is missing." });
            return;
        }
        if (!name||!slug||!domain) {
             return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await CompanyService.createCompany(userId,name,slug,domain,description,logoUrl)
         res.clearCookie("companyToken", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("accessToken", result.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: isProduction,
        path: "/",
        maxAge: 60 * 60 * 1000,
      })
        return res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
    static async joinCompany(req:Request,res:Response){
        try {
            const userId = req.user?.id
            const {tokenHash} = req.body
         if (!userId) {
            res.status(401).json({ error: "Verification token is missing." });
            return;
        }
        if (!tokenHash) {
            res.status(401).json({ error: "invitation link is missing." });
            return
        }
        const result = await CompanyService.joinCompany(userId,tokenHash)
        return res.status(201).json({
        stage: "join-pending",
        membership: result[0],
        });
        } catch (error) {
            if (error instanceof Error && error.message.includes("rejected")) {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error && error.message.includes("already a member")) {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}
