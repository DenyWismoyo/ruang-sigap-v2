import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const email = "deny.wismoyo@gmail.com";
    const user = await admin.auth().getUserByEmail(email);
    
    // 1. Set password
    await admin.auth().updateUser(user.uid, {
      password: "Password123!",
    });

    // 2. Unlink Google Provider so it doesn't force Google Login
    const providers = user.providerData.map(p => p.providerId);
    if (providers.includes('google.com')) {
      await admin.auth().updateUser(user.uid, {
        providerToUnlink: ['google.com']
      });
    }
    
    return NextResponse.json({ message: "Berhasil! Akun super.admin (deny.wismoyo@gmail.com) sudah dilepas dari Google dan passwordnya sekarang adalah: Password123!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

