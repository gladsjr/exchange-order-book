// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleToken
 * @dev Token ERC-20 simples para fins didáticos
 * Sem casas decimais (decimals = 0)
 * Nome e símbolo configuráveis no construtor
 */
contract SimpleToken is ERC20, Ownable {
    /**
     * @dev Construtor que define nome, símbolo e supply inicial
     * @param _name Nome do token
     * @param _symbol Símbolo do token
     * @param _initialSupply Quantidade inicial de tokens (sem decimais)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) {
        // Mint inicial supply para o deployer
        _mint(msg.sender, _initialSupply);
    }

    /**
     * @dev Retorna 0 decimais para simplicidade didática
     */
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /**
     * @dev Permite ao owner mintar novos tokens
     * @param to Endereço que receberá os tokens
     * @param amount Quantidade de tokens a serem mintados
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Permite ao owner queimar tokens de qualquer endereço
     * @param from Endereço de onde os tokens serão queimados
     * @param amount Quantidade de tokens a serem queimados
     */
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
