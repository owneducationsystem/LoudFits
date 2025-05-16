import { useMemo } from 'react';
import { Product } from '@shared/schema';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_ORDER';

interface StockDetails {
  status: StockStatus;
  quantity?: number;
  label: string;
  available: boolean;
}

/**
 * Custom hook to determine product stock status with simulated quantities
 * 
 * This uses the inStock boolean field but enhances it with simulated stock levels
 * to give the appearance of a real-time stock availability indicator
 */
export function useStockStatus(product: Product | undefined): StockDetails {
  return useMemo(() => {
    if (!product) {
      return {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        label: 'Out of Stock',
        available: false
      };
    }

    // Basic stock status from the product
    if (!product.inStock) {
      return {
        status: 'OUT_OF_STOCK',
        quantity: 0,
        label: 'Out of Stock',
        available: false
      };
    }

    // Simulate different stock statuses based on product ID to demonstrate different states
    // In a real app, this would be based on actual stock quantities from the database
    const lastDigit = product.id % 10;
    
    if (lastDigit === 1 || lastDigit === 2) {
      return {
        status: 'LOW_STOCK',
        quantity: lastDigit + 2, // 3-4 items left
        label: 'Low Stock',
        available: true
      };
    } else if (lastDigit === 0) {
      return {
        status: 'BACK_ORDER',
        label: 'Back Order',
        available: true
      };
    } else {
      return {
        status: 'IN_STOCK',
        quantity: 10 + lastDigit,
        label: 'In Stock',
        available: true
      };
    }
  }, [product]);
}