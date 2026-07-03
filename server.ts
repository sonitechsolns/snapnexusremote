import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import cors from "cors";
import "dotenv/config";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Initialize Resend
  let resend: Resend | null = null;
  if (process.env.RESEND_API_KEY) {
      resend = new Resend(process.env.RESEND_API_KEY);
  }

  // --- OTP In-Memory Store ---
  // Store OTPs temporarily with a 5-minute expiry
  // Record structure: { [email: string]: { otp: string, expires: number } }
  const otpStore: Record<string, { otp: string; expires: number }> = {};

  // API Route: Generate & Send OTP
  app.post("/api/send-otp", async (req, res) => {
    try {
      if (!resend) {
          // If no Resend API key is set, fallback to mock logic so the user doesn't get blocked entirely,
          // but inform them.
          const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
          return res.json({ success: true, mock: true, mockOtp });
      }

      const { email } = req.body;
      if (!email) {
          return res.status(400).json({ error: "Email is required" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000; // 5 mins

      otpStore[email] = { otp, expires };

      const { data, error } = await resend.emails.send({
        from: "SnapNexus Accounts <onboarding@resend.dev>",
        to: email, // Since user might be on free tier of resend, they can only send to their verified email (or we just hope it works)
        subject: "Your SnapNexus Payment Verification OTP",
        html: `<h2>SnapNexus Secure Checkout</h2>
               <p>Your one-time password to authorize this upgrade is <strong>${otp}</strong>.</p>
               <p>This code will expire in 5 minutes.</p>`,
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(400).json({ error });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Route: Verify OTP
  app.post("/api/verify-otp", (req, res) => {
    try {
      if (!resend) {
          // Mock mode
          return res.json({ success: true, verified: true });
      }

      const { email, otp } = req.body;
      if (!email || !otp) {
          return res.status(400).json({ error: "Email and OTP required" });
      }

      const record = otpStore[email];
      if (!record) {
          return res.json({ success: false, error: "No OTP requested for this email" });
      }

      if (Date.now() > record.expires) {
          delete otpStore[email];
          return res.json({ success: false, error: "OTP expired" });
      }

      if (record.otp === otp) {
          delete otpStore[email];
          return res.json({ success: true, verified: true });
      } else {
          return res.json({ success: false, error: "Invalid OTP" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Route: Send Receipt Email
  app.post("/api/send-receipt", async (req, res) => {
      try {
          if (!resend) {
              return res.json({ success: true, mock: true });
          }

          const { email, planName, amount, txnId } = req.body;
          if (!email || !planName || !amount) {
              return res.status(400).json({ error: "Missing receipt details" });
          }

          const { data, error } = await resend.emails.send({
              from: "SnapNexus Billing <onboarding@resend.dev>",
              to: email, // Contact email that gets the receipt
              cc: "sooperfast.net@yahoo.com", // Sent back using the contact email as per requirement (Wait, we can only send FROM verified domains in Resend. We will use onboarding@resend.dev to send, but CC the contact email)
              subject: `Receipt for SnapNexus ${planName}`,
              html: `<h2>Thank you for your purchase!</h2>
                     <p>You have successfully upgraded to the <strong>${planName}</strong> for ₹${amount}.</p>
                     <p>Transaction ID: ${txnId || "N/A"}</p>
                     <p>If you have any questions, contact us at sooperfast.net@yahoo.com.</p>`,
          });

          if (error) {
              console.error("Resend Receipt Error:", error);
              return res.status(400).json({ error });
          }

          res.json({ success: true });
      } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Internal Server Error" });
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
}

startServer();
