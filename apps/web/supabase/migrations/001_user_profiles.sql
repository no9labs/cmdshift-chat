-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'STARTER', 'PRO', 'BUSINESS')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    messages_used_today INTEGER DEFAULT 0,
    messages_used_this_month INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    team_id UUID,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_team_id ON public.user_profiles(team_id);
CREATE INDEX idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access" 
ON public.user_profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, subscription_tier, subscription_started_at)
    VALUES (
        NEW.id,
        NEW.email,
        'FREE',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to reset daily message count
CREATE OR REPLACE FUNCTION public.reset_daily_message_count()
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET messages_used_today = 0
    WHERE messages_used_today > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly message count
CREATE OR REPLACE FUNCTION public.reset_monthly_message_count()
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET messages_used_this_month = 0
    WHERE messages_used_this_month > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        messages_used_today = messages_used_today + 1,
        messages_used_this_month = messages_used_this_month + 1,
        last_message_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_message_count TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile information including subscription details';
COMMENT ON COLUMN public.user_profiles.subscription_tier IS 'User subscription tier: FREE, STARTER, PRO, or BUSINESS';
COMMENT ON COLUMN public.user_profiles.messages_used_today IS 'Number of messages sent today (reset daily)';
COMMENT ON COLUMN public.user_profiles.messages_used_this_month IS 'Number of messages sent this month (reset monthly)';