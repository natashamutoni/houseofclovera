import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type FormEvent } from "react";
import {
  Menu, Search, Heart, ShoppingBag, Truck, ChevronLeft, ChevronRight, ArrowRight,
  Home, LayoutGrid, User, MessageCircle, X, Minus, Plus, Check,
} from "lucide-react";
import heroImg from "../assets/hero.jpg";
import thriftImg from "../assets/thrift.jpg";
import { CATEGORIES, NEW_ARRIVALS, PRODUCTS, SETTINGS, deliveryFee, ugx, type Product } from "./data";

/* ---------------- hash router ---------------- */
function useHashRoute() {
  const [hash, setHash] = useState("#/");
  useEffect(() => {
    const on = () => { setHash(window.location.hash || "#/"); window.scrollTo(0, 0); };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const [path, qs] = hash.slice(1).split("?");
  return { parts: (path ?? "").split("/").filter(Boolean), query: new URLSearchParams(qs || "") };
}
const go = (to: string) => { window.location.hash = to; };

/* ---------------- store (cart, wishlist, orders, stock) ---------------- */
type CartItem = { id: string; size: string; color: string; qty: number };
type Order = { number: string; items: CartItem[]; subtotal: number; delivery: number; total: number; name: string; phone: string; district: string; address: string; notes: string; payment: string; date: string };
type Store = {
  cart: CartItem[]; wishlist: string[]; orders: Order[]; sold: Record<string, number>;
  add: (i: CartItem) => string | null; setQty: (idx: number, q: number) => void; remove: (idx: number) => void;
  toggleWish: (id: string) => void; placeOrder: (o: Omit<Order, "number" | "items" | "date">) => Order;
  available: (p: Product) => number;
};
const Ctx = createContext<Store | null>(null);
const useStore = () => useContext(Ctx)!;

function usePersist<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch {} setReady(true); }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(v)); }, [key, v, ready]);
  return [v, setV] as const;
}

