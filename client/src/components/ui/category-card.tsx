
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  description?: string;
  image?: string;
  className?: string;
}

const CategoryCard = ({ name, description, image, className }: CategoryCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {image && (
        <div className="aspect-square relative">
          <img src={image} alt={name} className="object-cover w-full h-full" />
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold">{name}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
