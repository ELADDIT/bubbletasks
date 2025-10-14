interface TaskIconProps {
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function TaskIcon({ imageUrl, size = 'medium', className = '' }: TaskIconProps) {
  // Define consistent sizes
  const sizeClasses = {
    small: 'w-6 h-6',    // 24x24px - for form preview
    medium: 'w-8 h-8',   // 32x32px - for task bubbles  
    large: 'w-12 h-12'   // 48x48px - for detailed views
  };

  const iconSize = sizeClasses[size];

  return (
    <div 
      className={`${iconSize} rounded-full overflow-hidden border-2 border-white/40 shadow-md flex-shrink-0 ${className}`}
      style={{ 
        minWidth: size === 'small' ? '24px' : size === 'medium' ? '32px' : '48px',
        minHeight: size === 'small' ? '24px' : size === 'medium' ? '32px' : '48px',
        maxWidth: size === 'small' ? '24px' : size === 'medium' ? '32px' : '48px',
        maxHeight: size === 'small' ? '24px' : size === 'medium' ? '32px' : '48px'
      }}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Task icon" 
          className="w-full h-full object-cover object-center"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      ) : (
        <div 
          className="w-full h-full bg-white/20 flex items-center justify-center text-white/80 font-semibold"
          style={{ fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '16px' }}
        >
          ?
        </div>
      )}
    </div>
  );
}