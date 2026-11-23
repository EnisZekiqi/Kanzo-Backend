import { db } from "../db";
import { companies, companyInviteLinks, companyMembers } from "../db/company";
import {users} from "../db/schema";
import { and, eq, isNotNull, isNull, lt, sql } from "drizzle-orm";

export class CompanyRepository {
   static async getDetails(userId:string){
    const result = await db.select({
        firstName:users.firstName,
        lastName:users.lastName,
        email:users.email,
    }).from(users).where(and(
        eq(users.id,userId),
        isNotNull(users.emailVerifiedAt)
    ))
    return result[0] ?? null
   }
   static async findByName(suggestedCompanyName:string){
    const result = await db.select().from(companies).where(eq(companies.name , suggestedCompanyName)).limit(1)
    return result[0] ?? null
   }
   static async findCompany(tokenHash:string){
    const result = await db.select().from(companyInviteLinks).where(eq(companyInviteLinks.tokenHash,tokenHash))
        return result[0]??null
    }
    static async pendingUser(userId:string,companyId:string){
        const result = await db.insert(companyMembers).values({
         companyId,
         userId,
         role:'MEMBER',
         status:'PENDING',
        }).returning({status:companyMembers.status})
        return result 
    }
    static async getMembershipForCompany(userId: string, companyId: string) {
        const result = await db
            .select()
            .from(companyMembers)
            .where(and(
                eq(companyMembers.userId, userId),
                eq(companyMembers.companyId, companyId),
            ))
            .limit(1);

        return result[0] ?? null;
    }
    static async getMembership(userId: string) {
  const result = await db
    .select({
      membershipId: companyMembers.id,
      companyId: companies.id,
      companyName: companies.name,
      companySlug: companies.slug,
      role: companyMembers.role,
      status: companyMembers.status,
    })
    .from(companyMembers)
    .innerJoin(companies, eq(companies.id, companyMembers.companyId))
    .where(eq(companyMembers.userId, userId))
    .limit(1);

  return result[0] ?? null;
}
   static async createCompany(userId:string,name:string,slug:string,domain:string,description:string,logoUrl:string){
    return db.transaction(async(tx)=>{
        const now = new Date();
        const [newCompany] = await tx.insert(companies).values({
            name,
            slug,
            domain,
            description,
            logoUrl,
            createdBy: userId,
            createdAt: now,
        }).returning();

        if (!newCompany) {
            throw new Error("Company could not be created");
        }

        await tx.insert(companyMembers).values({
            companyId: newCompany.id,
            userId,
            role: "OWNER",
            status: "ACTIVE",
            joinedAt: now,
        });

        return newCompany;
    });
   }
   static async getActiveMembership(userId:string){
    const result = await db.select({
        membershipId: companyMembers.id,
        companyId: companies.id,
        companyName: companies.name,
        companySlug: companies.slug,
        role: companyMembers.role,
        logoUrl:companies.logoUrl,
        status: companyMembers.status,

        firstName:users.firstName,
        lastName:users.lastName,
        email:users.email,
        emailVerifiedAt:users.emailVerifiedAt,
        createdAt:users.createdAt

    }).from(companyMembers)
    .innerJoin(companies, eq(companies.id, companyMembers.companyId))
    .innerJoin(users, eq(users.id,companyMembers.userId))
    .where(and(
        eq(companyMembers.userId, userId),
        eq(companyMembers.status, "ACTIVE")
    ))
    .limit(1);

    return result[0] ?? null;
   }
   static async getJoinedMember(userId:string){
    const result = await db.select().from(companyMembers).
    where(and(
        eq(companyMembers.userId,userId),
        eq(companyMembers.status, 'ACTIVE')
    ))
    return result[0] ?? null
   }
}
