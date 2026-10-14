import dress from "../assets/p-dress.jpg";
import top from "../assets/p-top.jpg";
import jeans from "../assets/p-jeans.jpg";
import blazer from "../assets/p-blazer.jpg";
import casual from "../assets/p-casual.jpg";
import office from "../assets/p-office.jpg";
import party from "../assets/p-party.jpg";
import thrift from "../assets/p-thrift.jpg";
import squaretop from "../assets/p-squaretop.jpg";
import wideleg from "../assets/p-wideleg.jpg";

/*
 * SAMPLE CATALOG — demonstration products only.
 * Replace names, prices, stock and images with real inventory before launch.
 */

export const SETTINGS = {
  freeDeliveryThreshold: 200000,
  deliveryFees: { Kampala: 8000, Wakiso: 12000, Mukono: 15000, Entebbe: 15000, "Other district": 25000 } as Record<string, number>,
  whatsappNumber: "256700000000", // placeholder — replace with the shop's WhatsApp number
};

export type Category = { slug: string; name: string; image: string };
export const CATEGORIES: Category[] = [
  { slug: "dresses", name: "Dresses", image: dress },
  { slug: "tops", name: "Tops", image: top },
  { slug: "jeans-trousers", name: "Jeans & Trousers", image: jeans },
  { slug: "two-piece-sets", name: "Two-Piece Sets", image: blazer },
  { slug: "casual-wear", name: "Casual Wear", image: casual },
  { slug: "office-wear", name: "Office Wear", image: office },
  { slug: "party-looks", name: "Party Looks", image: party },
  { slug: "thrift", name: "Thrift Treasures", image: thrift },
];

export type Product = {
  id: string; name: string; price: number; image: string; category: string;
  type: "new" | "thrift"; sizes: string[]; colors: string[]; stock: number;
  condition?: string; description: string;
};

export const PRODUCTS: Product[] = [
  { id: "ruched-midi-dress", name: "Ruched Midi Dress", price: 65000, image: dress, category: "dresses", type: "new", sizes: ["S", "M", "L", "XL"], colors: ["Forest Green"], stock: 8, description: "A sleeveless stretch-jersey midi with flattering side ruching. Easy to dress up or down." },
  { id: "square-neck-top", name: "Square Neck Top", price: 40000, image: squaretop, category: "tops", type: "new", sizes: ["S", "M", "L", "XL"], colors: ["White", "Cream"], stock: 12, description: "Soft ribbed knit tank with a clean square neckline. A wardrobe essential." },
  { id: "wide-leg-trousers", name: "Wide Leg Trousers", price: 50000, image: wideleg, category: "jeans-trousers", type: "new", sizes: ["S", "M", "L", "XL"], colors: ["Black"], stock: 6, description: "High-waisted pleated trousers with a fluid wide leg." },
  { id: "blazer-set-preloved", name: "Blazer Set (Pre-loved)", price: 75000, image: blazer, category: "two-piece-sets", type: "thrift", sizes: ["M"], colors: ["Dusty Pink"], stock: 1, condition: "Excellent — light wear, no marks", description: "Tailored single-button blazer with matching wide-leg trousers. One-of-a-kind thrift find." },
  { id: "one-shoulder-top", name: "One Shoulder Top", price: 35000, image: top, category: "tops", type: "new", sizes: ["S", "M", "L"], colors: ["Pink"], stock: 10, description: "Stretch jersey asymmetric top that pairs perfectly with tailored trousers." },
  { id: "wide-leg-jeans", name: "Wide Leg Jeans", price: 55000, image: jeans, category: "jeans-trousers", type: "new", sizes: ["S", "M", "L", "XL"], colors: ["Light Wash"], stock: 7, description: "High-rise light-wash denim with a relaxed wide leg." },
  { id: "knit-cardigan-set", name: "Knit Cardigan & Linen Pants", price: 70000, image: casual, category: "casual-wear", type: "new", sizes: ["S", "M", "L"], colors: ["Oat", "Taupe"], stock: 5, description: "Cosy button cardigan with breezy drawstring linen trousers." },
  { id: "classic-office-suit", name: "Classic Office Suit", price: 95000, image: office, category: "office-wear", type: "new", sizes: ["S", "M", "L", "XL"], colors: ["Black"], stock: 4, description: "Sharp single-breasted blazer with straight-leg trousers." },
  { id: "satin-party-dress", name: "Satin Party Dress", price: 80000, image: party, category: "party-looks", type: "new", sizes: ["S", "M", "L"], colors: ["Red"], stock: 3, description: "Sweetheart satin midi with ruched side and leg slit." },
  { id: "printed-jacket-skirt", name: "Printed Jacket & Skirt (Pre-loved)", price: 60000, image: thrift, category: "thrift", type: "thrift", sizes: ["L"], colors: ["Black/Cream"], stock: 1, condition: "Good — slight fading on cuffs", description: "Vintage abstract print jacket with a black A-line midi skirt." },
];

export const NEW_ARRIVALS = ["ruched-midi-dress", "square-neck-top", "wide-leg-trousers", "blazer-set-preloved"];

export const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;

export function deliveryFee(district: string, subtotal: number) {
  if (subtotal >= SETTINGS.freeDeliveryThreshold) return 0;
  return SETTINGS.deliveryFees[district] ?? SETTINGS.deliveryFees["Other district"] ?? 0;
}
