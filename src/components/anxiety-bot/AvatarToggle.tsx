import { Switch } from '@/components/ui/switch';
import { useAvatar } from '@/contexts/AvatarContext';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { User, Loader2 } from 'lucide-react';

interface AvatarToggleProps {
  className?: string;
}

const AvatarToggle = ({ className }: AvatarToggleProps) => {
  const { avatarEnabled, setAvatarEnabled, status } = useAvatar();
  
  const isTransitioning = status === 'connecting';
  
  // Status indicator color
  const statusColor = {
    idle: 'bg-muted-foreground',
    connecting: 'bg-amber-500 animate-pulse',
    connected: 'bg-primary',
    error: 'bg-destructive',
  }[status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            {/* Avatar icon with status indicator */}
            <div className="relative">
              {isTransitioning ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
              {avatarEnabled && (
                <div 
                  className={cn(
                    'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background',
                    statusColor
                  )}
                />
              )}
            </div>
            
            {/* Label */}
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Avatar
            </span>
            
            {/* Toggle Switch */}
            <Switch
              checked={avatarEnabled}
              onCheckedChange={setAvatarEnabled}
              disabled={isTransitioning}
              aria-label="Toggle AI avatar"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            {avatarEnabled 
              ? 'AI avatar speaks messages aloud. Uses HeyGen streaming.'
              : 'Enable AI avatar for spoken guidance during sessions.'
            }
          </p>
          {status === 'error' && (
            <p className="text-xs text-destructive mt-1">
              Connection failed. Try toggling off and on.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AvatarToggle;
