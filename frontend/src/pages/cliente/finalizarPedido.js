import React, { useEffect } from 'react'
import { useState } from "react";
import { useLocation } from 'react-router-dom'
import { useUser } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/cartContext';

function FinalizarPedido() {
    const apiRoot = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();

    const { clearCart } = useCart();
    const location = useLocation();
    const cartItems = location.state.cartItems;

    const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();

    const [ pagamento, setPagamento ] = useState('dinheiro');
    const [ showPerfilOptions, setShowPerfilOptions ] = useState(false);

    const handleSairConta = () => {
        setUserType(null);
        setUserID(null);
        setUserName(null);
        navigate('/');
    }

    const handleFinalizarPedido = () => {
        if (cartItems.length === 0) {
            alert("Adicione itens ao carrinho para finalizar o pedido.");
            return;
        }

        const dataHoraAtual = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const [data, hora] = dataHoraAtual.split(' ');
        const [dia, mes, ano] = data.split('/');
        const dataHoraMySQL = `${ano}-${mes}-${dia} ${hora}`;

        try {
            fetch(`${apiRoot}/pedido`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clienteID: userID,
                    itens: cartItems,
                    pagamento: pagamento,
                    dataHora: dataHoraMySQL,
                }),
            })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Erro na requisição');
                }
                return res.json();
            })
            .then((data) => {
                if (data !== undefined) {
                    alert("Pedido realizado com sucesso!");
                    clearCart();
                    navigate("/paginaCliente");
                } else {
                    alert("Erro ao realizar o pedido.");
                }
            })
            .catch((error) => {
                console.error("Erro ao realizar pedido: ", error);
                alert("Erro ao realizar pedido. Tente novamente.");
            });
        } catch (error) {
            console.error("Erro ao realizar pedido: ", error);
            alert("Erro ao realizar pedido. Tente novamente");
        }
    }

    useEffect(() => {
        if (!userType || !userID || !userName) {
            navigate('/');
        }
        if (!cartItems) {
            navigate('/paginaCliente');
        }
    } , [userType, userID, userName, navigate, cartItems]);


    return (
        <div className="screen d-flex flex-column align-items-center justify-content-center no-select">
            <div className="background"></div>
            <header className="header d-flex justify-content-between p-3">
                <div className="d-flex align-items-center gap-4">
                    <div className="header-title" onClick={() => navigate("/")}>Yummy</div>
                    <div className="header-subtitle p-2" onClick={() => navigate(`/pagina${userType}`)}>
                        Inicio
                    </div>
                </div>

            <div className="d-flex align-items-center gap-4">
                <div className="profile-circle" onClick={() => setShowPerfilOptions(!showPerfilOptions)}></div>
                    {showPerfilOptions && (
                        <div className="profile-options d-flex flex-column p-3 m-2">
                        <h4 className="profile-options-text align-self-center mb-3 bold">
                            Olá, {userName}!
                        </h4>
                        <button className="red-button p-2 mb-2" onClick={() => navigate("/perfil")}>
                            Perfil
                        </button>
                        <button className="red-button p-2 mb-2" onClick={() => navigate("/pedidosCliente")}>
                            Pedidos
                        </button>
                        <button className="red-button p-2" onClick={() => handleSairConta()}>
                            Sair
                        </button>
                        </div>
                    )}
                </div>
            </header>
            
          <div className="card col-10 d-flex flex-column align-items-center justify-content-center mt-4 mb-4 p-4" style={{maxWidth: "400px"}}>
                <h3 className='card-title p-3 text-center'>Finalizar Pedido</h3>
                <div className='cart-card d-flex flex-column justify-content-center'>
                    <div className='cart-itens d-flex flex-column flex-fill mx-2 mb-3'>
                        {cartItems.map((item, index) => (
                            <div key={index}>
                              <div className="d-flex p-2 mx-2 justify-content-between">
                                  {item.Nome} - R$ {item.Preco.toFixed(2)}
                                  <div className="d-flex gap-1">
                                      <span>{item.Quantidade}</span>
                                  </div>
                              </div>
                              <p className='cart-item mb-2 p-2 mx-2'>Obs: {item.Observacao}</p>
                            </div>
                        ))}
                    </div>
                    <hr/>

                    <p className='d-flex justify-content-end mx-3'>Total: R$ {cartItems.reduce((acc, item) => acc + item.Preco * item.Quantidade, 0).toFixed(2)}</p>
                    
                    <select className="card-select mb-3 p-2" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartaoDebito">Cartão (Débito)</option>
                        <option value="cartaoCredito">Cartão (Crédito)</option>
                        <option value="pix">Pix</option>
                    </select>

                    <div className="d-flex gap-3 justify-content-center flex-row">
                        <button className="red-button p-2" onClick={() => navigate("/paginaCliente")}>Adicionar mais itens</button>
                        <button className="red-button p-2" onClick={() => handleFinalizarPedido()}>Finalizar Pedido</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FinalizarPedido;