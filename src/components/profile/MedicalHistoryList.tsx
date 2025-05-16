
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertCircle, ThumbsUp, CalendarClock } from 'lucide-react';

export const MedicalHistoryList = () => {
  const { userMedicalHistory } = useUser();

  if (userMedicalHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No health history yet. When you use the health assistant, your consultations will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by date (most recent first)
  const sortedHistory = [...userMedicalHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedHistory.map((record) => (
          <div 
            key={record.id} 
            className="p-4 rounded-lg glass-morphism"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(record.date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <RecommendationBadge recommendation={record.recommendation} />
            </div>
            
            <h4 className="font-medium mb-2">{record.diagnosis || 'Consultation'}</h4>
            
            <div className="mb-2">
              <p className="text-sm text-muted-foreground mb-1">Reported symptoms:</p>
              <div className="flex flex-wrap gap-1">
                {record.symptoms.map((symptom) => (
                  <Badge key={symptom} variant="outline" className="capitalize">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
            
            {record.notes && (
              <p className="text-sm mt-2 text-muted-foreground">{record.notes}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const RecommendationBadge = ({ recommendation }: { recommendation?: 'self-care' | 'clinic' | 'emergency' }) => {
  if (!recommendation) return null;
  
  let badgeClass = '';
  let badgeIcon = null;
  
  switch (recommendation) {
    case 'self-care':
      badgeClass = 'bg-green-500/20 text-green-500 border-green-500/50';
      badgeIcon = <ThumbsUp className="h-3 w-3 mr-1" />;
      break;
    case 'clinic':
      badgeClass = 'bg-amber-500/20 text-amber-500 border-amber-500/50';
      badgeIcon = <AlertCircle className="h-3 w-3 mr-1" />;
      break;
    case 'emergency':
      badgeClass = 'bg-red-500/20 text-red-500 border-red-500/50';
      badgeIcon = <AlertCircle className="h-3 w-3 mr-1" />;
      break;
  }

  return (
    <span className={`text-xs flex items-center px-2 py-1 rounded-full border ${badgeClass}`}>
      {badgeIcon}
      <span className="capitalize">{recommendation}</span>
    </span>
  );
};
