
import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from './card';

interface CategoryCardProps {
  name: string;
  image: string;
  slug: string;
  productCount?: number;
}

export function CategoryCard({ name, image, slug, productCount }: CategoryCardProps) {
  return (
    <Link href={`/category/${slug}`}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <img src={image} alt={name} className="w-full h-48 object-cover rounded-md" />
          <h3 className="mt-2 text-lg font-semibold">{name}</h3>
          {productCount !== undefined && (
            <p className="text-sm text-gray-600">{productCount} products</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