function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = usePersist<CartItem[]>("hoc-cart", []);
  const [wishlist, setWish] = usePersist<string[]>("hoc-wish", []);
  const [orders, setOrders] = usePersist<Order[]>("hoc-orders", []);
  const [sold, setSold] = usePersist<Record<string, number>>("hoc-sold", {});
  const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;
  const available = (p: Product) => Math.max(0, p.stock - (sold[p.id] ?? 0));
  const inCart = (id: string, c = cart) => c.filter((i) => i.id === id).reduce((s, i) => s + i.qty, 0);

  const store: Store = {
    cart, wishlist, orders, sold, available,
    add: (item) => {
      const p = byId(item.id);
      if (inCart(item.id) + item.qty > available(p)) return p.type === "thrift" ? "This one-of-a-kind piece is already in your bag." : "Not enough stock available.";
      setCart((c) => {
        const i = c.findIndex((x) => x.id === item.id && x.size === item.size && x.color === item.color);
        if (i >= 0) return c.map((x, j) => (j === i ? { ...x, qty: x.qty + item.qty } : x));
        return [...c, item];
      });
      return null;
    },
    setQty: (idx, q) => setCart((c) => {
      const it = c[idx]; if (!it) return c; const p = byId(it.id);
      const max = available(p) - (inCart(it.id, c) - it.qty);
      return c.map((x, j) => (j === idx ? { ...x, qty: Math.max(1, Math.min(q, max)) } : x));
    }),
    remove: (idx) => setCart((c) => c.filter((_, j) => j !== idx)),
    toggleWish: (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
    placeOrder: (o) => {
      const order: Order = { ...o, items: cart, number: "HOC-" + Date.now().toString().slice(-6), date: new Date().toISOString() };
      setOrders((os) => [order, ...os]);
      setSold((s) => { const n = { ...s }; cart.forEach((i) => (n[i.id] = (n[i.id] ?? 0) + i.qty)); return n; });
      setCart([]);
      return order;
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

/* ---------------- shared UI ---------------- */
function Clover({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <circle cx="16" cy="9.5" r="6" /><circle cx="9.5" cy="16" r="6" /><circle cx="22.5" cy="16" r="6" />
      <path d="M16 16 Q17 24 21 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Logo() {
  return (
    <a href="#/" className="flex flex-col items-center text-primary leading-none" aria-label="House of Clovera home">
      <Clover className="h-6 w-6 text-accent" />
      <span className="font-serif text-[0.7rem] tracking-[0.35em] mt-1">HOUSE OF</span>
      <span className="font-serif text-3xl md:text-4xl tracking-[0.12em]">CLOVERA</span>
      <span className="text-[0.62rem] text-foreground mt-1">Your Style. Your Story. Your Clovera.</span>
    </a>
  );
}

const NAV = [
  { label: "New In", to: "#/shop?type=new" },
  ...CATEGORIES.slice(0, 4).map((c) => ({ label: c.name, to: `#/shop?cat=${c.slug}` })),
  { label: "Thrift", to: "#/shop?type=thrift" },
];

function Header({ onSearch }: { onSearch: () => void }) {
  const { cart, wishlist } = useStore();
  const [open, setOpen] = useState(false);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <header className="bg-background border-b sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="justify-self-start p-1"><Menu className="h-6 w-6" strokeWidth={1.4} /></button>
        <Logo />
        <div className="justify-self-end flex items-center gap-3 md:gap-5">
          <button aria-label="Search" onClick={onSearch}><Search className="h-5 w-5" strokeWidth={1.5} /></button>
          <a href="#/wishlist" aria-label="Wishlist" className="relative"><Heart className="h-5 w-5" strokeWidth={1.5} />
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] grid place-items-center">{wishlist.length}</span>}
          </a>
          <a href="#/cart" aria-label={`Bag, ${count} items`} className="relative"><ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {count > 0 && <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center">{count}</span>}
          </a>
        </div>
      </div>
      <nav className="hidden md:flex justify-center gap-8 pb-3 text-sm tracking-wide">
        {NAV.map((n) => <a key={n.label} href={n.to} className="hover:text-primary hover:underline underline-offset-4">{n.label}</a>)}
      </nav>
      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/40" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-background p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close menu" className="self-end" onClick={() => setOpen(false)}><X /></button>
            <a href="#/" onClick={() => setOpen(false)} className="font-serif text-xl text-primary">Home</a>
            <a href="#/shop" onClick={() => setOpen(false)} className="font-serif text-xl text-primary">Shop All</a>
            {NAV.map((n) => <a key={n.label} href={n.to} onClick={() => setOpen(false)} className="text-sm">{n.label}</a>)}
            {CATEGORIES.slice(4, 7).map((c) => <a key={c.slug} href={`#/shop?cat=${c.slug}`} onClick={() => setOpen(false)} className="text-sm">{c.name}</a>)}
          </aside>
        </div>
      )}
    </header>
  );
}

const MESSAGES = [
  `Free delivery on orders above ${ugx(SETTINGS.freeDeliveryThreshold)} | Fashion for every mood`,
  "New & thrifted pieces added every week",
  "Pay with MTN Mobile Money, Airtel Money or card",
];
function Announcement() {
  const [i, setI] = useState(0);
  const n = MESSAGES.length;
  return (
    <div className="bg-accent text-accent-foreground text-xs md:text-sm">
      <div className="mx-auto max-w-7xl px-3 py-2.5 flex items-center justify-between gap-2">
        <button aria-label="Previous message" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft className="h-4 w-4" /></button>
        <p className="flex items-center gap-2 text-center"><Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} />{MESSAGES[i]}</p>
        <button aria-label="Next message" onClick={() => setI((i + 1) % n)}><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { wishlist, toggleWish, available } = useStore();
  const liked = wishlist.includes(p.id);
  const soldOut = available(p) === 0;
  return (
    <div className="bg-card border rounded-lg overflow-hidden flex flex-col">
      <div className="relative aspect-[4/5] bg-secondary">
        <a href={`#/product/${p.id}`}><img src={p.image} alt={p.name} loading="lazy" width={768} height={960} className="h-full w-full object-cover" /></a>
        <button aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} onClick={() => toggleWish(p.id)} className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-background/80">
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} strokeWidth={1.5} />
        </button>
        <span className={`absolute bottom-2 left-2 rounded-full px-3 py-0.5 text-[11px] ${p.type === "thrift" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>{p.type === "thrift" ? "Thrift" : "New"}</span>
        {soldOut && <span className="absolute inset-0 grid place-items-center bg-background/60 text-sm tracking-widest uppercase">Sold out</span>}
      </div>
      <a href={`#/product/${p.id}`} className="p-3 flex flex-col gap-1.5">
        <span className="text-sm">{p.name}</span>
        <span className="text-sm font-semibold">{ugx(p.price)}</span>
        <span className="flex gap-1.5">{p.sizes.map((s) => <span key={s} className="h-6 min-w-6 px-1 rounded-full bg-muted text-[10px] grid place-items-center">{s}</span>)}</span>
      </a>
    </div>
  );
}

