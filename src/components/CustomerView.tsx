import { useEffect, useState } from 'react';
import { UserProfile, Service, Appointment } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { bookAppointment, getAppointmentsByUser, cancelAppointment } from '../lib/appointments';
import { Calendar, Clock, X } from 'lucide-react';
import BookingModal from './BookingModal';

interface CustomerViewProps {
  userProfile: UserProfile | null;
}

export default function CustomerView({ userProfile }: CustomerViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile) return;

    try {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      const appointmentsData = await getAppointmentsByUser(userProfile.id);

      setServices(servicesData || []);
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (date: string, time: string) => {
    if (!userProfile || !selectedService) return;

    try {
      await bookAppointment(
        userProfile.id,
        selectedService.id,
        date,
        time,
        userProfile.full_name,
        userProfile.email
      );

      setIsBooking(false);
      setSelectedService(null);
      await loadData();
      notifyUser('Appointment booked successfully!', 'Appointment confirmed');
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      await loadData();
      notifyUser('Appointment cancelled', 'Cancellation confirmed');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const notifyUser = (message: string, title: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  if (isLoading) {
    return <div style={{ color: '#BFA181' }}>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg"
            style={{
              backgroundColor: 'rgba(23, 133, 130, 0.1)',
              borderColor: 'rgba(191, 161, 129, 0.3)',
            }}
            onClick={() => {
              setSelectedService(service);
              setIsBooking(true);
            }}
          >
            <h3 className="font-bold text-lg mb-2" style={{ color: '#BFA181' }}>
              {service.name}
            </h3>
            <p style={{ color: '#178582' }} className="text-sm mb-4">
              {service.description || 'Service available'}
            </p>
            <div className="flex items-center gap-2" style={{ color: '#BFA181' }}>
              <Clock size={16} />
              <span className="text-sm">{service.avg_service_time_minutes} min</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#BFA181' }}>
          Your Appointments
        </h2>

        {appointments.length === 0 ? (
          <div
            className="p-8 rounded-lg text-center border"
            style={{
              backgroundColor: 'rgba(23, 133, 130, 0.05)',
              borderColor: 'rgba(191, 161, 129, 0.2)',
            }}
          >
            <p style={{ color: '#178582' }}>No appointments booked yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(23, 133, 130, 0.1)',
                  borderColor: 'rgba(191, 161, 129, 0.3)',
                  borderLeft: `4px solid ${
                    apt.status === 'served'
                      ? '#4caf50'
                      : apt.status === 'cancelled'
                        ? '#ff6b6b'
                        : '#178582'
                  }`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={18} style={{ color: '#BFA181' }} />
                      <span className="font-semibold" style={{ color: '#BFA181' }}>
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={18} style={{ color: '#178582' }} />
                      <span style={{ color: '#178582' }}>{apt.appointment_time}</span>
                    </div>
                    <p style={{ color: '#BFA181' }} className="text-sm">
                      Queue: <strong>{apt.queue_number}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <div
                      className="px-3 py-1 rounded-full text-sm font-semibold mb-2"
                      style={{
                        backgroundColor:
                          apt.status === 'served'
                            ? 'rgba(76, 175, 80, 0.2)'
                            : apt.status === 'cancelled'
                              ? 'rgba(255, 107, 107, 0.2)'
                              : 'rgba(24, 133, 130, 0.2)',
                        color:
                          apt.status === 'served'
                            ? '#4caf50'
                            : apt.status === 'cancelled'
                              ? '#ff6b6b'
                              : '#178582',
                      }}
                    >
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </div>

                    {apt.status === 'waiting' && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:opacity-80 transition-all"
                        style={{ color: '#ff6b6b' }}
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedService && isBooking && (
        <BookingModal
          service={selectedService}
          onBook={handleBooking}
          onClose={() => {
            setIsBooking(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}
