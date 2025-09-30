-- --------------------------------------------------------------------------------------
-- Criação do banco de dados e das tabelas do projeto Yummy
CREATE SCHEMA IF NOT EXISTS Yummy;

USE Yummy;

CREATE TABLE IF NOT EXISTS Yummy.Usuario(
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Login VARCHAR(50) NOT NULL UNIQUE,
    Senha VARCHAR(50) NOT NULL,
	TipoUsuario ENUM('Cliente', 'Restaurante') NOT NULL
);

CREATE TABLE IF NOT EXISTS Yummy.Restaurante(
    RestauranteID INT PRIMARY KEY,
    Telefone VARCHAR(50) NOT NULL,
    Culinaria VARCHAR(50) NOT NULL,
    Nome VARCHAR(50) NOT NULL UNIQUE,
    NotaMedia FLOAT,
    FOREIGN KEY (RestauranteID) REFERENCES Yummy.Usuario(UserID)
);

CREATE TABLE IF NOT EXISTS Yummy.HorariosFuncionamento(
	HrFuncionamentoID INT PRIMARY KEY AUTO_INCREMENT,
    RestauranteID INT NOT NULL,
    DiaSemana VARCHAR(50) NOT NULL,
    HrAbertura VARCHAR(50) NOT NULL,
    HrFechamento VARCHAR(50) NOT NULL,
    FOREIGN KEY (RestauranteID) REFERENCES Yummy.Restaurante(RestauranteID)
);

CREATE TABLE IF NOT EXISTS Yummy.Cliente(
    ClienteID INT PRIMARY KEY,
    Telefone VARCHAR(50) NOT NULL,
    Nome VARCHAR(50) NOT NULL,
    CPF VARCHAR(11) NOT NULL UNIQUE,
    FOREIGN KEY (ClienteID) REFERENCES Yummy.Usuario(UserID)
);

CREATE TABLE IF NOT EXISTS Yummy.Endereco(
    EnderecoID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    Rua VARCHAR(50) NOT NULL,
    Numero VARCHAR(10) NOT NULL,
    Bairro VARCHAR(50) NOT NULL,
    CEP VARCHAR(50) NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Yummy.Usuario(UserID)
);

CREATE TABLE IF NOT EXISTS Yummy.Pedido(
    PedidoID INT PRIMARY KEY AUTO_INCREMENT,
    ClienteID INT NOT NULL,
    RestauranteID INT NOT NULL,
    EnderecoID INT NOT NULL,
    DataHora DATETIME NOT NULL,
    FormaPag VARCHAR(50) NOT NULL,
    StatusPedido VARCHAR(50) NOT NULL,
    Total FLOAT NOT NULL,
    FOREIGN KEY (ClienteID) REFERENCES Yummy.Cliente(ClienteID),
    FOREIGN KEY (RestauranteID) REFERENCES Yummy.Restaurante(RestauranteID),
    FOREIGN KEY (EnderecoID) REFERENCES Yummy.Endereco(EnderecoID)
);

