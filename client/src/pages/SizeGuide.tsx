import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Ruler } from "lucide-react";

const SizeGuide = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Ruler className="mr-2 h-6 w-6" />
          Size Guide
        </h1>
        
        <p className="text-gray-600 mb-8">
          Use this guide to find your perfect fit. Our garments are designed for a standard fit unless specified otherwise in the product description.
        </p>
        
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">T-Shirts Size Chart (Unisex)</h2>
          <Table>
            <TableCaption>Measurements in inches. Chest measured across the front of the garment, under the arms.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Chest (in)</TableHead>
                <TableHead>Length (in)</TableHead>
                <TableHead>Sleeve (in)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">S</TableCell>
                <TableCell>36-38</TableCell>
                <TableCell>27-28</TableCell>
                <TableCell>8</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">M</TableCell>
                <TableCell>39-41</TableCell>
                <TableCell>28-29</TableCell>
                <TableCell>8.5</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">L</TableCell>
                <TableCell>42-44</TableCell>
                <TableCell>29-30</TableCell>
                <TableCell>9</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">XL</TableCell>
                <TableCell>45-47</TableCell>
                <TableCell>30-31</TableCell>
                <TableCell>9.5</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">XXL</TableCell>
                <TableCell>48-50</TableCell>
                <TableCell>31-32</TableCell>
                <TableCell>10</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">How to Measure</h2>
          <ul className="space-y-4">
            <li className="flex gap-2">
              <span className="font-semibold min-w-[100px]">Chest:</span>
              <span>Measure around the fullest part of your chest, keeping the tape measure horizontal.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[100px]">Length:</span>
              <span>Measure from the highest point of the shoulder to the bottom hem.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[100px]">Sleeve:</span>
              <span>Measure from the shoulder seam to the end of the sleeve.</span>
            </li>
          </ul>
        </div>
        
        <Accordion type="single" collapsible className="w-full mb-12">
          <AccordionItem value="item-1">
            <AccordionTrigger>Still not sure about your size?</AccordionTrigger>
            <AccordionContent>
              If you're between sizes, we recommend going up a size for a more comfortable fit.
              Our customer service team is also happy to provide specific measurements for any product.
              Contact us at support@loudfits.com
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How do your sizes compare to other brands?</AccordionTrigger>
            <AccordionContent>
              Our sizing is standard for Indian brands. If you typically wear a Medium in most Indian brands,
              you will likely wear a Medium in our products as well. International customers should refer to
              the measurement chart rather than the size letter.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Do garments shrink after washing?</AccordionTrigger>
            <AccordionContent>
              Our garments are pre-shrunk, but may still experience minor shrinkage (around 5%) 
              after the first wash. We recommend washing in cold water and air drying to minimize shrinkage.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default SizeGuide;