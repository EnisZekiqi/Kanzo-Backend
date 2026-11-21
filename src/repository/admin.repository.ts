import { db } from "../db";
import { companyInviteLinks, companyMembers } from "../db/company";
import { eq,and } from "drizzle-orm";
import { users } from "../db/schema";
import { projectMembers, projects } from "../db/projects";
export class AdminRepository {
    static async getOwner(userId:string){
       const result = await db
    .select()
    .from(companyMembers)
    .where(and(
      eq(companyMembers.userId, userId),
      eq(companyMembers.role, "OWNER"),
      eq(companyMembers.status, "ACTIVE")
    ))
    .limit(1)
        return result[0] ?? null
    }

    static async getUser(userId:string){
        const result = await db.select()
        .from(companyMembers)
        .where(
            and(
                eq(companyMembers.userId,userId),
                eq(companyMembers.role,'MEMBER'),
                eq(companyMembers.status,'ACTIVE')
            )
        ).limit(1)
        return result[0] ?? null
    }

    static async getLink(companyId:string){
       const result = await db.select({
        companyId:companyInviteLinks.companyId,
        tokenHash:companyInviteLinks.tokenHash,
        createdBy:companyInviteLinks.createdBy,
        expiresAt:companyInviteLinks.expiresAt,
        revokedAt:companyInviteLinks.revokedAt,
        createdAt:companyInviteLinks.createdAt,

        userId:companyMembers.userId,
        status:companyMembers.status,
        role:companyMembers.role,

        firstName:users.firstName,
        lastName:users.lastName,
        email:users.email,
        emailVerifiedAt:users.emailVerifiedAt
       })
       .from(companyInviteLinks)
       .leftJoin(
        companyMembers,
        and(
            eq(companyInviteLinks.companyId,companyMembers.companyId),
            eq(companyMembers.status,'PENDING')
        )
    ).leftJoin(
        users,
        eq(companyMembers.userId,users.id)
    )
       .where(eq(companyInviteLinks.companyId,companyId))

        return result;
    }
    static async approveAccess(id:string){
        const result = await db.update(companyMembers)
        .set({
            status:'ACTIVE',
            joinedAt:new Date()
        })
        .where(eq(companyMembers.userId,id))
        .returning()
        return result[0] ?? null
    }
    static async rejectAccess(id:string){
        const result = await db.update(companyMembers).set({
            status:'REJECTED',
            updatedAt:new Date()
        })
        .where(eq(companyMembers.userId,id))
        .returning()
        return result[0] ?? null
    }
    static async createOrReplaceLink(companyId:string,createdBy:string,tokenHash:string){
        const result = await db.insert(companyInviteLinks).values({
            companyId,
            createdBy,
            tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            revokedAt: null,
        }).onConflictDoUpdate({
            target: companyInviteLinks.companyId,
            set: {
                createdBy,
                tokenHash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                revokedAt: null,
            },
        }).returning({expiresAt:companyInviteLinks.expiresAt})
        return result[0] ?? null
    }
    static async getProjects(userId:string){
        const result = await db.select({
            companyId:companyMembers.companyId,
            projectId:projects.id,
            name:projects.name,
            description:projects.description,
            projectStatus:projects.status,
            createdBy:projects.createdBy,
            key:projects.key,
            inviteCode:projects.inviteCode,

            memberUserId:projectMembers.userId,
            memberFirstName:users.firstName,
            memberLastName:users.lastName,
            memberEmail:users.email,
            joinedAt:projectMembers.joinedAt
        }).from(companyMembers)
        .leftJoin(projects,
            eq(projects.companyId,companyMembers.companyId)
        ).leftJoin(projectMembers,
            eq(projectMembers.projectId,projects.id)
        ).leftJoin(users,
            eq(users.id,projectMembers.userId)
        ).where(and(
            eq(companyMembers.userId,userId),
            eq(companyMembers.role,"OWNER"),
            eq(companyMembers.status,"ACTIVE")
        ))
        return result
    }
    static async createProject(name:string,description:string,inviteCode:string,key:string,companyId:string,createdBy:string){
     const result = await db.insert(projects).values({
        companyId,
        name,
        description,
        inviteCode,
        key,
        createdBy,
        status:'ACTIVE',
     }).returning()
     return result[0] ?? null
    }
    static async joinProject(userId:string,inviteCode:string){
       await db.transaction(async (tx) => {
        const project = await tx
            .select()
            .from(projects)
            .where(and(
            eq(projects.inviteCode, inviteCode)
            ))
            .limit(1);

        const projectRow = project[0];

        if (!projectRow) {
            throw new Error("Project not found");
        }

        const addProject = await tx
            .insert(projectMembers)
            .values({
            projectId: projectRow.id,
            userId:userId
            })
            .returning();

        return addProject[0];
        });
    }
}
