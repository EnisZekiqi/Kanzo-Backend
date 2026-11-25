import { Request, Response } from "express";
import { TaskService } from "../service/tasks.service";

export class TasksController {
    static async createTask(req:Request,res:Response){
        try {
        const userId = req.user?.id
         const {projectId,title,description,status,priority,assigneeId,dueDate} = req.body
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        if (!title || !status || !priority) {
           res.status(401).json({ error: "Fields are missing." });
        return; 
        }
        const result = await TaskService.createTask(userId,projectId,title,description,status,priority,assigneeId,dueDate)
        return res.status(201).json(result)
        } catch (error) {
            return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        }); 
        }
    }
    static async getProjects(req:Request,res:Response){
        try {
            const userId = req.user?.id
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await TaskService.getProjects(userId)
        return res.status(200).json(result)
        } catch (error) {
          return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        })   
        }
    }
    static async getProjectsMember(req:Request,res:Response){
        try {
            const userId = req.user?.id
        if (!userId) {
        res.status(401).json({ error: "Verification token is missing." });
        return;
        }
        const result = await TaskService.getProjectsMember(userId)
        return res.status(200).json(result)
        } catch (error) {
          return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        })   
        }
    }
}