CREATE TABLE IF NOT EXISTS Yummy.CategoriasPratos(
	CategoriaID INT PRIMARY KEY AUTO_INCREMENT,
    NomeCategoria VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Yummy.Prato(
    PratoID INT PRIMARY KEY AUTO_INCREMENT,
    RestauranteID INT NOT NULL,
    Nome VARCHAR(50) NOT NULL,
    Descricao VARCHAR(200) NOT NULL,
    Preco FLOAT NOT NULL,
    Disponibilidade BOOLEAN NOT NULL,
    Estoque INT NOT NULL,
    CategoriaID INT NOT NULL,
    URL_Imagem VARCHAR(255),
    FOREIGN KEY (RestauranteID) REFERENCES Yummy.Restaurante(RestauranteID),
    FOREIGN KEY (CategoriaID) REFERENCES Yummy.CategoriasPratos(CategoriaID)
);

CREATE TABLE IF NOT EXISTS Yummy.ItemPedido(
    ItemPedidoID INT PRIMARY KEY AUTO_INCREMENT,
    PedidoID INT NOT NULL,
    PratoID INT NOT NULL,
    Quantidade INT NOT NULL,
    Observacao VARCHAR(100) NOT NULL,
    FOREIGN KEY (PedidoID) REFERENCES Yummy.Pedido(PedidoID),
    FOREIGN KEY (PratoID) REFERENCES Yummy.Prato(PratoID)
);

CREATE TABLE IF NOT EXISTS Yummy.Avaliacao(
    PedidoID INT PRIMARY KEY,
    RestauranteID INT NOT NULL,
    ClienteID INT NOT NULL,
    DataHora DATETIME NOT NULL,
    Nota INT NOT NULL,
    Feedback VARCHAR(200) NOT NULL,
    FOREIGN KEY (PedidoID) REFERENCES Yummy.Pedido(PedidoID),
    FOREIGN KEY (RestauranteID) REFERENCES Yummy.Restaurante(RestauranteID),
    FOREIGN KEY (ClienteID) REFERENCES Yummy.Cliente(ClienteID)
);

-- --------------------------------------------------------------------------------------
-- criaçao de triggers
-- --------------------------------------------------------------------------------------
-- Trigger que atualiza a nota média do restaurante após uma avaliação
DELIMITER //
CREATE TRIGGER IF NOT EXISTS atualiza_nota_media
AFTER INSERT ON Yummy.Avaliacao
FOR EACH ROW
BEGIN
    DECLARE media FLOAT;
    SELECT AVG(Nota) INTO media FROM Yummy.Avaliacao WHERE RestauranteID = NEW.RestauranteID;
    UPDATE Yummy.Restaurante SET NotaMedia = media WHERE RestauranteID = NEW.RestauranteID;
END
// DELIMITER ;

-- Trigger que atualiza o status do pedido após a avaliação
DELIMITER //
CREATE TRIGGER IF NOT EXISTS atualiza_status_pedido
AFTER INSERT ON Yummy.Avaliacao
FOR EACH ROW
BEGIN
    UPDATE Yummy.Pedido SET StatusPedido = 'Avaliado' WHERE PedidoID = NEW.PedidoID;
END//
DELIMITER ;

-- Trigger que decrementa o estoque e atualiza a disponibilidade se necessario
DELIMITER //
CREATE TRIGGER IF NOT EXISTS atualiza_estoque_disponibilidade
AFTER INSERT ON Yummy.ItemPedido
FOR EACH ROW
BEGIN
    -- Decrementa o estoque
    UPDATE Yummy.Prato
    SET Estoque = Estoque - NEW.Quantidade
    WHERE PratoID = NEW.PratoID;

    -- Se o estoque zerar, muda disponibilidade para FALSE
    UPDATE Yummy.Prato
    SET Disponibilidade = FALSE
    WHERE PratoID = NEW.PratoID
      AND Estoque <= 0;
END//
DELIMITER ;

-- Trigger que incrementa o estoque caso pedido seja cancelado e atualiza a disponibilidade se necessario
DELIMITER //
CREATE TRIGGER IF NOT EXISTS reverter_estoque_cancelamento
AFTER UPDATE ON Yummy.Pedido
FOR EACH ROW
BEGIN
    IF NEW.StatusPedido = 'Cancelado' AND OLD.StatusPedido = 'Pendente' THEN
        -- Reverta o estoque para cada item do pedido
        UPDATE Yummy.Prato p
        JOIN Yummy.ItemPedido ip ON p.PratoID = ip.PratoID
        SET p.Estoque = p.Estoque + ip.Quantidade
        WHERE ip.PedidoID = NEW.PedidoID;

        -- Restaure disponibilidade se estoque > 0 após reversão
        UPDATE Yummy.Prato
        SET Disponibilidade = TRUE
        WHERE PratoID IN (SELECT DISTINCT PratoID FROM Yummy.ItemPedido WHERE PedidoID = NEW.PedidoID)
          AND Estoque > 0;
    END IF;
END//
DELIMITER ;

-- Trigger que verifica disponibilidade do prato antes de fazer o pedido
DELIMITER //
CREATE TRIGGER IF NOT EXISTS verifica_disponibilidade
BEFORE INSERT ON Yummy.ItemPedido
FOR EACH ROW
BEGIN
    DECLARE qtd_disponivel INT;
    DECLARE disponivel BOOLEAN;

    SELECT Estoque, Disponibilidade
    INTO qtd_disponivel, disponivel
    FROM Yummy.Prato
    WHERE PratoID = NEW.PratoID;

    IF disponivel = FALSE OR qtd_disponivel < NEW.Quantidade THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Prato indisponível ou estoque insuficiente';
    END IF;
END//
DELIMITER ;
-- --------------------------------------------------------------------------------------
-- criação de procedures
-- --------------------------------------------------------------------------------------
-- Procedure que retorna os pedidos nao finalizados de um restaurante
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS pedidos_nao_finalizados(IN RestauranteID INT)
BEGIN
    SELECT * FROM Yummy.Pedido WHERE RestauranteID = RestauranteID AND StatusPedido != 'Finalizado' AND StatusPedido != 'Avaliado' ORDER BY DataHora;
END//
DELIMITER ;

-- Procedure que retorna o lucro de um restaurante em um intervalo de tempo
DELIMITER //
CREATE PROCEDURE lucro_restaurante(
    IN pRestauranteID INT,
    IN pDataInicio DATETIME,
    IN pDataFim DATETIME,
    OUT pLucro FLOAT
)
BEGIN
    SELECT IFNULL(SUM(Total), 0) * 0.97
    INTO pLucro
    FROM Yummy.Pedido
    WHERE RestauranteID = pRestauranteID
      AND DataHora BETWEEN pDataInicio AND pDataFim;
END
// DELIMITER ;

-- Procedure que retorna o numero de pedidos de um restaurante em um intervalo de tempo
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS num_pedidos_restaurante(IN RestauranteID INT, IN DataInicio DATETIME, IN DataFim DATETIME, OUT num_pedidos INT)
BEGIN
    SELECT COUNT(*) INTO num_pedidos FROM Yummy.Pedido WHERE RestauranteID = RestauranteID AND DataHora BETWEEN DataInicio AND DataFim;
END//
-- --------------------------------------------------------------------------------------
-- criação de functions
-- --------------------------------------------------------------------------------------
-- Function que retorna o numero de pedidos de um prato
DELIMITER //
CREATE FUNCTION IF NOT EXISTS num_pedidos_prato(PratoID INT) 
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE num_pedidos INT;
    SELECT SUM(Quantidade) INTO num_pedidos FROM Yummy.ItemPedido WHERE PratoID = PratoID;
    RETURN num_pedidos;
END//

-- Function que retorna o numero de avaliacoes de um restaurante
DELIMITER //
CREATE FUNCTION IF NOT EXISTS num_avaliacoes_restaurante(RestauranteID INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE num_avaliacoes INT;
    SELECT COUNT(*) INTO num_avaliacoes FROM Yummy.Avaliacao WHERE RestauranteID = RestauranteID;
    RETURN num_avaliacoes;
END//

-- Function que retorna o prato mais pedido de um restaurante
DELIMITER //
CREATE FUNCTION IF NOT EXISTS prato_mais_pedido(RestauranteID INT)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE prato_mais_pedido INT;
    SELECT PratoID INTO prato_mais_pedido FROM Yummy.ItemPedido JOIN Yummy.Pedido ON ItemPedido.PedidoID = Pedido.PedidoID WHERE RestauranteID = RestauranteID GROUP BY PratoID ORDER BY SUM(Quantidade) DESC LIMIT 1;
    RETURN prato_mais_pedido;
END//