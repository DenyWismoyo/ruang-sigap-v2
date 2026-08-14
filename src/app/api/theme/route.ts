import { NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // 1. Verifikasi admin token
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const role = decodedToken.role;

    if (role !== "super_admin" && role !== "admin_opd") {
      return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { action, opdId, nip, theme } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    switch (action) {
      case "setOpdUiTheme": {
        // Hanya super_admin yang bisa ubah tema OPD
        if (role !== "super_admin") {
          return NextResponse.json({ error: "Forbidden: Only super_admin can set OPD theme" }, { status: 403 });
        }
        if (!opdId || !theme) {
          return NextResponse.json({ error: "opdId and theme are required for setOpdUiTheme" }, { status: 400 });
        }

        await db.collection("opdConfigs").doc(opdId).set(
          { default_theme: theme },
          { merge: true }
        );

        return NextResponse.json({ success: true, message: `Theme for OPD ${opdId} set to ${theme}` });
      }

      case "setUserUiTheme": {
        if (!nip || !theme) {
          return NextResponse.json({ error: "nip and theme are required for setUserUiTheme" }, { status: 400 });
        }

        // 1. Update Firestore
        await db.collection("users").doc(nip).update({
          app_theme: theme,
        });

        // 2. Update Custom Claims
        const userDoc = await db.collection("users").doc(nip).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData && userData.uid) {
            const userRecord = await admin.auth().getUser(userData.uid);
            const currentClaims = userRecord.customClaims || {};
            await admin.auth().setCustomUserClaims(userData.uid, {
              ...currentClaims,
              app_theme: theme,
            });
          }
        }

        return NextResponse.json({ success: true, message: `Theme for user ${nip} set to ${theme}` });
      }

      case "resetUserUiTheme": {
        if (!nip) {
          return NextResponse.json({ error: "nip is required for resetUserUiTheme" }, { status: 400 });
        }

        // 1. Update Firestore (Remove app_theme)
        await db.collection("users").doc(nip).update({
          app_theme: admin.firestore.FieldValue.delete(),
        });

        // 2. Update Custom Claims to fallback to OPD theme
        const userDoc = await db.collection("users").doc(nip).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData && userData.uid) {
             let defaultTheme = "sigap";
             if (userData.opdId) {
               const opdDoc = await db.collection("opdConfigs").doc(userData.opdId).get();
               if (opdDoc.exists && opdDoc.data()?.default_theme) {
                 defaultTheme = opdDoc.data()?.default_theme;
               }
             }

            const userRecord = await admin.auth().getUser(userData.uid);
            const currentClaims = userRecord.customClaims || {};
            await admin.auth().setCustomUserClaims(userData.uid, {
              ...currentClaims,
              app_theme: defaultTheme,
            });
          }
        }

        return NextResponse.json({ success: true, message: `Theme for user ${nip} reset to default` });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Theme API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
