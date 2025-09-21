import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importando as páginas
// paginas globais
import Login from './pages/global/login';
import Cadastro from './pages/global/cadastro';
import Home from './pages/global/home';
import Perfil from './pages/global/perfil';

// paginas cliente
import PaginaCliente from './pages/cliente/paginaCliente';
import FinalizarPedido from './pages/cliente/finalizarPedido';
import PedidosCliente from './pages/cliente/pedidosCliente';
import AvaliarPedido from './pages/cliente/avaliarPedido';

// paginas restaurante
import PaginaRestaurante from './pages/restaurante/paginaRestaurante';
import AddItemCardapio from './pages/restaurante/addItemCardapio';
import PedidosRestaurante from './pages/restaurante/pedidosRestaurante';
import EditarItemCardapio from './pages/restaurante/editarItemCardapio';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/paginaCliente" element={<PaginaCliente />} />
        <Route path="/finalizarPedido" element={<FinalizarPedido />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/paginaRestaurante" element={<PaginaRestaurante />} />
        <Route path="/addItemCardapio" element={<AddItemCardapio />} />
        <Route path="/pedidosRestaurante" element={<PedidosRestaurante />} />
        <Route path="/editarItemCardapio" element={<EditarItemCardapio />} />
        <Route path="/pedidosCliente" element={<PedidosCliente />} />
        <Route path="/avaliarPedido" element={<AvaliarPedido />} />
      </Routes>
    </BrowserRouter>
  );
}