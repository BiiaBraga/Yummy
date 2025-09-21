import React, { createContext, useContext, useState } from "react";

// Criação do contexto
const CartContext = createContext();

// Provedor do contexto
export const CartProvider = ({ children }) => {
  class Item {
    constructor(PratoID, RestauranteID, NomePrato, Descricao, Preco, Observacao) {
      this.PratoID = PratoID;
      this.RestauranteID = RestauranteID;
      this.NomePrato = NomePrato;
      this.Descricao = Descricao;
      this.Preco = Preco;
      this.Quantidade = 1;
      this.Observacao = Observacao;
    }
  }

  const [cartItems, setCartItems] = useState([]);
  

  // Função para adicionar item ao carrinho
  const addToCart = (item) => {
    const itemIndex = cartItems.findIndex((cartItem) => cartItem.PratoID === item.PratoID && cartItem.Observacao === item.Observacao); // Verifica se ja existe o item no carrinho

    if (itemIndex === -1) { // Se não existir, adiciona um novo item ao carrinho
      setCartItems([...cartItems, new Item(item.PratoID, item.RestauranteID, item.Nome, item.Descricao, item.Preco, item.Observacao)]);
    } else { // Se existir, incrementa a quantidade do item no carrinho
      // Incrementa a quantidade do item no carrinho
      const newCartItems = [...cartItems];
      newCartItems[itemIndex].Quantidade += 1;
      setCartItems(newCartItems);
    }
  }

  // Função para remover item do carrinho
  const removeFromCart = (item) => {
    const itemIndex = cartItems.findIndex((cartItem) => cartItem.PratoID === item.PratoID);

    if (itemIndex === -1) {
      return;
    }

    const newCartItems = [...cartItems];
    newCartItems[itemIndex].Quantidade -= 1;

    if (newCartItems[itemIndex].Quantidade === 0) {
      newCartItems.splice(itemIndex, 1);
    }

    setCartItems(newCartItems);
  }

  const removeFromCartAll = (item) => {
    const itemIndex = cartItems.findIndex((cartItem) => cartItem.PratoID === item.PratoID);

    if (itemIndex === -1) {
      return;
    }

    const newCartItems = [...cartItems];
    newCartItems.splice(itemIndex, 1);

    setCartItems(newCartItems);
  }

  // Função para limpar o carrinho
  const clearCart = () => {
    setCartItems([]);
  };

  // Objeto de valor que será passado pelo contexto
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    removeFromCartAll
  };

  return ( <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
  );
};

// Hook personalizado para acessar o contexto
export const useCart = () => useContext(CartContext);