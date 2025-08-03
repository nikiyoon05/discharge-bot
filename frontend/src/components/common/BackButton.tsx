import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  onClick?: () => void;
}

export default function BackButton({ 
  to, 
  label = 'Back', 
  className,
  variant = 'ghost',
  onClick 
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back in history
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={cn(
        'gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}