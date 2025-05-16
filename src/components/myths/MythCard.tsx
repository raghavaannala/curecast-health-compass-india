
import { useState } from 'react';
import { Myth } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface MythCardProps {
  myth: Myth;
  translateFn: (property: 'title' | 'myth' | 'reality') => string;
}

const MythCard = ({ myth, translateFn }: MythCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="glass-morphism rounded-lg p-4">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-lg">{translateFn('title')}</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="mt-2">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-amber-500 font-medium mb-1">The Myth</p>
            <p className="text-sm">{translateFn('myth')}</p>
          </div>
          
          <div className={cn("transition-all", !expanded && "hidden")}>
            <p className="text-sm text-green-500 font-medium mb-1">The Reality</p>
            <p className="text-sm">{translateFn('reality')}</p>
          </div>
          
          {expanded && myth.source && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground flex items-center">
                <span>Source: {myth.source}</span>
                {/* In a real app, this would link to the source */}
                <ExternalLink className="h-3 w-3 ml-1" />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MythCard;
