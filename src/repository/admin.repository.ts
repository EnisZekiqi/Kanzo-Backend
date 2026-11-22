import { db } from "../db";
import { companies, companyInviteLinks, companyMembers } from "../db/company";
import { eq,and, or, exists, sql } from "drizzle-orm";
import { users } from "../db/schema";
import { projectMembers, projects } from "../db/projects";
import { from } from "node:stream/iter";
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
            joinedAt:projectMembers.joinedAt,
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
    static async getMemberProjects(userId:string){
        const result = await db.select({
            companyId:companyMembers.companyId,
            userId:companyMembers.userId,
            role:companyMembers.role,
            status:companyMembers.status,

            projectName:projects.name,
            projectKey:projects.key,
            projectDescription:projects.description,
            projectStatus:projects.status
        }).from(companyMembers)
        .leftJoin(projects,
            eq(projects.companyId,companyMembers.companyId)
        ).where(and(
        eq(companyMembers.userId, userId),
        or(
            eq(companyMembers.role, "MEMBER"),
            eq(companyMembers.role, "ADMIN")
        ),
        eq(companyMembers.status, "ACTIVE")
        ))
        return result
    }
    static async createProject(name:string,description:string,inviteCode:string,key:string,companyId:string,createdBy:string){
     const result = await db.transaction(async (tx) => {
        await tx
            .select()
            .from(companies)
            .where(eq(companies.id, companyId))
            .for("update");

        const [{ count }] = await tx
            .select({ count: sql<number>`count(*)` })
            .from(projects)
            .where(and(
            eq(projects.companyId, companyId),
            eq(projects.status, "ACTIVE")
            ));

        if (Number(count) >= 10) {
            throw new Error("Maximum active project limit reached");
        }
          const inserted = await tx.insert(projects).values({
        companyId,
        name,
        description,
        inviteCode,
        key,
        createdBy,
        status:'ACTIVE',
     }).returning()
      return inserted[0] ?? null
     })
      return result
    }
    static async archiveProject(userId:string,projectId:string){
        return await db.transaction(async(tx)=>{
        const ownerCompany = await tx.select()

        .from(companyMembers)
        .where(and(
            eq(companyMembers.userId,userId),
            eq(companyMembers.role,'OWNER')
        )).limit(1)

        const owner = ownerCompany[0]
         if (!owner) {
      throw new Error("Active owner membership not found");
    }
        const archivedProjects = await tx
            .select()
            .from(projects)
            .where(and(
            eq(projects.companyId, owner.companyId),
            eq(projects.status, "ARCHIVED")
            ));

        if (archivedProjects.length >= 10) {
            throw new Error("Maximum archived project limit reached");
        }
         const updatedRows = await tx
        .update(projects)
        .set({
            status: "ARCHIVED",
            updatedAt: new Date(),
        })
        .where(and(
            eq(projects.id, projectId),
            eq(projects.companyId, owner.companyId),
            eq(projects.status, "ACTIVE")
        ))
        .returning();
         return updatedRows[0] ?? null      
        })
    }
    
    static async activeProject(userId:string,projectId:string){
        return await db.transaction(async(tx)=>{
        const ownerCompany = await tx.select()

        .from(companyMembers)
        .where(and(
            eq(companyMembers.userId,userId),
            eq(companyMembers.role,'OWNER')
        )).limit(1)

        const owner = ownerCompany[0]
         if (!owner) {
      throw new Error("Active owner membership not found");
    }
        const activeProjects = await tx
            .select()
            .from(projects)
            .where(and(
            eq(projects.companyId, owner.companyId),
            eq(projects.status, "ACTIVE")
            ));

        if (activeProjects.length >= 10) {
            throw new Error("Maximum active project limit reached");
        }
         const updatedRows = await tx
        .update(projects)
        .set({
            status: "ACTIVE",
            updatedAt: new Date(),
        })
        .where(and(
            eq(projects.id, projectId),
            eq(projects.companyId, owner.companyId),
            eq(projects.status, "ARCHIVED")
        ))
        .returning();
         return updatedRows[0] ?? null      
        })
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
