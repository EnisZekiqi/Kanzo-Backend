import { SettingsRepository } from "../repository/settings.repository";

import { verifyPassword,hashPassword } from "../utils/password";

export class SettingsService {
    static async editUser(userId:string,
         input: {
    firstName?: string;
    lastName?: string;
    currentPassword?: string;
    newPassword?: string;
  }){
        const user = await SettingsRepository.getUser(userId)
        if (!user) {
            throw new Error("User does not exist to update");
            
        }
    const updateData: {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
  } = {};

  
  if (input.firstName !== undefined) {
    updateData.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    updateData.lastName = input.lastName;
  }

  if (input.newPassword !== undefined) {
    if (!input.currentPassword || input.currentPassword.length === 0) {
      throw new Error("Current password is required");
    }

    const valid = await verifyPassword(
      input.currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      throw new Error("Current password is incorrect");
    }
    updateData.passwordHash = await hashPassword(input.newPassword);
}
         return SettingsRepository.updateUser(userId, updateData);
    }
    static async editCompany(userId:string,
        input:{
            slug:string,
            domain:string,
            description:string,
            logoUrl:string
        }
    ){
        const user = await SettingsRepository.getUser(userId)
        if (!user) {
            throw new Error("User does not exist to update");
            
        }
         const updateData: {
    slug?:string,
    domain?:string,
    description?:string,
    logoUrl?:string
  } = {}
   if (input.slug !== undefined) {
    updateData.slug = input.slug;
  }

  if (input.domain !== undefined) {
    updateData.domain = input.domain;
  }
   if (input.description !== undefined) {
    updateData.description = input.description;
  }
   if (input.logoUrl !== undefined) {
    updateData.logoUrl = input.logoUrl;
  }
  return SettingsRepository.editCompany(userId,updateData)
    }
}