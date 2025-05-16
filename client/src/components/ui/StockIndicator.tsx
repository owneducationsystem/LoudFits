import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_ORDER';

interface StockIndicatorProps {
  status: StockStatus;
  quantity?: number;
  className?: string;
  showText?: boolean;
  showQuantity?: boolean;
}

export function StockIndicator({ 
  status, 
  quantity, 
  className,
  showText = true,
  showQuantity = false
}: StockIndicatorProps) {
  // Default values based on status
  let label = '';
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let icon = null;
  
  // Add urgent warning for very low stock
  const showUrgentWarning = status === 'LOW_STOCK' && quantity !== undefined && quantity <= 3;

  switch (status) {
    case 'IN_STOCK':
      label = 'In Stock';
      variant = 'default';
      icon = <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'LOW_STOCK':
      label = 'Low Stock';
      variant = 'secondary';
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'OUT_OF_STOCK':
      label = 'Out of Stock';
      variant = 'destructive';
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'BACK_ORDER':
      label = 'Back Order';
      variant = 'outline';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      break;
  }

  return (
    <div className="flex flex-col">
      <Badge 
        variant={variant} 
        className={cn("flex items-center", className)}
      >
        {icon}
        {showText && label}
        {showQuantity && quantity !== undefined && ` (${quantity})`}
      </Badge>
      
      {/* Show urgent warning message for very low stock */}
      {showUrgentWarning && (
        <span className="text-red-500 text-xs font-medium mt-1 animate-pulse">
          Only {quantity} left! Order soon
        </span>
      )}
    </div>
  );
}