import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const PORT = 3000;

// Initialize Firebase Admin lazily to prevent boot-time crashes
let firebaseAdminApp: App | null = null;
function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    try {
      const apps = getApps();
      const targetProjectId = firebaseConfig.projectId;
      
      // Look for a named app first to avoid [DEFAULT] conflicts
      const existingApp = apps.find(app => app.name === 'applet');
      
      if (existingApp) {
        firebaseAdminApp = existingApp;
        console.log("Using existing Admin app [applet] for project:", targetProjectId);
      } else {
        // Try initializing a named app
        firebaseAdminApp = initializeApp({
          projectId: targetProjectId,
        }, 'applet');
        console.log("Firebase Admin initialized [applet] for project:", targetProjectId);
      }
    } catch (e) {
      console.error("Firebase Admin initialization failed:", e);
    }
  }
  return firebaseAdminApp;
}

async function startServer() {
  try {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Google GenAI Setup
    const genAI: any = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

    // Middleware: Verify Firebase ID Token
    const authenticateToken = async (req: any, res: any, next: any) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.sendStatus(401);

      try {
        const adminApp = getFirebaseAdmin();
        if (!adminApp) throw new Error("Firebase Admin not available");
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error: any) {
        console.error("Token verification failed:", error?.message || error);
        res.sendStatus(403);
      }
    };

  // --- AI Insights ---
  app.get("/api/ai/insights", authenticateToken, async (req: any, res) => {
    if (!genAI) return res.status(503).json({ error: "Gemini API not configured" });
    
    const userId = req.user.uid;
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return res.status(500).json({ error: "Firebase Admin Error" });
    
    try {
      let dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
      console.log(`Fetching insights for user ${userId} using DB ${dbId}`);
      
      let db = getFirestore(adminApp, dbId);
      
      let txSnap;
      try {
        // Remove orderBy for now to reduce index requirements and potential PERMISSION_DENIED causes
        txSnap = await db.collection('transactions')
          .where('userId', '==', userId)
          .limit(30)
          .get();
      } catch (err: any) {
        // If it's a permission error and we used a named DB, try (default) as fallback
        const msg = err?.message?.toLowerCase() || '';
        if ((msg.includes('permission') || msg.includes('not found')) && dbId !== '(default)') {
           console.log(`Named database access failed (${msg}), trying (default) fallback...`);
           db = getFirestore(adminApp, '(default)');
           txSnap = await db.collection('transactions')
             .where('userId', '==', userId)
             .limit(30)
             .get();
        } else {
          throw err;
        }
      }
        
      const transactions = txSnap.docs.map((d: any) => d.data());
      console.log(`Found ${transactions.length} transactions for insight generation`);
      
      const prompt = `Based on these financial transactions, provide 3 short financial savings tips or spending insights in Bengali. 
      Keep them very short (max 15 words each). Return as a JSON array of strings only.
      Transactions: ${JSON.stringify(transactions)}`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Robust JSON extraction
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
         res.json(JSON.parse(jsonMatch[0]));
      } else {
         const cleaned = text.replace(/```json|```/g, '').trim();
         res.json(JSON.parse(cleaned));
      }
    } catch (e: any) {
      console.error("AI Insight Error:", e?.message || e);
      if (e?.code) console.error("Error Code:", e.code);
      
      res.json([
        "আপনার খরচ ট্র্যাক করা চালিয়ে যান।",
        "অপ্রয়োজনীয় খরচ কমানোর চেষ্টা করুন।",
        "ভবিষ্যতের জন্য আপৎকালীন তহবিল তৈরি করুন।"
      ]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
