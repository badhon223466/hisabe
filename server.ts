import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import * as admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

const PORT = 3000;

// Initialize Firebase Admin lazily to prevent boot-time crashes
let firebaseAdminApp: any = null;
function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    try {
      if (admin.apps.length > 0) {
        firebaseAdminApp = admin.apps[0];
      } else {
        firebaseAdminApp = admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });
      }
      console.log("Firebase Admin initialized for project:", firebaseConfig.projectId);
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
        const decodedToken = await adminApp.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error) {
        console.error("Token verification failed:", error);
        res.sendStatus(403);
      }
    };

  // --- AI Insights ---
  app.get("/api/ai/insights", authenticateToken, async (req: any, res) => {
    if (!genAI) return res.status(503).json({ error: "Gemini API not configured" });
    
    const userId = req.user.uid;
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return res.status(500).json({ error: "Firebase Admin Error" });
    const db = adminApp.firestore((firebaseConfig as any).firestoreDatabaseId || '(default)');
    
    try {
      const adminApp = getFirebaseAdmin();
      if (!adminApp) throw new Error("Firebase Admin not available");
      
      const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
      console.log(`Fetching insights for user ${userId} using DB ${dbId}`);
      
      const db = adminApp.firestore(dbId);
      
      const txSnap = await db.collection('transactions')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .limit(30)
        .get();
        
      const transactions = txSnap.docs.map(d => d.data());
      
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
    } catch (e) {
      console.error("AI Insight Error:", e);
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
