import { supabase } from './supabase';

export const generateQueueNumber = (serviceId: string, date: string) => {
  const dateStr = date.replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `Q-${serviceId.slice(0, 4).toUpperCase()}-${dateStr.slice(-4)}-${random}`;
};

export const bookAppointment = async (
  userId: string,
  serviceId: string,
  appointmentDate: string,
  appointmentTime: string,
  customerName: string,
  customerEmail?: string,
  customerPhone?: string
) => {
  const queueNumber = generateQueueNumber(serviceId, appointmentDate);

  const { data, error } = await supabase.from('appointments').insert({
    user_id: userId,
    service_id: serviceId,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    queue_number: queueNumber,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    status: 'waiting',
  });

  if (error) throw error;
  return data;
};

export const getAppointmentsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('appointment_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const cancelAppointment = async (appointmentId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);

  if (error) throw error;
  return data;
};

export const getServiceQueue = async (serviceId: string, date: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('service_id', serviceId)
    .eq('appointment_date', date)
    .in('status', ['waiting', 'served'])
    .order('appointment_time', { ascending: true });

  if (error) throw error;
  return data;
};

export const markAsServed = async (appointmentId: string, staffId: string) => {
  const appointment = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'served',
      served_at: new Date().toISOString(),
      served_by: staffId,
    })
    .eq('id', appointmentId);

  if (error) throw error;

  if (appointment.data) {
    await supabase.from('staff_activity_logs').insert({
      staff_id: staffId,
      appointment_id: appointmentId,
      action: 'marked_served',
    });
  }

  return data;
};

export const getAvailableTimeSlots = async (serviceId: string, date: string) => {
  const timeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  const { data: bookedSlots } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('service_id', serviceId)
    .eq('appointment_date', date)
    .eq('status', 'waiting');

  const booked = (bookedSlots || []).map((slot) => slot.appointment_time);
  return timeSlots.filter((slot) => !booked.includes(slot));
};

export const getAllAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(*)')
    .order('appointment_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getTodayStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('appointment_date', today);

  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('*');

  return {
    today: todayAppointments?.length || 0,
    total: allAppointments?.length || 0,
    served: allAppointments?.filter((a) => a.status === 'served').length || 0,
    cancelled: allAppointments?.filter((a) => a.status === 'cancelled').length || 0,
  };
};
