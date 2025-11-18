import { useState } from 'react';
import { X } from 'lucide-react';

interface ServiceModalProps {
  onAdd: (name: string, description: string, avgTime: number) => Promise<void>;
  onClose: () => void;
}

export default function ServiceModal({ onAdd, onClose }: ServiceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avgTime, setAvgTime] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(name, description, avgTime);
    } finally {
      setIsLoading(false);
    }
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
            Add Service
          </h2>
          <button onClick={onClose} style={{ color: '#178582' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Service Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Consultation"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service description"
              rows={3}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none resize-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Avg. Service Time (minutes)
            </label>
            <input
              type="number"
              value={avgTime}
              onChange={(e) => setAvgTime(parseInt(e.target.value))}
              min="5"
              max="120"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
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
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: '#178582', color: '#BFA181' }}
            >
              {isLoading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
