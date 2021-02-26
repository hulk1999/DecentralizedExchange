pragma solidity ^0.4.17;

import "./Token.sol";

contract Reserve{

	address owner;
	Token public token;
	uint buyRate;
	uint sellRate;
	bool tradeEnabled;

	event Exchanged(address _partner, uint _received, uint _sent);
	event Withdrawn(address _withdrawer, bool _isEth, uint _amount);

	function Reserve(string _name, string _symbol, uint _initialSupply, uint _decimals, uint _buyRate, uint _sellRate) public{
		owner = msg.sender;
		token = new Token(_name, _symbol, _initialSupply, _decimals);
		buyRate = _buyRate;
		sellRate = _sellRate;
		tradeEnabled = true;
	}
	
	function checkBalance() public view returns (uint){
	    return address(this).balance;
	}

	function getExchangeRate(bool _buying, uint _payingAmount) public view returns (uint){
		if (_buying) return _payingAmount*buyRate/1e18 <= token.balanceOf(address(this)) ? buyRate : 0;
		return _payingAmount*1e18/sellRate <= address(this).balance ? sellRate : 0;
	}

	function exchange(bool _buying, uint _payingAmount) public payable{
		require(tradeEnabled);
		uint amount;
		if (_buying){
		    require(_payingAmount == msg.value);                // validate receiving amount
			amount = _payingAmount*buyRate/1e18;                // calculate amount to transfer
			require(amount <= token.balanceOf(address(this)));  // validate enough amount to transfer
		    token.transfer(msg.sender, amount);                 // transfer to sender
		} else{
		    token.transferFrom(msg.sender, address(this), _payingAmount);  // get receiving amount
			amount = _payingAmount*1e18/sellRate;                          // calculate amount to transfer
			require(amount <= address(this).balance);                      // validate enough amount to transfer
			msg.sender.transfer(amount);                                   // transfer to sender
		}
		Exchanged(msg.sender, _payingAmount, amount);
	}

	function withdraw(bool _isEth, uint _amount) public payable{
		require(msg.sender == owner);
		if (_isEth){
			require(_amount <= address(this).balance);
			msg.sender.transfer(_amount);
		} else{
			require(_amount <= token.balanceOf(address(this)));
		    token.transfer(msg.sender, _amount);
		}
		Withdrawn(msg.sender, _isEth, _amount);
	}

}