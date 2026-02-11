import { PetType } from '@/types/appointment';
import { Dog, Cat, Bird, Rabbit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetAvatarProps {
  type: PetType;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const petColors: Record<PetType, string> = {
  dog: 'bg-amber-100 text-amber-600',
  cat: 'bg-purple-100 text-purple-600',
  bird: 'bg-sky-100 text-sky-600',
  rabbit: 'bg-pink-100 text-pink-600',
  hamster: 'bg-orange-100 text-orange-600',
  other: 'bg-gray-100 text-gray-600',
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function PetAvatar({ type, name, size = 'md', className }: PetAvatarProps) {
  const IconComponent = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    hamster: Dog,
    other: Dog,
  }[type];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        petColors[type],
        sizeClasses[size],
        className
      )}
      title={name}
    >
      <IconComponent size={iconSizes[size]} />
    </div>
  );
}
