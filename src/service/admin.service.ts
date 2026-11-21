import { randomBytes } from "node:crypto";
import { AdminRepository } from "../repository/admin.repository";

export class AdminService {
    static async getLink(userId: string) {
        const owner = await AdminRepository.getOwner(userId);

        if (!owner) {
            throw new Error("Company membership was not found");
        }

        if (owner.role !== "OWNER" || owner.status !== "ACTIVE") {
            throw new Error("Only an active OWNER has access to this");
        }

        const linkRows = await AdminRepository.getLink(owner.companyId);
        const existingLink = linkRows[0];

        const pendingMembers = linkRows
            .filter((row) => row.userId !== null)
            .map((row) => ({
                userId: row.userId,
                status: row.status,
                role: row.role,
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                emailVerifiedAt: row.emailVerifiedAt,
            }));
        
        const isExpired =
            existingLink?.expiresAt !== null &&
            existingLink?.expiresAt !== undefined &&
            existingLink.expiresAt.getTime() <= Date.now();

        const shouldCreateNewLink =
            !existingLink ||
            existingLink.revokedAt !== null ||
            isExpired;

        if (!shouldCreateNewLink) {
            return {
                pendingMembers,
                invitationLink: existingLink.tokenHash,
                expiresAt: existingLink.expiresAt,
            };
        }

        const rawToken = randomBytes(32).toString("base64url");
        const newLink = await AdminRepository.createOrReplaceLink(
            owner.companyId,
            owner.userId,
            rawToken
        );

        if (!newLink) {
            throw new Error("Invitation link could not be created");
        }
       

        return {
            pendingMembers,
            invitationLink: rawToken,
            expiresAt: newLink.expiresAt,
        };
    }
    static async approveAccess(userId:string,id:string){
        const owner = await AdminRepository.getOwner(userId);
         if (!owner) {
            throw new Error("Company membership was not found");
        }

        if (owner.role !== "OWNER" || owner.status !== "ACTIVE") {
            throw new Error("Only an active OWNER has access to this");
        }
        const approve = await AdminRepository.approveAccess(id)
        return approve
    }
    static async rejectAccess(userId:string,id:string){
         const owner = await AdminRepository.getOwner(userId);
         if (!owner) {
            throw new Error("Company membership was not found");
        }

        if (owner.role !== "OWNER" || owner.status !== "ACTIVE") {
            throw new Error("Only an active OWNER has access to this");
        }
        const reject = await AdminRepository.rejectAccess(id)
        return reject
    }
    static async getProjects(userId:string){
        const rows = await AdminRepository.getProjects(userId)
        const projects = new Map<string, {
            companyId: string;
            projectId: string;
            name: string;
            description: string | null;
            projectStatus: "ACTIVE" | "ARCHIVED";
            createdBy: string;
            key: string;
            inviteCode:string;
            members: Array<{
                userId: string;
                firstName: string | null;
                lastName: string | null;
                email: string | null;
                joinedAt: Date | null;
            }>;
        }>()

        for (const row of rows) {
            if (
                !row.projectId ||
                !row.name ||
                !row.projectStatus ||
                !row.createdBy ||
                !row.key
            ) continue;

            let project = projects.get(row.projectId)
            if (!project) {
                const newProject = {
                    companyId: row.companyId,
                    projectId: row.projectId,
                    name: row.name,
                    description: row.description,
                    projectStatus: row.projectStatus,
                    createdBy: row.createdBy,
                    key: row.key,
                    inviteCode: row.inviteCode,
                    members: [],
                }
                projects.set(row.projectId, newProject)
                project = newProject
            }

            if (row.memberUserId) {
                project.members.push({
                    userId: row.memberUserId,
                    firstName: row.memberFirstName,
                    lastName: row.memberLastName,
                    email: row.memberEmail,
                    joinedAt: row.joinedAt,
                })
            }
        }

        return [...projects.values()]
    }
    static async createProject(userId:string,name:string,description:string,inviteCode:string,key:string){
        const owner = await AdminRepository.getOwner(userId)
        if (!owner) {
            throw new Error("Owner is not found to create project");
        }
        const createdBy = owner.userId
        const companyId= owner.companyId
        const create = await AdminRepository.createProject(name,description,inviteCode,key,companyId,createdBy)
        return create 
    }
    static async joinProject(userId:string,inviteCode:string){
        const user = await AdminRepository.getUser(userId)
        if (!user) {
            throw new Error("User is not Active or not a member in a company");
            
        }
        const addCode = await AdminRepository.joinProject(userId,inviteCode)
        return addCode
    }
}