function SectionHead({ title, to }: { title: string; to?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl md:text-3xl">{title}</h2>
      {to && <a href={to} className="text-sm flex items-center gap-1.5">View All <ArrowRight className="h-4 w-4" strokeWidth={1.5} /></a>}
    </div>
  );
}

/* ---------------- pages ---------------- */
function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-secondary">
        <img src={heroImg} alt="Mannequins wearing a cream top with olive trousers and a chocolate brown dress" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent md:from-background/70 md:via-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 md:py-28 min-h-[300px] md:min-h-[520px] flex items-center">
          <div className="max-w-[58%] md:max-w-md">
            <p className="text-[0.7rem] tracking-[0.25em] mb-3">NEW ARRIVALS</p>
            <h1 className="text-3xl md:text-6xl leading-[1.05]">Trendy Outfits at Great Prices</h1>
            <p className="mt-3 text-sm md:text-base">Discover fresh styles and timeless pieces — new and thrifted — all in one place.</p>
            <a href="#/shop" className="btn-primary mt-5">Shop Now <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8">
        <SectionHead title="Shop by Category" to="#/shop" />
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {CATEGORIES.map((c) => (
            <a key={c.slug} href={`#/shop?cat=${c.slug}`} className="bg-card border rounded-lg overflow-hidden group">
              <div className="aspect-[4/5] bg-secondary overflow-hidden"><img src={c.image} alt={c.name} loading="lazy" width={768} height={960} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
              <p className="text-center text-[11px] md:text-sm py-2 leading-tight">{c.name}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10">
        <SectionHead title="New Arrivals" to="#/shop" />
        <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 md:mx-0 md:px-0">
          {NEW_ARRIVALS.map((id) => PRODUCTS.find((p) => p.id === id)!).map((p) => (
            <div key={p.id} className="min-w-[46%] sm:min-w-[30%] md:min-w-0 snap-start"><ProductCard p={p} /></div>
          ))}
        </div>
      </section>

      <ThriftBanner />
    </>
  );
}

function ThriftBanner() {
  const { available } = useStore();
  const limited = PRODUCTS.some((p) => p.type === "thrift" && available(p) === 1);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative rounded-lg overflow-hidden bg-blush">
        <img src={thriftImg} alt="Rack of thrifted coats and blouses in earthy tones" loading="lazy" width={1600} height={608} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-blush via-blush/70 to-transparent" />
        <div className="relative px-6 py-8 md:px-14 md:py-16 max-w-[65%] md:max-w-lg">
          <h2 className="text-2xl md:text-4xl">Authentic Thrift Finds</h2>
          <p className="text-sm md:text-base mt-1">Unique pieces. Great quality. Unbeatable prices.</p>
          <a href="#/shop?type=thrift" className="btn-primary mt-4 !py-2 !text-[0.7rem]">Shop Thrift Finds <ArrowRight className="h-3.5 w-3.5" /></a>
        </div>
        {limited && <span className="absolute right-4 bottom-4 md:right-8 md:top-1/2 md:-translate-y-1/2 md:bottom-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-taupe text-primary text-[11px] md:text-xs text-center grid place-items-center leading-tight">Limited<br />Stock</span>}
      </div>
    </section>
  );
}

