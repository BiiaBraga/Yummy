def formataUsuario(usuario):
    return {
        "UserID": usuario[0],
        "Login": usuario[1],
        "Senha": usuario[2],
        "TipoUsuario": usuario[3]
    }

def formataCliente(cliente):
    return {
        "ClienteID": cliente[0],
        "Telefone": cliente[1],
        "Nome": cliente[2],
        "CPF": cliente[3]
    }

def formataRestaurante(restaurante):
    return {
        "RestauranteID": restaurante[0],
        "Telefone": restaurante[1],
        "Culinaria": restaurante[2],
        "Nome": restaurante[3],
        "NotaMedia": restaurante[4]
    }

def formataEndereco(endereco):
    return {
        "EnderecoID": endereco[0],
        "UserID": endereco[1],
        "Rua": endereco[2],
        "Numero": endereco[3],
        "Bairro": endereco[4],
        "CEP": endereco[5]
    }

def formataPedido(pedido):
    return {
        "PedidoID": pedido[0],
        "ClienteID": pedido[1],
        "RestauranteID": pedido[2],
        "EnderecoID": pedido[3],
        "DataHora": pedido[4],
        "FormaPag": pedido[5],
        "StatusPedido": pedido[6],
        "Total": pedido[7]
    }

def formataPrato(prato):
    if not prato:
        return None
    return {
        "PratoID": prato[0],
        "RestauranteID": prato[1],
        "Nome": prato[2],
        "Descricao": prato[3],
        "Preco": prato[4],
        "Disponibilidade": prato[5],
        "Estoque": prato[6],
        "CategoriaID": prato[7],
        "URL_Imagem": prato[8],
        "NomeRestaurante": prato[9],
        "NomeCategoria": prato[10]
    }

def formataItemPedido(item):
    return {
        "ItemPedidoID": item[0],
        "PedidoID": item[1],
        "PratoID": item[2],
        "Quantidade": item[3],
        "Observacao": item[4]
    }

def formataAvaliacao(avaliacao):
    return {
        "PedidoID": avaliacao[0],
        "RestauranteID": avaliacao[1],
        "ClienteID": avaliacao[2],
        "DataHora": avaliacao[3],
        "Nota": avaliacao[4],
        "Feedback": avaliacao[5]
    }

def formataHorario(horario):
    return {
        "HrFuncionamentoID": horario[0],
        "RestauranteID": horario[1],
        "DiaSemana": horario[2],
        "HrAbertura": horario[3],
        "HrFechamento": horario[4]
    }