import type { Product } from "@/types/product";
import type { AppliedCoupon } from "@/types/coupon";

export interface CartItem {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = "fanfar_cart";
const COUPON_STORAGE_KEY = "fanfar_coupon";
const EMPTY_ITEMS: CartItem[] = [];

let cartItems: CartItem[] = EMPTY_ITEMS;
let initialized = false;
let appliedCoupon: AppliedCoupon | null = null;
let couponInitialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_ITEMS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ITEMS;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_ITEMS;

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];

      const candidate = entry as { product?: Product; quantity?: unknown };

      if (
        !candidate.product ||
        typeof candidate.product.id !== "string" ||
        typeof candidate.quantity !== "number" ||
        candidate.quantity <= 0
      ) {
        return [];
      }

      return [
        {
          product: candidate.product,
          quantity: Math.floor(candidate.quantity),
        },
      ];
    });
  } catch {
    return EMPTY_ITEMS;
  }
}

function readCouponFromStorage(): AppliedCoupon | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<AppliedCoupon>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.code !== "string" ||
      (candidate.discount_type !== "percentage" &&
        candidate.discount_type !== "fixed") ||
      typeof candidate.discount_value !== "number" ||
      typeof candidate.min_purchase !== "number"
    ) {
      return null;
    }

    return {
      id: candidate.id,
      code: candidate.code,
      discount_type: candidate.discount_type,
      discount_value: candidate.discount_value,
      min_purchase: candidate.min_purchase,
      max_discount:
        typeof candidate.max_discount === "number"
          ? candidate.max_discount
          : null,
      free_shipping: candidate.free_shipping === true,
    };
  } catch {
    return null;
  }
}

function ensureInitialized() {
  if (!initialized && typeof window !== "undefined") {
    cartItems = readFromStorage();
    initialized = true;
  }
}

function ensureCouponInitialized() {
  if (!couponInitialized && typeof window !== "undefined") {
    appliedCoupon = readCouponFromStorage();
    couponInitialized = true;
  }
}

function commit(nextItems: CartItem[]) {
  cartItems = nextItems;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch {}
  }

  notifyListeners();
}

export function subscribe(listener: () => void) {
  ensureInitialized();
  ensureCouponInitialized();
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      cartItems = readFromStorage();
      notifyListeners();
    }

    if (event.key === COUPON_STORAGE_KEY) {
      appliedCoupon = readCouponFromStorage();
      notifyListeners();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getSnapshot() {
  ensureInitialized();
  return cartItems;
}

export function getServerSnapshot() {
  return EMPTY_ITEMS;
}

export function getCouponSnapshot() {
  ensureCouponInitialized();
  return appliedCoupon;
}

export function getServerCouponSnapshot() {
  return null;
}

export function applyCoupon(coupon: AppliedCoupon) {
  ensureCouponInitialized();
  appliedCoupon = coupon;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } catch {}
  }

  notifyListeners();
}

export function removeCoupon() {
  ensureCouponInitialized();
  appliedCoupon = null;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  }

  notifyListeners();
}

export function addToCart(product: Product, quantity = 1) {
  if (quantity <= 0 || product.stock <= 0) return;

  ensureInitialized();

  const existingItem = cartItems.find(
    (item) => item.product.id === product.id
  );

  if (existingItem) {
    commit(
      cartItems.map((item) =>
        item.product.id === product.id
          ? {
              product,
              quantity: Math.min(
                item.quantity + quantity,
                product.stock
              ),
            }
          : item
      )
    );
  } else {
    commit([
      ...cartItems,
      { product, quantity: Math.min(quantity, product.stock) },
    ]);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("fanfar:cart-toast", { detail: { product } })
    );
  }
}

export function setCartQuantity(product: Product, quantity: number) {
  ensureInitialized();

  if (quantity <= 0) {
    removeFromCart(product.id);
    return;
  }

  const maxQuantity = product.stock > 0 ? product.stock : quantity;

  commit(
    cartItems.map((item) =>
      item.product.id === product.id
        ? { ...item, product, quantity: Math.min(quantity, maxQuantity) }
        : item
    )
  );
}

export function removeFromCart(productId: string) {
  ensureInitialized();
  commit(cartItems.filter((item) => item.product.id !== productId));
}

export function clearCart() {
  ensureInitialized();
  commit([]);
  removeCoupon();
}
