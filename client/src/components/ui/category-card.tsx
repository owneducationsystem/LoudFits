
import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  image: string;
  description?: string;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  image,
  description,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <img 
            src={image} 
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              {description && (
                <p className="text-sm text-white">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
