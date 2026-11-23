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
            deletionAt:string;
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
                    deletionAt:row.deletionAt,
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
    static async getMemberProjects(userId:string){
        const member = await AdminRepository.getMemberProjects(userId)
       return member
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
    static async editProject(userId:string,projectId:string,name:string,key:string,description:string,inviteCode:string){
        const editProject = await AdminRepository.editProject(userId,projectId,name,key,description,inviteCode)
        if (!editProject) {
            throw new Error("Project could not be edited");
            
        }
        return editProject
    }
    static async archiveProject(userId:string,projectId:string){
        const updateProject = await AdminRepository.archiveProject(userId,projectId)
        if (!updateProject) {
            throw new Error("Project not found or access denied");
            
        }
        return updateProject
    }
    static async activeProject(userId:string,projectId:string){
        const updateProject = await AdminRepository.activeProject(userId,projectId)
        if (!updateProject) {
            throw new Error("Project not found or access denied");
            
        }
        return updateProject
    }
    static async deleteProject(userId:string,projectId:string){
        const deletedProject = await AdminRepository.deleteProject(userId,projectId)
        if (!deletedProject) {
            throw new Error("Project not found or access denied");
            
        }
        return deletedProject
    }
    static async reArchive(userId:string,projectId:string){
        const reArchive = await AdminRepository.reArchive(userId,projectId)
        if (!reArchive) {
            throw new Error("Project not found or access denied");
            
        }
        return reArchive
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
