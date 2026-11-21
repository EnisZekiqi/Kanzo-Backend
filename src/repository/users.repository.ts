import { db } from "../db";
import {emailVerificationTokens, users} from "../db/schema";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from 'crypto';

export class UsersRepository{
    static async findUser(userId:string){
       return db.select({
        id:users.id,
        email:users.email,
        verified:users.emailVerifiedAt,
        codeHash:emailVerificationTokens.codeHash,
        expiresAt:emailVerificationTokens.expiresAt,
        usedAt:emailVerificationTokens.usedAt,
        tokenId: emailVerificationTokens.id,
        attempts:emailVerificationTokens.attempts
       }).from(users).
       innerJoin(emailVerificationTokens,
        eq(emailVerificationTokens.userId,userId))
        .where(
        eq(users.id,userId)
       )
    }
    static async findByEmail(email:string){
        const user = await db.select().from(users).where(eq(users.email,email)).limit(1);
        return user[0];
    }
    static async createUser(firstName:string,lastName:string,email:string,passwordHash:string,codeHash:string,expiresCode:Date){
        return db.transaction(async(tx)=>{
        const [newUser] = await tx
            .insert(users)
            .values({
                firstName,
                lastName,
                email,
                passwordHash,
            })
            .returning({ id: users.id })
       
        await tx.insert(emailVerificationTokens).values({
        userId: newUser.id,
        codeHash,
        expiresAt:expiresCode,
        });
        return newUser
        })
    }
    static async createCode(userId:string, codeHash:string, expiresCode:Date){
        const result = await db.insert(emailVerificationTokens).values({
        userId,
        codeHash,
        expiresAt:expiresCode,
        attempts: 0,
        usedAt: null,
        }).onConflictDoUpdate({
            target: emailVerificationTokens.userId,
            set: {
                codeHash,
                expiresAt: expiresCode,
                attempts: 0,
                usedAt: null,
            },
        }).returning()
        return result[0] ?? null
    }

    static async attempts(userId:string){
        const MAX_ATTEMPTS = 5
      const result = await db.update(emailVerificationTokens).set({
        attempts:sql`${emailVerificationTokens.attempts} + 1`
      }).where(
        and(
            eq(emailVerificationTokens.userId,userId),
             isNull(emailVerificationTokens.usedAt),
             sql`${emailVerificationTokens.attempts} < ${MAX_ATTEMPTS } `
        )).returning({attempts:emailVerificationTokens.attempts})
            return result[0]?.attempts ?? null
    }

    static async verifyEmail(userId:string){
        return db.transaction(async(tx)=>{
            const verifiedAt = new Date();
            const [updatedToken] = await tx.update(emailVerificationTokens)
            .set({
                usedAt:verifiedAt
            }).where(eq(emailVerificationTokens.userId,userId)).returning();
            
            if (!updatedToken) {
             throw new Error("Verification token was not found");
            }

            const [updatedUser]=await tx.update(users).set({
                emailVerifiedAt:verifiedAt,
                updatedAt:verifiedAt
            }).where(eq(users.id,userId)).returning()
            
            if (!updatedUser) {
            throw new Error("User was not found");
            }
            return updatedUser;
        })
        
    }
    static async deleteExpiredVerificationTokens(){
        const thirtyMinutesAgo = new Date(Date.now()- 30*60*1000)
        const result = await db.delete(emailVerificationTokens).where(lt(emailVerificationTokens.expiresAt,thirtyMinutesAgo))
        return result 
    }
}
