# POS System Setup Instructions

## 1. Supabase Database Setup

### Step 1: Run the Database Trigger
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/create_profile_trigger.sql`
6. Click **Run** to execute the SQL

This will:
- Create an automatic trigger to create profiles when users sign up
- Set up proper RLS (Row Level Security) policies
- Grant necessary permissions

### Step 2: Verify Tables Exist
Run this query in the SQL Editor to check all tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see these tables:
- profiles
- products
- categories
- customers
- transactions
- transaction_items
- stock_movements

### Step 3: If Tables Don't Exist
If tables are missing, run the `schema.sql` file from your project root.

## 2. Authentication Settings

1. In Supabase Dashboard, go to **Authentication > Settings**
2. Under **Email Auth**:
   - ✅ Enable Email provider
   - ✅ Confirm email: DISABLED (for testing) or ENABLED (for production)
   - ✅ Secure email change: ENABLED

3. Under **Site URL**:
   - Set to: `http://localhost:3000` (for development)
   - For production, change to your actual domain

## 3. Test the Setup

### Test Signup
1. Go to `http://localhost:3000/auth/signup`
2. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com" (use a standard domain)
   - Password: "test123" (min 6 characters)
3. Click "Create Account"
4. Check console for detailed logs

### Test Login
1. Go to `http://localhost:3000/auth/login`
2. Use the credentials you just created
3. Should redirect to home page

### Verify Profile Created
1. In Supabase Dashboard, go to **Table Editor**
2. Select **profiles** table
3. You should see a row with your user's email and role='cashier'

## 4. Troubleshooting

### "Email address is invalid"
- Use standard email domains: @example.com, @gmail.com, @test.com
- Avoid: @mail.com or custom domains that might be blocked

### "Error fetching profile"
- Make sure you ran the `create_profile_trigger.sql`
- Check that RLS policies are enabled
- Verify the profiles table exists

### "Permission denied"
- Run the trigger SQL to set up proper RLS policies
- Check that the user is authenticated

### Can't see password when typing
- Hard refresh the page: Ctrl + F5
- Clear browser cache
- The password should show as dots/bullets

## 5. Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qykhsvrcktmyhvydnvlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 6. Next Steps

After successful signup/login:
1. Go to `/pos` - Test the POS terminal
2. Go to `/inventory` - Add products and categories
3. Go to `/reports` - View analytics
4. Go to `/test-supabase` - Run connection tests

## Support

If you encounter issues:
1. Check the browser console (F12) for detailed error logs
2. Check the terminal for server errors
3. Verify all SQL scripts have been run in Supabase
4. Make sure RLS policies are properly configured
