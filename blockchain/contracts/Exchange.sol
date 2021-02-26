pragma solidity ^0.4.17;

import "./Reserve.sol";

contract Exchange{

	address owner;
	Reserve[2] reserves;
	bool tradeEnabled;

	event Exchanged(address _partner, uint _srcTokenIndex, uint _srcAmount);

	function Exchange() public{
		owner = msg.sender;
		tradeEnabled = true;
	}

	function addReserve(uint _index, address _reserveAddress) public{
		require(owner == msg.sender);
		reserves[_index] = Reserve(_reserveAddress);
	}

	function removeReserve(uint _index) public{
		require(owner == msg.sender);
		reserves[_index] = Reserve(0x0);
	}

	function getExchangeRate(uint _srcTokenIndex, uint _desTokenIndex, uint _srcAmount) public view returns (uint[2]){
		require(_srcTokenIndex != _desTokenIndex);
		require(_srcTokenIndex <= 2 && _desTokenIndex <= 2);
		require(_srcAmount >= 0);
		if (_srcTokenIndex == 0) return ([1e18, reserves[_desTokenIndex-1].getExchangeRate(true, _srcAmount)]);
		if (_desTokenIndex == 0) return ([reserves[_srcTokenIndex-1].getExchangeRate(false, _srcAmount), 1e18]);
		uint[2] memory rate;
		rate[0] = reserves[_srcTokenIndex-1].getExchangeRate(false, _srcAmount);
		rate[1] = rate[0] == 0 ? 0 : reserves[_desTokenIndex-1].getExchangeRate(true, _srcAmount*1e18/rate[0]);
		return rate;
	}

	function exchange(uint _srcTokenIndex, uint _desTokenIndex, uint _srcAmount, uint[2] _rate) public payable{
		// validate
		require(tradeEnabled);
		require(_srcTokenIndex != _desTokenIndex);
		require(_srcTokenIndex <= 2 && _desTokenIndex <= 2);
		require(_srcAmount > 0);
		require(_rate[0] > 0 && _rate[1] > 0);

		// exchange
		if (_srcTokenIndex == 0) exchangeEth2Token(_desTokenIndex, _srcAmount, _rate);       // ether to token
		else if (_desTokenIndex == 0) exchangeToken2Eth(_srcTokenIndex, _srcAmount, _rate);  // token to ether
		else exchangeToken2Token(_srcTokenIndex, _desTokenIndex, _srcAmount, _rate);         // token to token

		Exchanged(msg.sender, _srcTokenIndex, _srcAmount);
	}

	function exchangeEth2Token(uint _desTokenIndex, uint _srcAmount, uint[2] _rate) private{
		reserves[_desTokenIndex-1].exchange.value(msg.value)(true, _srcAmount);  // transfer to reserve
		Token token = Token(address(reserves[_desTokenIndex-1].token()));        // validate receiving amount
		uint balance = token.balanceOf(address(this));
		require(balance == _srcAmount*_rate[1]/_rate[0]);
		token.transfer(msg.sender, balance);                                     // transfer to sender
	}

	function exchangeToken2Eth(uint _srcTokenIndex, uint _srcAmount, uint[2] _rate) private{
		Token token = Token(address(reserves[_srcTokenIndex-1].token()));  // get token from sender
	    token.transferFrom(msg.sender, address(this), _srcAmount);
	    token.approve(address(reserves[_srcTokenIndex-1]), _srcAmount);    // transfer to reserve
		reserves[_srcTokenIndex-1].exchange(false, _srcAmount);
		require(address(this).balance == _srcAmount*_rate[1]/_rate[0]);    // validate receiving amount
		msg.sender.transfer(address(this).balance);                        // transfer to sender
	}

	function exchangeToken2Token(uint _srcTokenIndex, uint _desTokenIndex, uint _srcAmount, uint[2] _rate) private{
		// token to ether
	    Token token = Token(address(reserves[_srcTokenIndex-1].token()));  // get token from sender
	    token.transferFrom(msg.sender, address(this), _srcAmount);
	    token.approve(address(reserves[_srcTokenIndex-1]), _srcAmount);    // transfer to reserve
	    reserves[_srcTokenIndex-1].exchange(false, _srcAmount);
	    require(address(this).balance == _srcAmount*1e18/_rate[0]);        // validate receiving amount
		
		// ether to token
		uint ethBalance = address(this).balance;
	    reserves[_desTokenIndex-1].exchange.value(ethBalance)(true, ethBalance);  // transfer to reserve
		token = Token(address(reserves[_desTokenIndex-1].token()));               // validate receiving amount
		uint balance = token.balanceOf(address(this));
		require(balance == ethBalance*_rate[1]/1e18);
		
		// transfer to sender
		token.transfer(msg.sender, balance);
	}
	
	function() payable{
    }

}