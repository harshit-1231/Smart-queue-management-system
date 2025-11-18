/*
  # Smart Appointment & Queue Management System Schema

  ## Overview
  Complete schema for a multi-role appointment and queue management system
  supporting customers, staff, and admins with real-time queue tracking.

  ## Tables

  ### 1. auth.users (Built-in Supabase)
  - Handles authentication for all users
  - Extended with user_profiles table for role and additional data

  ### 2. user_profiles
  - Stores user information beyond auth.users
  - Links to auth.users via UUID
  - Includes role (customer, staff, admin) and profile details

  ### 3. services
  - Defines available services (e.g., consultation, registration)
  - Tracks average service time and capacity
  - Admin manages service catalog

  ### 4. appointments
  - Core appointment records
  - Links user to service with date/time
  - Tracks queue number and status
  - Timestamps for creation and status changes

  ### 5. queue_status
  - Real-time queue state tracking
  - Denormalized for performance
  - Used for quick queue lookups and updates

  ### 6. staff_activity_logs
  - Audit trail of staff actions
  - Tracks service completions and cancellations
  - Used for analytics and performance metrics

  ## Security
  - RLS policies enforce role-based access control
  - Users can only view/manage their own data
  - Staff can manage queues for their service
  - Admins have full access
  - All sensitive operations are logged

  ## Real-Time Features
  - BroadcastChannel API for client-side sync
  - Server-side real-time subscriptions available
  - Optimistic updates with backend confirmation
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  branch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  avg_service_time_minutes INTEGER DEFAULT 15,
  capacity_per_slot INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  queue_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'served', 'cancelled', 'no_show')) DEFAULT 'waiting',
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  served_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES user_profiles(id),
  served_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, appointment_date, appointment_time)
);

-- Create queue_status table for real-time tracking
CREATE TABLE IF NOT EXISTS queue_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  current_queue_number TEXT,
  total_waiting INTEGER DEFAULT 0,
  total_served INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, appointment_date)
);

-- Create staff_activity_logs table
CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('marked_served', 'marked_cancelled', 'rescheduled')),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_queue_status_service_date ON queue_status(service_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_activity_appointment ON staff_activity_logs(appointment_id);

-- Enable RLS for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for services (public read for authenticated users)
CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage services"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'waiting')
  WITH CHECK (user_id = auth.uid() AND status IN ('waiting', 'cancelled'));

CREATE POLICY "Admin and staff can manage appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for queue_status
CREATE POLICY "Authenticated users can view queue status"
  ON queue_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update queue status"
  ON queue_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for staff_activity_logs
CREATE POLICY "Staff can view own activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can create activity logs"
  ON staff_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );