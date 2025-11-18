import { Appointment } from '../lib/supabase';
import { Check, X, Clock } from 'lucide-react';

interface QueueViewProps {
  queue: Appointment[];
  onMarkServed: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function QueueView({ queue, onMarkServed, onCancel }: QueueViewProps) {
  const waitingQueue = queue.filter((a) => a.status === 'waiting');
  const servedQueue = queue.filter((a) => a.status === 'served');

  return (
    <div className="p-4 space-y-6">
      <div>
        <h4 className="font-semibold mb-3" style={{ color: '#BFA181' }}>
          Waiting ({waitingQueue.length})
        </h4>

        {waitingQueue.length === 0 ? (
          <div
            className="p-4 rounded text-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              color: '#178582',
            }}
          >
            No waiting customers
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {waitingQueue.map((appointment, index) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: index === 0 ? 'rgba(191, 161, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: index === 0 ? '#BFA181' : 'rgba(191, 161, 129, 0.2)',
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: '#178582',
                        color: '#BFA181',
                      }}
                    >
                      {appointment.queue_number}
                    </span>
                    {index === 0 && (
                      <span style={{ color: '#4caf50' }} className="text-xs font-semibold">
                        NEXT
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#BFA181' }} className="font-semibold">
                    {appointment.customer_name}
                  </p>
                  <p style={{ color: '#178582' }} className="text-sm">
                    {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                    {appointment.appointment_time}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onMarkServed(appointment.id)}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      color: '#4caf50',
                    }}
                    title="Mark as served"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => onCancel(appointment.id)}
                    className="p-2 rounded-lg transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'rgba(255, 107, 107, 0.2)',
                      color: '#ff6b6b',
                    }}
                    title="Cancel appointment"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {servedQueue.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: '#BFA181' }}>
            Recently Served ({servedQueue.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {servedQueue.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  borderColor: 'rgba(76, 175, 80, 0.2)',
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        color: '#4caf50',
                      }}
                    >
                      {appointment.queue_number}
                    </span>
                  </div>
                  <p style={{ color: '#BFA181' }} className="font-semibold">
                    {appointment.customer_name}
                  </p>
                  <p style={{ color: '#178582' }} className="text-sm flex items-center gap-1">
                    <Clock size={14} />
                    Served at {appointment.served_at?.split('T')[1]?.slice(0, 5) || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
