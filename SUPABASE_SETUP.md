# Supabase Setup Instructions

## Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up/Login
3. Create a new project
4. Wait for database to be ready

## Step 2: Create Database Table
1. Go to SQL Editor in Supabase dashboard
2. Run the SQL from `supabase_schema.sql` file

## Step 3: Get API Credentials
1. Go to Project Settings > API
2. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_KEY)

## Step 4: Configure Vercel Environment Variables
1. Go to Vercel project settings
2. Add Environment Variables:
   - SUPABASE_URL = your_project_url
   - SUPABASE_KEY = your_anon_key

## Step 5: Test Locally (Optional)
```bash
set SUPABASE_URL=your_url
set SUPABASE_KEY=your_key
python app.py
```

## Step 6: Deploy
Push to GitHub and Vercel will auto-deploy with new environment variables.
