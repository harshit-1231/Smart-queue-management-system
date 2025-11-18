import { useEffect, useState } from 'react';
import { UserProfile, Service, Appointment } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { getServiceQueue, markAsServed, getTodayStats, cancelAppointment } from '../lib/appointments';
import { BarChart3, Plus } from 'lucide-react';
import ServiceModal from './ServiceModal';
import QueueView from './QueueView';

interface AdminViewProps {
  userProfile: UserProfile | null;
}

export default function AdminView({ userProfile }: AdminViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<Record<string, Appointment[]>>({});
  const [stats, setStats] = useState({ today: 0, total: 0, served: 0, cancelled: 0 });
  const [isAddingService, setIsAddingService] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      setServices(servicesData || []);

      const stats = await getTodayStats();
      setStats(stats);

      const queuesData: Record<string, Appointment[]> = {};
      if (servicesData) {
        const today = new Date().toISOString().split('T')[0];
        for (const service of servicesData) {
          const queue = await getServiceQueue(service.id, today);
          queuesData[service.id] = queue || [];
        }
        setQueues(queuesData);
      }

      broadcastUpdate({ type: 'queues_updated', data: queuesData });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const broadcastUpdate = (message: any) => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('appointment_updates');
      channel.postMessage(message);
      channel.close();
    }
  };

  const handleAddService = async (name: string, description: string, avgTime: number) => {
    try {
      await supabase.from('services').insert({
        name,
        description,
        avg_service_time_minutes: avgTime,
        is_active: true,
      });
      setIsAddingService(false);
      await loadData();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleMarkServed = async (appointmentId: string) => {
    if (!userProfile) return;

    try {
      await markAsServed(appointmentId, userProfile.id);
      await loadData();
      broadcastUpdate({ type: 'customer_served', data: { appointmentId } });
    } catch (error) {
      console.error('Error marking served:', error);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      await loadData();
      broadcastUpdate({ type: 'appointment_cancelled', data: { appointmentId } });
    } catch (error) {
      console.error('Error cancelling:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Appointments" value={stats.today} />
        <StatCard label="Total Appointments" value={stats.total} />
        <StatCard label="Served" value={stats.served} color="#4caf50" />
        <StatCard label="Cancelled" value={stats.cancelled} color="#ff6b6b" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: '#BFA181' }}>
          Services & Queues
        </h2>
        <button
          onClick={() => setIsAddingService(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{ backgroundColor: '#178582', color: '#BFA181' }}
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      <div className="grid gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'rgba(23, 133, 130, 0.05)',
              borderColor: 'rgba(191, 161, 129, 0.3)',
            }}
          >
            <div
              className="p-4 border-b"
              style={{ borderColor: 'rgba(191, 161, 129, 0.2)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#BFA181' }}>
                    {service.name}
                  </h3>
                  <p style={{ color: '#178582' }} className="text-sm">
                    {service.description || 'Service available'}
                  </p>
                </div>
                <div className="text-right">
                  <div style={{ color: '#BFA181' }} className="text-sm">
                    <BarChart3 size={20} className="inline mr-2" />
                    {queues[service.id]?.length || 0} in queue
                  </div>
                  <p style={{ color: '#178582' }} className="text-xs">
                    Avg: {service.avg_service_time_minutes}min
                  </p>
                </div>
              </div>
            </div>

            <QueueView
              queue={queues[service.id] || []}
              onMarkServed={handleMarkServed}
              onCancel={handleCancel}
            />
          </div>
        ))}
      </div>

      {isAddingService && (
        <ServiceModal
          onAdd={handleAddService}
          onClose={() => setIsAddingService(false)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div
      className="p-4 rounded-lg border text-center"
      style={{
        backgroundColor: 'rgba(23, 133, 130, 0.1)',
        borderColor: 'rgba(191, 161, 129, 0.3)',
      }}
    >
      <p style={{ color: '#178582' }} className="text-sm">
        {label}
      </p>
      <p
        className="text-3xl font-bold mt-2"
        style={{ color: color || '#BFA181' }}
      >
        {value}
      </p>
    </div>
  );
}
