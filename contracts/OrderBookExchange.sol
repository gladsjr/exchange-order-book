// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title OrderBookExchange
 * @dev Exchange descentralizada simples com order book para fins didáticos
 * Opera com dois tokens ERC-20 específicos definidos no construtor
 */
contract OrderBookExchange is ReentrancyGuard {
    // Tokens que serão negociados
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    // Estrutura de uma ordem
    struct Order {
        uint256 id;
        address trader;
        bool isBuy; // true = compra tokenA com tokenB, false = vende tokenA por tokenB
        uint256 amountA; // quantidade de tokenA
        uint256 amountB; // quantidade de tokenB
        uint256 filledA; // quantidade de tokenA já executada
        uint256 filledB; // quantidade de tokenB já executada
        bool isActive;
    }

    // Armazenamento das ordens
    mapping(uint256 => Order) public orders;
    uint256[] public buyOrders; // IDs das ordens de compra ativas
    uint256[] public sellOrders; // IDs das ordens de venda ativas

    uint256 public nextOrderId = 1;

    // Eventos
    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        bool isBuy,
        uint256 amountA,
        uint256 amountB
    );

    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 amountA,
        uint256 amountB
    );

    event OrderCanceled(uint256 indexed orderId);

    /**
     * @dev Construtor que define os dois tokens que serão negociados
     */
    constructor(address _tokenA, address _tokenB) {
        require(
            _tokenA != address(0) && _tokenB != address(0),
            "Invalid token addresses"
        );
        require(_tokenA != _tokenB, "Tokens must be different");

        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
     * @dev Cria uma ordem de compra (comprar tokenA com tokenB)
     */
    function createBuyOrder(
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        require(
            tokenB.balanceOf(msg.sender) >= amountB,
            "Insufficient tokenB balance"
        );
        require(
            tokenB.allowance(msg.sender, address(this)) >= amountB,
            "Insufficient tokenB allowance"
        );

        // Transfere tokenB para o contrato
        tokenB.transferFrom(msg.sender, address(this), amountB);

        // Cria a ordem
        orders[nextOrderId] = Order({
            id: nextOrderId,
            trader: msg.sender,
            isBuy: true,
            amountA: amountA,
            amountB: amountB,
            filledA: 0,
            filledB: 0,
            isActive: true
        });

        buyOrders.push(nextOrderId);

        emit OrderCreated(nextOrderId, msg.sender, true, amountA, amountB);

        // Tenta fazer match imediatamente
        _tryMatchOrder(nextOrderId);

        nextOrderId++;
    }

    /**
     * @dev Cria uma ordem de venda (vender tokenA por tokenB)
     */
    function createSellOrder(
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        require(
            tokenA.balanceOf(msg.sender) >= amountA,
            "Insufficient tokenA balance"
        );
        require(
            tokenA.allowance(msg.sender, address(this)) >= amountA,
            "Insufficient tokenA allowance"
        );

        // Transfere tokenA para o contrato
        tokenA.transferFrom(msg.sender, address(this), amountA);

        // Cria a ordem
        orders[nextOrderId] = Order({
            id: nextOrderId,
            trader: msg.sender,
            isBuy: false,
            amountA: amountA,
            amountB: amountB,
            filledA: 0,
            filledB: 0,
            isActive: true
        });

        sellOrders.push(nextOrderId);

        emit OrderCreated(nextOrderId, msg.sender, false, amountA, amountB);

        // Tenta fazer match imediatamente
        _tryMatchOrder(nextOrderId);

        nextOrderId++;
    }

    /**
     * @dev Cancela uma ordem ativa
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(order.trader == msg.sender, "Not order owner");

        order.isActive = false;

        // Devolve os tokens não executados
        if (order.isBuy) {
            uint256 refundB = order.amountB - order.filledB;
            if (refundB > 0) {
                tokenB.transfer(order.trader, refundB);
            }
            _removeFromBuyOrders(orderId);
        } else {
            uint256 refundA = order.amountA - order.filledA;
            if (refundA > 0) {
                tokenA.transfer(order.trader, refundA);
            }
            _removeFromSellOrders(orderId);
        }

        emit OrderCanceled(orderId);
    }

    /**
     * @dev Tenta fazer match de uma ordem com ordens existentes
     */
    function _tryMatchOrder(uint256 newOrderId) internal {
        Order storage newOrder = orders[newOrderId];

        if (newOrder.isBuy) {
            // Ordem de compra: procura ordens de venda compatíveis
            _matchBuyOrder(newOrderId);
        } else {
            // Ordem de venda: procura ordens de compra compatíveis
            _matchSellOrder(newOrderId);
        }
    }

    /**
     * @dev Faz match de uma ordem de compra com ordens de venda
     */
    function _matchBuyOrder(uint256 buyOrderId) internal {
        Order storage buyOrder = orders[buyOrderId];

        for (uint256 i = 0; i < sellOrders.length; i++) {
            uint256 sellOrderId = sellOrders[i];
            Order storage sellOrder = orders[sellOrderId];

            if (!sellOrder.isActive) continue;

            // Verifica se as ordens são compatíveis (preços cruzados)
            // buyOrder quer: amountA tokenA por amountB tokenB
            // sellOrder oferece: amountA tokenA por amountB tokenB
            // Compatível se: buyOrder.amountB/buyOrder.amountA >= sellOrder.amountB/sellOrder.amountA
            if (
                buyOrder.amountB * sellOrder.amountA >=
                sellOrder.amountB * buyOrder.amountA
            ) {
                _executeMatch(buyOrderId, sellOrderId);

                if (!buyOrder.isActive) break; // Ordem de compra completamente executada
            }
        }
    }

    /**
     * @dev Faz match de uma ordem de venda com ordens de compra
     */
    function _matchSellOrder(uint256 sellOrderId) internal {
        Order storage sellOrder = orders[sellOrderId];

        for (uint256 i = 0; i < buyOrders.length; i++) {
            uint256 buyOrderId = buyOrders[i];
            Order storage buyOrder = orders[buyOrderId];

            if (!buyOrder.isActive) continue;

            // Verifica se as ordens são compatíveis
            if (
                buyOrder.amountB * sellOrder.amountA >=
                sellOrder.amountB * buyOrder.amountA
            ) {
                _executeMatch(buyOrderId, sellOrderId);

                if (!sellOrder.isActive) break; // Ordem de venda completamente executada
            }
        }
    }

    /**
     * @dev Executa o match entre duas ordens compatíveis
     */
    function _executeMatch(uint256 buyOrderId, uint256 sellOrderId) internal {
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];

        // Calcula quantidades a serem executadas (pega o menor entre as ordens)
        uint256 remainingBuyA = buyOrder.amountA - buyOrder.filledA;
        uint256 remainingSellA = sellOrder.amountA - sellOrder.filledA;
        uint256 executeA = remainingBuyA < remainingSellA
            ? remainingBuyA
            : remainingSellA;

        // Calcula executeB proporcionalmente baseado na ordem de venda
        uint256 executeB = (executeA * sellOrder.amountB) / sellOrder.amountA;

        // Atualiza as ordens
        buyOrder.filledA += executeA;
        buyOrder.filledB += executeB;
        sellOrder.filledA += executeA;
        sellOrder.filledB += executeB;

        // Transfere tokens
        tokenA.transfer(buyOrder.trader, executeA); // Comprador recebe tokenA
        tokenB.transfer(sellOrder.trader, executeB); // Vendedor recebe tokenB

        emit OrderMatched(buyOrderId, sellOrderId, executeA, executeB);

        // Verifica se as ordens foram completamente executadas
        if (buyOrder.filledA == buyOrder.amountA) {
            buyOrder.isActive = false;
            _removeFromBuyOrders(buyOrderId);

            // Devolve tokenB não utilizado (se houver)
            uint256 refundB = buyOrder.amountB - buyOrder.filledB;
            if (refundB > 0) {
                tokenB.transfer(buyOrder.trader, refundB);
            }
        }

        if (sellOrder.filledA == sellOrder.amountA) {
            sellOrder.isActive = false;
            _removeFromSellOrders(sellOrderId);
        }
    }

    /**
     * @dev Remove ordem da lista de ordens de compra
     */
    function _removeFromBuyOrders(uint256 orderId) internal {
        for (uint256 i = 0; i < buyOrders.length; i++) {
            if (buyOrders[i] == orderId) {
                buyOrders[i] = buyOrders[buyOrders.length - 1];
                buyOrders.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove ordem da lista de ordens de venda
     */
    function _removeFromSellOrders(uint256 orderId) internal {
        for (uint256 i = 0; i < sellOrders.length; i++) {
            if (sellOrders[i] == orderId) {
                sellOrders[i] = sellOrders[sellOrders.length - 1];
                sellOrders.pop();
                break;
            }
        }
    }

    /**
     * @dev Retorna todas as ordens de compra ativas
     */
    function getActiveBuyOrders() external view returns (uint256[] memory) {
        uint256[] memory activeBuyOrders = new uint256[](buyOrders.length);
        uint256 count = 0;

        for (uint256 i = 0; i < buyOrders.length; i++) {
            if (orders[buyOrders[i]].isActive) {
                activeBuyOrders[count] = buyOrders[i];
                count++;
            }
        }

        // Redimensiona o array para remover elementos vazios
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeBuyOrders[i];
        }

        return result;
    }

    /**
     * @dev Retorna todas as ordens de venda ativas
     */
    function getActiveSellOrders() external view returns (uint256[] memory) {
        uint256[] memory activeSellOrders = new uint256[](sellOrders.length);
        uint256 count = 0;

        for (uint256 i = 0; i < sellOrders.length; i++) {
            if (orders[sellOrders[i]].isActive) {
                activeSellOrders[count] = sellOrders[i];
                count++;
            }
        }

        // Redimensiona o array para remover elementos vazios
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeSellOrders[i];
        }

        return result;
    }

    /**
     * @dev Retorna informações de uma ordem específica
     */
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
