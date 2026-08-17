import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('sanjivani_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('sanjivani_orders');
    return savedOrders ? JSON.parse(savedOrders) : [
      // Sample initial order for testing admin view
      {
        id: 'ORD-1001',
        date: new Date().toISOString(),
        customer: 'Ananya Sharma',
        items: [{ name: 'Fresh Farm Milk', quantity: 2, price: 65 }],
        total: 130,
        paymentMethod: 'Online UPI',
        status: 'Completed'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sanjivani_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sanjivani_orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product, quantityToAdd = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      const qty = product.quantity || quantityToAdd;

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + qty;
        return updated;
      }
      return [...prevCart, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const addOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      ...orderData,
      status: 'Completed'
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  return (
    <ProductContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, orders, addOrder }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
