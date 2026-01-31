import { useAvatar } from '@/contexts/AvatarContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Volume2, VolumeX, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingAvatarProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: 'w-32 h-32',
  medium: 'w-48 h-48',
  large: 'w-64 h-64',
};

const StreamingAvatar = ({ className, size = 'medium' }: StreamingAvatarProps) => {
  const { 
    status, 
    isSpeaking, 
    error, 
    videoRef, 
    isMuted, 
    setIsMuted,
    setAvatarEnabled,
  } = useAvatar();
  
  const handleRetry = () => {
    // Toggle off and on to retry connection
    setAvatarEnabled(false);
    setTimeout(() => setAvatarEnabled(true), 100);
  };
  
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Video Container */}
      <div 
        className={cn(
          'relative rounded-2xl overflow-hidden bg-gradient-to-b from-muted to-muted/50',
          sizeClasses[size],
          // Pulsing border when speaking
          isSpeaking && 'ring-4 ring-primary/50 animate-pulse',
          // Error state
          status === 'error' && 'ring-2 ring-destructive/50'
        )}
      >
        {/* Loading Skeleton */}
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Connecting...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <span className="text-xs text-muted-foreground">
                {error?.message || 'Connection failed'}
              </span>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={cn(
            'w-full h-full object-cover',
            status !== 'connected' && 'opacity-0'
          )}
        />
        
        {/* Speaking Indicator */}
        {status === 'connected' && isSpeaking && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            Speaking...
          </div>
        )}
        
        {/* Connection Status Dot */}
        <div className="absolute top-2 right-2">
          <div 
            className={cn(
              'w-2 h-2 rounded-full',
              status === 'connected' && 'bg-primary',
              status === 'connecting' && 'bg-amber-500 animate-pulse',
              status === 'error' && 'bg-destructive',
              status === 'idle' && 'bg-muted-foreground'
            )}
          />
        </div>
      </div>
      
      {/* Audio Mute Toggle */}
      {status === 'connected' && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute avatar' : 'Mute avatar'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
};

export default StreamingAvatar;
