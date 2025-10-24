// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title OrderBookExchange
 * @dev Exchange descentralizada simples com modelo de ofertas diretas para fins didáticos
 * Opera com dois tokens ERC-20 específicos definidos no construtor
 * Modelo simplificado: usuário cria oferta e outro usuário aceita diretamente
 */
contract OrderBookExchange is ReentrancyGuard {
    // Tokens que serão negociados
    IERC20 public immutable tokenA; // MPE1
    IERC20 public immutable tokenB; // MPE2

    // Estrutura de uma oferta
    struct Offer {
        uint256 id;
        address creator;
        bool isOfferA; // true = oferece tokenA por tokenB, false = oferece tokenB por tokenA
        uint256 amountOffered; // quantidade oferecida
        uint256 amountWanted; // quantidade desejada em troca
        bool isActive;
    }

    // Armazenamento das ofertas
    mapping(uint256 => Offer) public offers;
    uint256[] public offersA; // IDs das ofertas de tokenA por tokenB
    uint256[] public offersB; // IDs das ofertas de tokenB por tokenA

    uint256 public nextOfferId = 1;

    // Eventos
    event OfferCreated(
        uint256 indexed offerId,
        address indexed creator,
        bool isOfferA,
        uint256 amountOffered,
        uint256 amountWanted
    );

    event OfferAccepted(
        uint256 indexed offerId,
        address indexed creator,
        address indexed acceptor,
        uint256 amountOffered,
        uint256 amountWanted
    );

    event OfferCanceled(uint256 indexed offerId);

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
     * @dev Cria uma oferta de tokenA por tokenB
     */
    function createOfferA(
        uint256 amountOffered,
        uint256 amountWanted
    ) external nonReentrant {
        require(
            amountOffered > 0 && amountWanted > 0,
            "Amounts must be greater than 0"
        );
        require(
            tokenA.balanceOf(msg.sender) >= amountOffered,
            "Insufficient tokenA balance"
        );
        require(
            tokenA.allowance(msg.sender, address(this)) >= amountOffered,
            "Insufficient tokenA allowance"
        );

        // Transfere tokenA para o contrato
        tokenA.transferFrom(msg.sender, address(this), amountOffered);

        // Cria a oferta
        offers[nextOfferId] = Offer({
            id: nextOfferId,
            creator: msg.sender,
            isOfferA: true,
            amountOffered: amountOffered,
            amountWanted: amountWanted,
            isActive: true
        });

        offersA.push(nextOfferId);

        emit OfferCreated(
            nextOfferId,
            msg.sender,
            true,
            amountOffered,
            amountWanted
        );

        nextOfferId++;
    }

    /**
     * @dev Cria uma oferta de tokenB por tokenA
     */
    function createOfferB(
        uint256 amountOffered,
        uint256 amountWanted
    ) external nonReentrant {
        require(
            amountOffered > 0 && amountWanted > 0,
            "Amounts must be greater than 0"
        );
        require(
            tokenB.balanceOf(msg.sender) >= amountOffered,
            "Insufficient tokenB balance"
        );
        require(
            tokenB.allowance(msg.sender, address(this)) >= amountOffered,
            "Insufficient tokenB allowance"
        );

        // Transfere tokenB para o contrato
        tokenB.transferFrom(msg.sender, address(this), amountOffered);

        // Cria a oferta
        offers[nextOfferId] = Offer({
            id: nextOfferId,
            creator: msg.sender,
            isOfferA: false,
            amountOffered: amountOffered,
            amountWanted: amountWanted,
            isActive: true
        });

        offersB.push(nextOfferId);

        emit OfferCreated(
            nextOfferId,
            msg.sender,
            false,
            amountOffered,
            amountWanted
        );

        nextOfferId++;
    }

    /**
     * @dev Aceita uma oferta existente
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer not active");
        require(offer.creator != msg.sender, "Cannot accept own offer");

        if (offer.isOfferA) {
            // Oferta de tokenA por tokenB
            // Acceptor precisa ter tokenB suficiente
            require(
                tokenB.balanceOf(msg.sender) >= offer.amountWanted,
                "Insufficient tokenB balance"
            );
            require(
                tokenB.allowance(msg.sender, address(this)) >=
                    offer.amountWanted,
                "Insufficient tokenB allowance"
            );

            // Transfere tokenB do acceptor para o creator
            tokenB.transferFrom(msg.sender, offer.creator, offer.amountWanted);

            // Transfere tokenA do contrato para o acceptor
            tokenA.transfer(msg.sender, offer.amountOffered);
        } else {
            // Oferta de tokenB por tokenA
            // Acceptor precisa ter tokenA suficiente
            require(
                tokenA.balanceOf(msg.sender) >= offer.amountWanted,
                "Insufficient tokenA balance"
            );
            require(
                tokenA.allowance(msg.sender, address(this)) >=
                    offer.amountWanted,
                "Insufficient tokenA allowance"
            );

            // Transfere tokenA do acceptor para o creator
            tokenA.transferFrom(msg.sender, offer.creator, offer.amountWanted);

            // Transfere tokenB do contrato para o acceptor
            tokenB.transfer(msg.sender, offer.amountOffered);
        }

        offer.isActive = false;

        if (offer.isOfferA) {
            _removeFromOffersA(offerId);
        } else {
            _removeFromOffersB(offerId);
        }

        emit OfferAccepted(
            offerId,
            offer.creator,
            msg.sender,
            offer.amountOffered,
            offer.amountWanted
        );
    }

    /**
     * @dev Cancela uma oferta ativa
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer not active");
        require(offer.creator == msg.sender, "Not offer creator");

        offer.isActive = false;

        // Devolve os tokens ao criador
        if (offer.isOfferA) {
            tokenA.transfer(offer.creator, offer.amountOffered);
            _removeFromOffersA(offerId);
        } else {
            tokenB.transfer(offer.creator, offer.amountOffered);
            _removeFromOffersB(offerId);
        }

        emit OfferCanceled(offerId);
    }

    /**
     * @dev Remove oferta da lista de ofertas A
     */
    function _removeFromOffersA(uint256 offerId) internal {
        for (uint256 i = 0; i < offersA.length; i++) {
            if (offersA[i] == offerId) {
                offersA[i] = offersA[offersA.length - 1];
                offersA.pop();
                break;
            }
        }
    }

    /**
     * @dev Remove oferta da lista de ofertas B
     */
    function _removeFromOffersB(uint256 offerId) internal {
        for (uint256 i = 0; i < offersB.length; i++) {
            if (offersB[i] == offerId) {
                offersB[i] = offersB[offersB.length - 1];
                offersB.pop();
                break;
            }
        }
    }

    /**
     * @dev Retorna todas as ofertas A ativas
     */
    function getActiveOffersA() external view returns (uint256[] memory) {
        uint256[] memory activeOffersA = new uint256[](offersA.length);
        uint256 count = 0;

        for (uint256 i = 0; i < offersA.length; i++) {
            if (offers[offersA[i]].isActive) {
                activeOffersA[count] = offersA[i];
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeOffersA[i];
        }

        return result;
    }

    /**
     * @dev Retorna todas as ofertas B ativas
     */
    function getActiveOffersB() external view returns (uint256[] memory) {
        uint256[] memory activeOffersB = new uint256[](offersB.length);
        uint256 count = 0;

        for (uint256 i = 0; i < offersB.length; i++) {
            if (offers[offersB[i]].isActive) {
                activeOffersB[count] = offersB[i];
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeOffersB[i];
        }

        return result;
    }

    /**
     * @dev Retorna informações de uma oferta específica
     */
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }
}
