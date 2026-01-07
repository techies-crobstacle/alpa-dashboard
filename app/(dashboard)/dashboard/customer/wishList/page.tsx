"use client"
import React, { useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, ShoppingCart, List, LayoutGrid, Trash2, StickyNote, Share2, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const products = [
  {
    title: "Gesto 4W Solar Up Down Wall Sconce Light – Waterproof 2-Way Led Outdoor Wall Lamp With 1200mAh Battery |Auto Day Off & Night On | Exterior Light for Garden, Farm,Elevation,Fence,Balcony, Patio, Stairs",
    brand: "Gesto",
    rating: 4,
    reviews: 156,
    deal: "79% off",
    dealType: "Limited time deal",
    price: "$29.99 AUD",
    mrp: "$99.99 AUD",
    color: "Warm White",
    dateAdded: "2026-01-07",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
  },
  {
    title: "Timex Analog Grey Dial Men's Watch-TWEG16609",
    brand: "TIMEX (Watch)",
    rating: 4,
    reviews: 37,
    price: "$149.99 AUD",
    mrp: "$199.99 AUD",
    color: "Grey",
    dateAdded: "2023-05-20",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=300&q=80",
  },
  // Add more products as needed
];

function WishlistCard({ product }: { product: typeof products[0] }) {
  return (
    <Card className="w-full max-w-xs bg-card text-card-foreground rounded-xl border shadow-sm flex flex-col justify-between">
      <div className="aspect-square w-full rounded-t-xl bg-muted/40 flex items-center justify-center overflow-hidden">
        <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
      </div>
      <CardContent className="flex flex-col gap-2 p-4 flex-1">
        <CardTitle className="text-base font-semibold leading-tight mb-1 line-clamp-2">{product.title}</CardTitle>
        <CardDescription className="text-xs mb-2 line-clamp-2">{product.brand}</CardDescription>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-base">{product.price}</span>
          <div className="flex gap-2">
            <button className="rounded-full p-2 bg-muted hover:bg-primary/10 transition-colors"><Heart className="w-5 h-5 text-primary" /></button>
            <button className="rounded-full p-2 bg-muted hover:bg-primary/10 transition-colors"><ShoppingCart className="w-5 h-5 text-primary" /></button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WishlistTable() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {products.map((product, idx) => (
        <Card key={idx} className="flex flex-col sm:flex-row items-start gap-6 p-6 mb-6 bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="w-32 h-32 rounded bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
              <div>
                <a href="#" className="font-semibold text-lg text-primary hover:underline leading-snug block mb-1">{product.title}</a>
                <div className="text-sm text-muted-foreground mb-1">by {product.brand}</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-500 font-bold">{'★'.repeat(product.rating)}</span>
                  <span className="text-muted-foreground text-xs">{product.reviews}</span>
                </div>
                {/* <div className="flex items-center gap-2 mb-1">
                  {product.deal && <span className="inline-block bg-destructive/10 text-destructive text-xs px-2 py-0.5 rounded">{product.deal}</span>}
                  {product.dealType && <span className="inline-block bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded">{product.dealType}</span>}
                </div> */}
                {product.color && <div className="text-xs text-muted-foreground">Colour: {product.color}</div>}
                <div className="text-xs text-muted-foreground mt-1">Item added {new Date(product.dateAdded).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-primary">{product.price}</span>
                  {product.mrp && <span className="text-xs line-through text-muted-foreground">{product.mrp}</span>}
                </div>
                <span className="text-xs text-muted-foreground">FREE Delivery on orders over $50 AUD</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="secondary" size="sm"><ShoppingCart className="w-4 h-4" />Add to Cart</Button>
              {/* <Button variant="outline" size="sm"><StickyNote className="w-4 h-4" />Add a note</Button> */}
              {/* <Button variant="outline" size="sm">Move</Button> */}
              <Button variant="ghost" size="icon"><Share2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const [view, setView] = useState<'card' | 'table'>('table');
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="flex justify-end max-w-6xl mx-auto mb-6 gap-2">
        <Button
          variant={view === 'card' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('card')}
          aria-label="Card view"
        >
          <LayoutGrid className="w-4 h-4 mr-1" /> Card View
        </Button>
        <Button
          variant={view === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('table')}
          aria-label="Table view"
        >
          <List className="w-4 h-4 mr-1" /> Table View
        </Button>
      </div>
      {view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((product, idx) => (
            <WishlistCard key={idx} product={product} />
          ))}
        </div>
      ) : (
        <WishlistTable />
      )}
    </div>
  );
}
