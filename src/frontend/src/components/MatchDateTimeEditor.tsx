import { useState } from 'react';
import { Match } from '../features/tournament/types';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateDateFormat, validateTimeFormat } from '../features/tournament/validation';
import { toast } from 'sonner';

interface MatchDateTimeEditorProps {
  match: Match;
}

export default function MatchDateTimeEditor({ match }: MatchDateTimeEditorProps) {
  const { updateMatchDateTime } = useTournamentStore();
  const [date, setDate] = useState(match.date || '');
  const [time, setTime] = useState(match.time || '');

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate && !validateDateFormat(newDate)) {
      toast.error('Invalid date format. Use YYYY-MM-DD');
      return;
    }
    updateMatchDateTime(match.id, newDate || undefined, time || undefined);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (newTime && !validateTimeFormat(newTime)) {
      toast.error('Invalid time format. Use HH:MM');
      return;
    }
    updateMatchDateTime(match.id, date || undefined, newTime || undefined);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="space-y-1">
        <Label htmlFor={`date-${match.id}`} className="sr-only">
          Date
        </Label>
        <Input
          id={`date-${match.id}`}
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-[150px]"
          placeholder="Date"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`time-${match.id}`} className="sr-only">
          Time
        </Label>
        <Input
          id={`time-${match.id}`}
          type="time"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-[120px]"
          placeholder="Time"
        />
      </div>
    </div>
  );
}
