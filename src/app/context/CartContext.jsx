"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // LOAD FROM LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ADD TO CART
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id && item.size === product.size
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size
            ? { ...item, qty: item.qty + product.qty }
            : item
        );
      }

      return [...prev, product];
    });
  };

  // CLEAR CART
const clearCart = () => {
  setCart([]);
}; 
  // REMOVE ITEM
  const removeFromCart = (id, size) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.id === id && item.size === size)
      )
    );
  };

  // UPDATE QUANTITY
  const updateQty = (id, size, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id && item.size === size) {
          return {
            ...item,
            qty:
              type === "inc"
                ? item.qty + 1
                : Math.max(item.qty - 1, 1),
          };
        }
        return item;
      })
    );
  };

  return (
  <CartContext.Provider
    value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart, // ✅ ADD THIS
    }}
  >
    {children}
  </CartContext.Provider>
);
}

export const useCart = () => useContext(CartContext);