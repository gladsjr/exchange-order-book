// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MBAToken
 * @dev Token ERC-20 para fins didáticos com 18 casas decimais
 * Nome, símbolo e supply inicial configuráveis no construtor.
 * O supply inicial é informado em unidades inteiras de token; o construtor
 * aplica automaticamente as 18 casas decimais.
 */
contract MBAToken is ERC20, Ownable {
    /**
     * @dev Construtor que define nome, símbolo e supply inicial
     * @param _name Nome do token
     * @param _symbol Símbolo do token
     * @param _initialSupply Quantidade inicial de tokens (em unidades inteiras, sem decimais)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) {
        // Mint do supply inicial para o deployer, já ajustado para 18 decimais
        _mint(msg.sender, _initialSupply * 10 ** decimals());
    }

    /**
     * @dev Permite ao owner mintar novos tokens
     * @param to Endereço que receberá os tokens
     * @param amount Quantidade de tokens a serem mintados (em unidades base, com decimais)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Permite ao owner queimar tokens de qualquer endereço
     * @param from Endereço de onde os tokens serão queimados
     * @param amount Quantidade de tokens a serem queimados (em unidades base, com decimais)
     */
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
