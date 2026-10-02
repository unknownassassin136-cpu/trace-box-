import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || '' // We can use the service role key here
);

// Login Endpoint (Proxy to Supabase)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Forward the session to the frontend securely
  res.json({ session: data.session });
});

// Logout Endpoint
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // Optionally revoke or sign out on the server side if using admin client
    await supabase.auth.admin.signOut(token);
  }
  res.json({ success: true });
});

export default router;
