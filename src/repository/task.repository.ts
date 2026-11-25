import { and, eq, inArray } from "drizzle-orm";
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
            eq(companyMembers.role, 'MEMBER'),
            eq(projects.status, "ACTIVE"),
            eq(tasks.assigneeId, userId)
            ),
        );
        return result
    }
}
