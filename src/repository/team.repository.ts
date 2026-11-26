import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { companies, companyMembers } from "../db/company";
import { users } from "../db/schema";

export class TeamRepository {
    static async getTeam(userId:string){
       const membership = await db
        .select({
            companyId: companyMembers.companyId,
        })
        .from(companyMembers)
        .where(and(
            eq(companyMembers.userId, userId),
            eq(companyMembers.status, "ACTIVE"),
        ))
        .limit(1);

        if (!membership[0]) {
            return [];
        }
        return db.select({
            memberId: companyMembers.userId,
            companyId: companyMembers.companyId,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: companyMembers.role,
            status: companyMembers.status,
            joinedAt:companyMembers.joinedAt
        }).from(companyMembers)
        .innerJoin(users,
            eq(users.id,companyMembers.userId)
        ).where(
            and(
                eq(companyMembers.companyId,membership[0].companyId),
                eq(companyMembers.status,'ACTIVE')
            )
        ).orderBy(companyMembers.joinedAt)
    }
    static async changeRole(userId:string,memberId:string,status:string){
        return await db.transaction(async(tx)=>{
            const targetMember = await tx.select({
                companyId: companyMembers.companyId,
            })
            .from(companyMembers)
            .where(and(
                eq(companyMembers.userId, memberId),
                eq(companyMembers.status, "ACTIVE"),
            ))
            .limit(1);

            const owner = targetMember[0]
                ? await tx.select({
                    companyId: companies.id,
                })
                .from(companies)
                .innerJoin(companyMembers, and(
                    eq(companyMembers.companyId, companies.id),
                    eq(companyMembers.userId, userId),
                ))
                .where(and(
                    eq(companies.id, targetMember[0].companyId),
                    eq(companies.createdBy, userId),
                    eq(companyMembers.role, "OWNER"),
                    eq(companyMembers.status, "ACTIVE"),
                ))
                .limit(1)
                : [];

            if (!targetMember[0] || !owner[0]) {
                throw new Error("Owner cannot make the changes!");
                
            }
            const changeRole = await tx.update(companyMembers)
            .set({
                role:status,
                updatedAt:new Date()
            }).where(
                and(
                    eq(companyMembers.userId,memberId),
                    eq(companyMembers.status,'ACTIVE'),
                    ne(companyMembers.role,status)
                )
            ).returning()
            return changeRole
        })
        
    }
}
