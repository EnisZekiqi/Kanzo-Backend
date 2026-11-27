import { and, eq, inArray, lt, lte, ne, notExists, sql } from "drizzle-orm";
import { db } from "../db";
import { companyMembers } from "../db/company";
import { projectMembers, projects } from "../db/projects";
import { tasks } from "../db/tasks";
import { users } from "../db/schema";

export class TaskRepository {
    static async createTask(userId:string,projectId:string,title:string,description:string,status:string,priority:string,assigneeId:string,dueDate:string){
     return await db.transaction(async(tx)=>{
        const projectAccess = await tx.select({
        projectId:projects.id,
        companyId:projects.companyId
     }).from(companyMembers)
     .innerJoin(projects,
        eq(projects.companyId,companyMembers.companyId)
    ).where(
        and(
            eq(companyMembers.userId,userId),
            eq(companyMembers.status,'ACTIVE'),
            inArray(companyMembers.role, ["OWNER", "ADMIN"]),
            eq(projects.id,projectId),
            eq(projects.status,'ACTIVE')
        )
      ).limit(1)
      
       if (projectAccess.length === 0) {
        throw new Error("You cannot create a task");
        
      }

      const [task]=await tx.insert(tasks).
      values({
        projectId,
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        createdBy: userId,
      }).returning()
      return task
     }
    )
    }
    static async getProjects(userId:string){
       const result = await db
        .select({
            projectId: projects.id,
            projectName: projects.name,
            projectDescription: projects.description,
            memberId: projectMembers.userId,
            memberFirstName: users.firstName,
            memberLastName: users.lastName,
            memberEmail: users.email,
            taskTitle:tasks.title,
            taskDescription:tasks.description,
            taskStatus:tasks.status,
            taskPriority:tasks.priority,
            taskAssigned:tasks.assigneeId
        })
        .from(projects)
        .innerJoin(
            companyMembers,
            eq(companyMembers.companyId, projects.companyId),
        )
        .leftJoin(
            projectMembers,
            eq(projectMembers.projectId, projects.id),
        )
        .leftJoin(
            users,
            eq(users.id, projectMembers.userId),
        ).leftJoin(
            tasks,
            eq(tasks.projectId,projects.id)
        )
        .where(
            and(
            eq(companyMembers.userId, userId),
            eq(companyMembers.status, "ACTIVE"),
            inArray(companyMembers.role, ["OWNER", "ADMIN"]),
            eq(projects.status, "ACTIVE"),
            ),
        );
        return result
    }
    static async getProjectsMember(userId:string){
       const result = await db
        .select({
            projectId: projects.id,
            projectName: projects.name,
            projectDescription: projects.description,
            memberId: projectMembers.userId,
            memberFirstName: users.firstName,
            memberLastName: users.lastName,
            memberEmail: users.email,
            taskId:tasks.id,
            taskTitle:tasks.title,
            taskDescription:tasks.description,
            taskStatus:tasks.status,
            taskPriority:tasks.priority,
            taskAssigned:tasks.assigneeId,
            taskDueDate:tasks.dueDate,
            taskPosition:tasks.position
        })
        .from(projects)
        .innerJoin(
            companyMembers,
            eq(companyMembers.companyId, projects.companyId),
        )
        .leftJoin(
            projectMembers,
            eq(projectMembers.projectId, projects.id),
        )
        .leftJoin(
            users,
            eq(users.id, projectMembers.userId),
        ).leftJoin(
            tasks,
            eq(tasks.projectId,projects.id)
        )
        .where(
            and(
            eq(companyMembers.userId, userId),
            eq(companyMembers.status, "ACTIVE"),
            eq(companyMembers.role, 'MEMBER'),
            eq(projects.status, "ACTIVE"),
            eq(tasks.assigneeId, userId)
            ),
        );
        return result
    }
    static async changeStatus(userId:string,status:string,projectId:string,taskId:string){
        return db.transaction(async(tx)=>{
            const user = await tx.select({
                companyId:companyMembers.companyId,
                role:companyMembers.role,
                status:companyMembers.status,
            }).from(companyMembers)
            .innerJoin(projects, eq(projects.companyId, companyMembers.companyId))
            .where(
                and(
                    eq(companyMembers.userId,userId),
                    eq(companyMembers.role,'MEMBER'),
                    eq(companyMembers.status,'ACTIVE'),
                    eq(projects.id,projectId),
                    eq(projects.status,'ACTIVE')
                )
            )
            const member = user[0]
            if (!member) {
                throw new Error("This user does not exist in the company and cannot change task");
                
            }
            const [changeStatus] = await tx.update(tasks).set({
                status,
                updatedAt: new Date()
            }).where(
                and(
                    eq(tasks.id,taskId),
                    eq(tasks.projectId,projectId),
                    eq(tasks.assigneeId,userId)
                )
            ).returning()

            if (!changeStatus) {
                throw new Error("The task was not found in this project or is not assigned to this user");
            }

            return changeStatus
        })
    }
    static async deleteDone(){
        const now = new Date()
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-")
        const result = await db.delete(tasks).
        where(and(
            eq(tasks.status,'DONE'),
            lte(tasks.dueDate,today)
        ))
        return result
    }
    static async strikeMember(){
        const now = new Date()
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-")
        const result = await db.update(tasks).set({
            position:sql<number>`GREATEST(0, CURRENT_DATE - ${tasks.dueDate})`
        }).where(and(
            inArray(tasks.status,['TODO','IN_PROGRESS']),
            lt(tasks.dueDate,today)
        )).returning();

        return result
    }
    static async deleteTasks() {
    return await db.delete(tasks).where(
        notExists(
            db
                .select({ id: projects.id })
                .from(projects)
                .where(eq(projects.id, tasks.projectId))
        )
    );
}
}
