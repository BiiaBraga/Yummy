import React, { useEffect } from 'react'
import { useState } from "react";
import { useLocation } from 'react-router-dom'
import { useUser } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';

function AvaliarPedido() {
    const apiRoot = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    
    const location = useLocation();
    const pedido = location.state;

    const { userType, userID, userName, setUserType, setUserID, setUserName } = useUser();

    const [ showPerfilOptions, setShowPerfilOptions ] = useState(false);

    const [ avaliacao, setAvaliacao ] = useState(5);
    const [ comentario, setComentario ] = useState("");

    const handleSairConta = () => {
        setUserType(null);
        setUserID(null);
        setUserName(null);
        navigate('/');
    }

    const handleAvaliarPedido = () => {
        const dataHoraAtual = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const [data, hora] = dataHoraAtual.split(' ');
        const [dia, mes, ano] = data.split('/');
        const dataHoraMySQL = `${ano}-${mes}-${dia} ${hora}`;

        try {
            fetch(`${apiRoot}/avaliarPedido`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pedido: pedido,
                    avaliacao: avaliacao,
                    comentario: comentario,
                    dataHora: dataHoraMySQL,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Pedido avaliado com sucesso!");
                    navigate(`/pagina${userType}`);
                }
            });
        } catch (error) {
            console.error("Erro ao avaliar pedido: ", error);
            alert("Erro ao avaliar pedido. Tente novamente.");
        }
    }

    useEffect(() => {
        if (!pedido || !pedido.Pedido || !pedido.Itens) {
            navigate(`/pagina${userType}`);
        }
    }, [pedido, navigate, userType]);

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
                <h3 className='card-title p-3 text-center'>Avaliar Pedido</h3>
                <div className='cart-card d-flex flex-column justify-content-center'>
                    <div className='cart-itens d-flex flex-column flex-fill mx-2 mb-3'>
                        {pedido.Itens.map((item) => (
                            <div key={item.ItemPedido.ItemPedidoID} className='d-flex flex-row justify-content-between'>
                                <div className='d-flex flex-column'>
                                    <span className='bold'>{item.Prato.Nome}</span>
                                    <span>obs: {item.ItemPedido.Observacao}</span>
                                </div>
                                <span className='bold'>{item.ItemPedido.Quantidade}x</span>
                            </div>
                        ))}
                    </div>
                    <hr/>

                    <p className='d-flex justify-content-end mx-3'>Total: R$ {pedido.Pedido.Total.toFixed(2)}</p>

                    <div className='d-flex flex-column text-center mx-2 mb-3'>
                        <label className='bold'>Avaliação:</label>
                        <select
                          className='card-select p-1'
                          value={avaliacao}
                          onChange={(e) => setAvaliacao(parseInt(e.target.value))}
                        >
                            <option value='1'>1</option>
                            <option value='2'>2</option>
                            <option value='3'>3</option>
                            <option value='4'>4</option>
                            <option value='5'>5</option>
                        </select>
                    </div>

                    <div className='d-flex flex-column mx-2 mb-3'>
                        <label className='bold text-center'>Comentário:</label>
                        <textarea className='card-input' rows='3' value={comentario} onChange={(e) => setComentario(e.target.value)}></textarea>
                    </div>

                    <div className="d-flex gap-3 justify-content-center flex-row">
                        <button className="red-button p-2" onClick={() => handleAvaliarPedido()}>Avaliar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AvaliarPedido;