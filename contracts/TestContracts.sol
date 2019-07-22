pragma solidity ^0.4.24;

contract TestContracts {
  mapping(bytes32 => address) public contracts;

  function set(string memory id, address contractAddress) public {
    contracts[stringToBytes32(id)] = contractAddress;
  }

  function get(string memory id) public returns (address contractAddress) {
    return contracts[stringToBytes32(id)];
  }

  function stringToBytes32(string memory source) private returns (bytes32 result) {
      bytes memory tempEmptyStringTest = bytes(source);
      if (tempEmptyStringTest.length == 0) {
          return 0x0;
      }
      require(tempEmptyStringTest.length <= 32, "id cannot be longer than 32 bytes");
      assembly {
          result := mload(add(source, 32))
      }
  }
}