function ShopPage({ query }: { query: URLSearchParams }) {
  const { available } = useStore();
  const cat = query.get("cat") || "";
  const type = query.get("type") || "";
  const [q, setQ] = useState(query.get("q") || "");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("featured");
  useEffect(() => setQ(query.get("q") || ""), [query.get("q")]);
  const list = useMemo(() => {
    let l = PRODUCTS.filter((p) => (!cat || p.category === cat || (cat === "thrift" && p.type === "thrift")) && (!type || p.type === type) && (!size || p.sizes.includes(size)) && p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "stock") l = l.filter((p) => available(p) > 0);
    return l;
  }, [cat, type, size, q, sort, available]);
  const title = CATEGORIES.find((c) => c.slug === cat)?.name ?? (type === "thrift" ? "Thrift Finds" : type === "new" ? "New In" : "Shop All");
  const setParam = (k: string, v: string) => { const p = new URLSearchParams(query); v ? p.set(k, v) : p.delete(k); go(`/shop?${p}`); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl md:text-5xl mb-5">{title}</h1>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
        <button onClick={() => go("/shop")} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${!cat && !type ? "bg-primary text-primary-foreground" : ""}`}>All</button>
        {CATEGORIES.map((c) => <button key={c.slug} onClick={() => setParam("cat", c.slug)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${cat === c.slug ? "bg-primary text-primary-foreground" : ""}`}>{c.name}</button>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <input className="field col-span-2" placeholder="Search outfits…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select className="field" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Filter by size">
          <option value="">All sizes</option>{["S", "M", "L", "XL"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="stock">In stock only</option>
        </select>
      </div>
      {list.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : <p className="text-muted-foreground py-16 text-center">No pieces match your search. Try another filter.</p>}
    </div>
  );
}

function ProductPage({ id }: { id: string }) {
  const p = PRODUCTS.find((x) => x.id === id);
  const { add, wishlist, toggleWish, available } = useStore();
  const [size, setSize] = useState(p?.sizes.length === 1 ? p.sizes[0] : "");
  const [color, setColor] = useState(p?.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!p) return <div className="py-24 text-center">Product not found. <a className="underline" href="#/shop">Back to shop</a></div>;
  const left = available(p);
  const related = PRODUCTS.filter((x) => x.id !== p.id && (x.category === p.category || x.type === p.type)).slice(0, 4);
  const onAdd = () => {
    if (!size) return setMsg({ ok: false, text: "Please choose a size." });
    const err = add({ id: p.id, size, color, qty });
    setMsg(err ? { ok: false, text: err } : { ok: true, text: "Added to your bag." });
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <a href="#/shop" className="text-sm flex items-center gap-1 mb-4"><ChevronLeft className="h-4 w-4" /> Back to shop</a>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-secondary rounded-lg overflow-hidden aspect-[4/5]"><img src={p.image} alt={p.name} width={768} height={960} className="h-full w-full object-cover" /></div>
        <div className="flex flex-col gap-4">
          <span className={`self-start rounded-full px-3 py-0.5 text-xs ${p.type === "thrift" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>{p.type === "thrift" ? "Thrift · Pre-loved" : "New"}</span>
          <h1 className="text-4xl">{p.name}</h1>
          <p className="text-xl font-semibold">{ugx(p.price)}</p>
          <p className="text-muted-foreground">{p.description}</p>
          {p.condition && <p className="text-sm"><b>Condition:</b> {p.condition}</p>}
          <p className={`text-sm ${left === 0 ? "text-destructive" : ""}`}>{left === 0 ? "Sold out" : p.type === "thrift" ? "Only 1 available — one of a kind" : left <= 3 ? `Only ${left} left` : "In stock"}</p>
          <div><p className="text-sm mb-2">Size</p><div className="flex gap-2">{p.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={`h-10 min-w-10 px-2 rounded-full border text-sm ${size === s ? "bg-primary text-primary-foreground" : ""}`}>{s}</button>)}</div></div>
          {p.colors.length > 0 && <div><p className="text-sm mb-2">Colour</p><div className="flex gap-2 flex-wrap">{p.colors.map((c) => <button key={c} onClick={() => setColor(c)} className={`rounded-full border px-4 py-1.5 text-sm ${color === c ? "bg-primary text-primary-foreground" : ""}`}>{c}</button>)}</div></div>}
          {p.type === "new" && left > 1 && (
            <div className="flex items-center gap-3"><span className="text-sm">Qty</span>
              <button aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 border rounded-full grid place-items-center"><Minus className="h-3 w-3" /></button>
              <span>{qty}</span>
              <button aria-label="Increase" onClick={() => setQty(Math.min(left, qty + 1))} className="h-8 w-8 border rounded-full grid place-items-center"><Plus className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={left === 0} onClick={onAdd}>Add to Bag</button>
            <button aria-label="Toggle wishlist" onClick={() => toggleWish(p.id)} className="btn-outline !px-4"><Heart className={`h-4 w-4 ${wishlist.includes(p.id) ? "fill-primary" : ""}`} /></button>
          </div>
          {msg && <p className={`text-sm ${msg.ok ? "text-accent" : "text-destructive"}`}>{msg.text} {msg.ok && <a href="#/cart" className="underline">View bag</a>}</p>}
        </div>
      </div>
      {related.length > 0 && <section className="mt-14"><SectionHead title="You may also like" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}

function WishlistPage() {
  const { wishlist } = useStore();
  const items = PRODUCTS.filter((p) => wishlist.includes(p.id));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl mb-6">Wishlist</h1>
      {items.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="text-muted-foreground">Nothing saved yet. Tap the heart on any piece. <a href="#/shop" className="underline">Start shopping</a></p>}
    </div>
  );
}

function CartPage() {
  const { cart, setQty, remove } = useStore();
  const subtotal = cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id)!.price * i.qty, 0);
  const toFree = SETTINGS.freeDeliveryThreshold - subtotal;
  if (!cart.length) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-4xl mb-3">Your bag is empty</h1><a href="#/shop" className="btn-primary">Shop Now</a></div>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl mb-6">Your Bag</h1>
      <ul className="divide-y border-y">
        {cart.map((i, idx) => { const p = PRODUCTS.find((x) => x.id === i.id)!; return (
          <li key={idx} className="flex gap-4 py-4">
            <img src={p.image} alt={p.name} loading="lazy" className="h-28 w-22 object-cover rounded-md bg-secondary" />
            <div className="flex-1 flex flex-col gap-1">
              <a href={`#/product/${p.id}`} className="font-medium">{p.name}</a>
              <span className="text-sm text-muted-foreground">Size {i.size} · {i.color}</span>
              <span className="text-sm font-semibold">{ugx(p.price * i.qty)}</span>
              <div className="flex items-center gap-3 mt-1">
                {p.type === "new" ? <>
                  <button aria-label="Decrease" onClick={() => setQty(idx, i.qty - 1)} className="h-7 w-7 border rounded-full grid place-items-center"><Minus className="h-3 w-3" /></button>
                  <span className="text-sm">{i.qty}</span>
                  <button aria-label="Increase" onClick={() => setQty(idx, i.qty + 1)} className="h-7 w-7 border rounded-full grid place-items-center"><Plus className="h-3 w-3" /></button>
                </> : <span className="text-xs text-muted-foreground">One of a kind</span>}
                <button onClick={() => remove(idx)} className="ml-auto text-sm underline">Remove</button>
              </div>
            </div>
          </li>); })}
      </ul>
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{ugx(subtotal)}</span></div>
        <p className="text-sm text-muted-foreground">{toFree > 0 ? `Add ${ugx(toFree)} more for free delivery.` : "You qualify for free delivery!"} Delivery fee is calculated at checkout.</p>
        <a href="#/checkout" className="btn-primary mt-3">Checkout</a>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const { cart, placeOrder } = useStore();
  const [f, setF] = useState({ name: "", phone: "", district: "Kampala", address: "", notes: "", payment: "mtn" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const subtotal = cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id)!.price * i.qty, 0);
  const delivery = deliveryFee(f.district, subtotal);
  if (!cart.length) return <div className="py-16 text-center">Your bag is empty. <a className="underline" href="#/shop">Shop now</a></div>;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr("Please enter your full name.");
    if (!/^(\+?256|0)7\d{8}$/.test(f.phone.replace(/\s/g, ""))) return setErr("Enter a valid Ugandan phone number, e.g. 0772 123456.");
    if (f.address.trim().length < 5) return setErr("Please enter your delivery address.");
    setErr(""); setBusy(true);
    setTimeout(() => { const o = placeOrder({ ...f, subtotal, delivery, total: subtotal + delivery }); go(`/order/${o.number}`); }, 900);
  };
  const pays: [string, string][] = [["mtn", "MTN Mobile Money"], ["airtel", "Airtel Money"], ["card", "Card (Visa / Mastercard)"], ["cod", "Cash on delivery"]];
  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl px-4 py-8 grid md:grid-cols-[1fr_340px] gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl">Checkout</h1>
        <p className="text-xs rounded-md bg-blush px-3 py-2">Test mode — no real payment is taken. Live payments need a Ugandan payment provider to be connected.</p>
        <input className="field" placeholder="Full name" value={f.name} onChange={set("name")} aria-label="Full name" />
        <input className="field" placeholder="Phone number (07XX XXX XXX)" value={f.phone} onChange={set("phone")} inputMode="tel" aria-label="Phone number" />
        <select className="field" value={f.district} onChange={set("district")} aria-label="District">{Object.keys(SETTINGS.deliveryFees).map((d) => <option key={d}>{d}</option>)}</select>
        <input className="field" placeholder="Delivery address (area, street, landmark)" value={f.address} onChange={set("address")} aria-label="Address" />
        <textarea className="field" placeholder="Delivery instructions (optional)" rows={3} value={f.notes} onChange={set("notes")} aria-label="Instructions" />
        <fieldset className="flex flex-col gap-2"><legend className="text-sm mb-2">Payment method</legend>
          {pays.map(([v, l]) => <label key={v} className={`field flex items-center gap-3 cursor-pointer ${f.payment === v ? "border-primary" : ""}`}><input type="radio" name="pay" checked={f.payment === v} onChange={() => setF({ ...f, payment: v })} />{l}</label>)}
        </fieldset>
      </div>
      <aside className="bg-card border rounded-lg p-5 h-fit flex flex-col gap-3">
        <h2 className="text-2xl">Order summary</h2>
        {cart.map((i, k) => { const p = PRODUCTS.find((x) => x.id === i.id)!; return <div key={k} className="flex justify-between text-sm"><span>{p.name} × {i.qty}</span><span>{ugx(p.price * i.qty)}</span></div>; })}
        <hr />
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{ugx(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Delivery ({f.district})</span><span>{delivery === 0 ? "Free" : ugx(delivery)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>{ugx(subtotal + delivery)}</span></div>
        {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Placing order…" : "Place Order"}</button>
      </aside>
    </form>
  );
}

function OrderPage({ number }: { number: string }) {
  const { orders } = useStore();
  const o = orders.find((x) => x.number === number);
  if (!o) return <div className="py-16 text-center">Order not found.</div>;
  return (
    <div className="mx-auto max-w-xl px-4 py-14 text-center flex flex-col items-center gap-3">
      <span className="h-14 w-14 rounded-full bg-accent text-accent-foreground grid place-items-center"><Check /></span>
      <h1 className="text-4xl">Thank you, {o.name.split(" ")[0]}!</h1>
      <p>Your order <b>{o.number}</b> has been received.</p>
      <p className="text-sm text-muted-foreground">Total {ugx(o.total)} · Delivery to {o.district}. We'll call you on {o.phone} to confirm.</p>
      <a href="#/shop" className="btn-primary mt-4">Continue Shopping</a>
    </div>
  );
}

function AccountPage() {
  const { orders } = useStore();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl mb-6">My Orders</h1>
      {orders.length ? <ul className="divide-y border-y">{orders.map((o) => (
        <li key={o.number} className="py-4 flex justify-between text-sm"><a href={`#/order/${o.number}`} className="underline">{o.number}</a><span>{new Date(o.date).toLocaleDateString()}</span><span className="font-semibold">{ugx(o.total)}</span></li>
      ))}</ul> : <p className="text-muted-foreground">No orders yet on this device.</p>}
    </div>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40" onClick={onClose}>
      <form className="bg-background p-4 flex gap-2" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); go(`/shop?q=${encodeURIComponent(q)}`); onClose(); }}>
        <input autoFocus className="field" placeholder="Search dresses, tops, thrift…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <button className="btn-primary">Search</button>
      </form>
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { k: "", label: "Home", icon: Home, href: "#/" },
    { k: "shop", label: "Shop", icon: LayoutGrid, href: "#/shop" },
    { k: "wishlist", label: "Wishlist", icon: Heart, href: "#/wishlist" },
    { k: "account", label: "Account", icon: User, href: "#/account" },
    { k: "chat", label: "Chat", icon: MessageCircle, href: `https://wa.me/${SETTINGS.whatsappNumber}` },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t grid grid-cols-5 py-2" aria-label="Main">
      {items.map(({ k, label, icon: I, href }) => (
        <a key={label} href={href} target={k === "chat" ? "_blank" : undefined} rel="noreferrer" className={`flex flex-col items-center gap-0.5 text-[11px] ${active === k ? "text-primary font-semibold" : ""}`}>
          <I className={`h-5 w-5 ${active === k ? "fill-primary" : ""}`} strokeWidth={1.5} />{label}
        </a>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-8 pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-4 gap-6 text-sm">
        <div><p className="font-serif text-2xl tracking-widest">CLOVERA</p><p className="opacity-80 mt-2">Trendy, affordable ladies' fashion — new and thrifted — in Uganda.</p></div>
        <div className="flex flex-col gap-1.5"><b>Shop</b>{CATEGORIES.slice(0, 4).map((c) => <a key={c.slug} href={`#/shop?cat=${c.slug}`} className="opacity-80">{c.name}</a>)}</div>
        <div className="flex flex-col gap-1.5"><b>Help</b><a href="#/account" className="opacity-80">My orders</a><a href={`https://wa.me/${SETTINGS.whatsappNumber}`} className="opacity-80">Chat on WhatsApp</a><span className="opacity-80">Delivery: Kampala, Wakiso & beyond</span></div>
        <div className="flex flex-col gap-1.5"><b>We accept</b><span className="opacity-80">MTN Mobile Money · Airtel Money · Card · Cash on delivery</span></div>
      </div>
      <p className="text-center text-xs opacity-70 pb-6">© {new Date().getFullYear()} House of Clovera</p>
    </footer>
  );
}

/* ---------------- app ---------------- */
function Shell() {
  const { parts, query } = useHashRoute();
  const [search, setSearch] = useState(false);
  const [page, a] = parts;
  let view: ReactNode;
  switch (page) {
    case "shop": view = <ShopPage query={query} />; break;
    case "product": view = <ProductPage id={a ?? ""} />; break;
    case "wishlist": view = <WishlistPage />; break;
    case "cart": view = <CartPage />; break;
    case "checkout": view = <CheckoutPage />; break;
    case "order": view = <OrderPage number={a ?? ""} />; break;
    case "account": view = <AccountPage />; break;
    default: view = <HomePage />;
  }
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header onSearch={() => setSearch(true)} />
      <Announcement />
      <main>{view}</main>
      <Footer />
      <BottomNav active={page ?? ""} />
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </div>
  );
}

export default function CloveraApp() {
  return <StoreProvider><Shell /></StoreProvider>;
}
