import { useState } from 'react';
import { Match } from '../features/tournament/types';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MatchDateTimeEditorProps {
  match: Match;
}

export default function MatchDateTimeEditor({ match }: MatchDateTimeEditorProps) {
  const { updateMatchDateTime } = useTournamentStore();
  const [date, setDate] = useState(match.date || '');
  const [time, setTime] = useState(match.time || '');

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    updateMatchDateTime(match.id, newDate || '', time || '');
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    updateMatchDateTime(match.id, date || '', newTime || '');
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`date-${match.id}`} className="text-xs">
            Date
          </Label>
          <Input
            id={`date-${match.id}`}
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`time-${match.id}`} className="text-xs">
            Time
          </Label>
          <Input
            id={`time-${match.id}`}
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
