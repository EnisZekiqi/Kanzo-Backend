import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { companies } from "../db/company";

export class SettingsRepository {
   static async getUser(userId:string){
    const result = await db.select()
    .from(users).where(eq(users.id,userId))
    return result[0] ?? null
   }
   static async updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
  },
) {
  return await db.transaction(async(tx)=>{
    const user = await tx.select()
    .from(users).where(eq(users.id,userId)).limit(1)
    const lastUpdate =user[0]
        if (!lastUpdate) {
    throw new Error("User does not exist");
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (lastUpdate.updatedAt > sevenDaysAgo) {
        throw new Error("User needs to wait 7 days to update again");
    }
    const result =await tx
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
    return result
  }) 
}
static async editCompany(userId:string,
    data:{
    slug?:string,
    domain?:string,
    description?:string,
    logoUrl?:string,    
}){
return await db.transaction(async(tx)=>{
    const user = await tx.select()
    .from(companies).where( eq(companies.createdBy,userId))
    const lastUpdate = user[0]
      if (!lastUpdate) {
    throw new Error("User does not exist");
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (lastUpdate.updatedAt > sevenDaysAgo) {
        throw new Error("User needs to wait 7 days to update again");
    }
    const result =await tx
    .update(companies)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(companies.createdBy, userId))
    .returning();
    return result
})
}

}