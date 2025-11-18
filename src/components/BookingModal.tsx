import { useEffect, useState } from 'react';
import { Service } from '../lib/supabase';
import { getAvailableTimeSlots } from '../lib/appointments';
import { X } from 'lucide-react';

interface BookingModalProps {
  service: Service;
  onBook: (date: string, time: string) => Promise<void>;
  onClose: () => void;
}

export default function BookingModal({ service, onBook, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    setSelectedDate(minDate);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      const slots = await getAvailableTimeSlots(service.id, selectedDate);
      setAvailableSlots(slots);
      setSelectedTime('');
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      await onBook(selectedDate, selectedTime);
    } catch (error) {
      console.error('Error booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg max-w-md w-full p-6 border"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(191, 161, 129, 0.3)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: '#BFA181' }}>
            Book {service.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-80"
            style={{ color: '#178582' }}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Select Time Slot
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              {availableSlots.length === 0 ? (
                <p style={{ color: '#178582' }} className="col-span-3 text-center text-sm">
                  No slots available
                </p>
              ) : (
                availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className="py-2 px-3 rounded-lg border font-medium text-sm transition-all"
                    style={{
                      backgroundColor: selectedTime === slot ? '#178582' : 'transparent',
                      borderColor: selectedTime === slot ? '#BFA181' : 'rgba(191, 161, 129, 0.3)',
                      color: selectedTime === slot ? '#BFA181' : '#178582',
                    }}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg font-semibold transition-all border"
              style={{
                borderColor: 'rgba(191, 161, 129, 0.3)',
                color: '#BFA181',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleBook}
              disabled={!selectedTime || isLoading}
              className="flex-1 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: '#178582', color: '#BFA181' }}
            >
              {isLoading ? 'Booking...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
