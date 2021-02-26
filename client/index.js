import EnvConfig from "./configs/env";
import MetamaskService from "./services/accounts/metamaskService";
import Web3Service from "./services/web3Service";
import Supporter from "./services/support";

$(function () {

  // ================================== GLOBAL & STATE VARIABLES ==================================

  // services
  var metamask;
  var w3;

  // state variables
  var srcTokenIndex = 0;
  var destTokenIndex = 1;
  var exchangeRate;
  var balances = [];
  var transferTokenIndex = 0;
  var isTransacting = false;

  // ================================== INITIATION ==================================
  
  initiateProject();

  function initiateProject() {
    initiateDropdown();
    initiateSelectedToken(EnvConfig.TOKENS[0].symbol, EnvConfig.TOKENS[1].symbol);
  }

  function initiateDropdown() {
    let dropdownTokens = '';
    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });
    $('.dropdown__content').html(dropdownTokens);
  }
  
  function initiateSelectedToken(srcSymbol, destSymbol) {
    $('#selected-src-symbol').html(srcSymbol);
    $('#selected-dest-symbol').html(destSymbol);
    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    $('#selected-transfer-token').html(srcSymbol);
  }


  // ================================== FUNCTIONS ==================================

  async function updateExchangeRate(){
    exchangeRate = await w3.getExchangeRate(srcTokenIndex, destTokenIndex, 0);
    $('#exchange-rate').html(Supporter.rawRate2DestAmount(exchangeRate, srcTokenIndex, destTokenIndex, Supporter.str2Token("1", srcTokenIndex, "1000000000000000000")));
    $('#rate-src-symbol').html(EnvConfig.TOKENS[srcTokenIndex].symbol);
    $('#rate-dest-symbol').html(EnvConfig.TOKENS[destTokenIndex].symbol);
  }

  async function updateDesAmount(){
    const amount = $('#swap-source-amount').val();
    var destAmount = 0;
    const amountSol = Supporter.str2Token(amount, srcTokenIndex, balances[srcTokenIndex]);
    if (amountSol == '') destAmount = 'Invalid Input!';
    else {
      exchangeRate = await w3.getExchangeRate(srcTokenIndex, destTokenIndex, amountSol);
      destAmount = Supporter.rawRate2DestAmount(exchangeRate, srcTokenIndex, destTokenIndex, amountSol);
    }
    $('#swap-dest-amount').html(destAmount);
  }

  async function updateBalance(){

    // get current account on Metamask
    const account = await metamask.getActiveAccount();
    $('#account-address').html(account).css("color", "white");
    w3.setAccount(account);
       
    // get balance in ETH
    balances[0] = await w3.getEthBalance(account);
    $('#eth-amount').html(Supporter.token2Str(balances[0], 0)).css("color", "white");

    // call tokens for balances
    for (var i = 0; i < 2; i++){
      const tokenCfg = EnvConfig.TOKENS[i+1];
      balances[i+1] = await w3.getTokenBalance(account, i+1);
      $("#"+tokenCfg.symbol.toLowerCase()+"-amount").html(Supporter.token2Str(balances[i+1], i+1)).css("color", "white");
    }

  }


  // ================================== EVENT HANDLERS ==================================

  // START ========== Import Metamask ==========
  $('#import-metamask').on('click', async function () {

    if (!window.ethereum){
      alert('Please install MetaMask.');
      return;
    }

    // initiate services
    metamask = new MetamaskService();
    w3 = new Web3Service(metamask.getProvider());
    try{ await w3.initContracts(); }
    catch(e){ alert("Cannot connect to blockchain network!"); }
    if (await w3.getNetworkId() != EnvConfig.NETWORK_ID){
      alert("Metamask is not connected to this network! Plase connect to our network at "+EnvConfig.RPC_ENDPOINT);
      return;
    }

    // update UI
    await updateExchangeRate();
    await updateBalance();
    $(".inactive").removeClass("inactive");

    // detect account changing in metamask
    metamask.getProvider().on('accountsChanged', async (accounts) => {
      await updateBalance();
      await updateDesAmount();
    });

  });
  // END ========== Import Metamask ==========


  // START ========== Handle on click token in Token Dropdown List ==========
  $('.dropdown__item').on('click', function () {

    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);
    $(this).parents('.dropdown').removeClass('dropdown--active');

    // select Token logic
    var dropdownItem = $(this).parent().siblings('.dropdown__trigger').find('.selected-target').attr('id');
    if (dropdownItem.includes('src')){  // src
      srcTokenIndex = $(this).index();
      if (srcTokenIndex == destTokenIndex){  // handle same token selected in src and dest
        destTokenIndex = destTokenIndex == 2 ? 0 : destTokenIndex+1;
        $('#selected-dest-symbol').html(EnvConfig.TOKENS[destTokenIndex].symbol);
      }
    }
    else if (dropdownItem.includes('dest')){  // dest
      destTokenIndex = $(this).index();
      if (destTokenIndex == srcTokenIndex){  // handle same token selected in src and dest
        srcTokenIndex = srcTokenIndex == 2 ? 0 : srcTokenIndex+1;
        $('#selected-src-symbol').html(EnvConfig.TOKENS[srcTokenIndex].symbol);
      }
    } else{  // transfer
      transferTokenIndex = $(this).index();
    }

    if (dropdownItem.includes('src') || dropdownItem.includes('dest')){
      updateExchangeRate();
      updateDesAmount();
    }

  });

  // ========== Handle on Source Amount Changed ==========
  $('#swap-source-amount').on('input change', async function () {
    updateDesAmount();
  });
  // END ========== Handle dropdown list & source amount changed ==========


  // START ========== Handle on Swap icon clicked ==========
  $('#swap-icon').on('click', async function () {

    var tmp = srcTokenIndex;
    srcTokenIndex = destTokenIndex;
    destTokenIndex = tmp;
    if ($('#swap-dest-amount').html() != 0 && $('#swap-dest-amount').html() != "Invalid Input!")
      $('#swap-source-amount').val($('#swap-dest-amount').html());
    else $('#swap-source-amount').val('');

    tmp = $('#selected-src-symbol').html();
    $('#selected-src-symbol').html($('#selected-dest-symbol').html());
    $('#selected-dest-symbol').html(tmp);

    updateExchangeRate();
    updateDesAmount();

  });
  // END ========== Handle on Swap icon clicked ==========


  // START ========== Handle on Swap Now button clicked ==========
  $('#swap-button').on('click', function () {
    if ($('#swap-dest-amount').html() != 0 && $('#swap-dest-amount').html() != "Invalid Input!"){  // validate
      const modalId = $(this).data('modal-id');
      $(`#${modalId}`).addClass('modal--active');
      $('#model-content-confirm-swap').css('display', 'block');
      $('#modal-src-amount').html($('#swap-source-amount').val());
      $('#modal-dest-amount').html($('#swap-dest-amount').html());
      $('#modal-src-token').html(EnvConfig.TOKENS[srcTokenIndex].symbol);
      $('#modal-dest-token').html(EnvConfig.TOKENS[destTokenIndex].symbol);
    }
  });

  // ========== Handle on cancel button of swap modal clicked ==========
  $('#modal-button-cancel-swap').on('click', function () {
    $('#confirm-swap-modal').removeClass('modal--active');
    $('#model-content-confirm-swap').css('display', 'none');
  });

  // ========== Handle on confirm button of swap modal clicked ==========
  $('#modal-button-confirm-swap').on('click', async function () {

    $('#model-content-confirm-swap').css('display', 'none');
    $('#model-content-status-swap').html('Waiting for transaction status...').css('display', 'block');
    isTransacting = true;

    const srcTokenValue = Supporter.str2Token($('#swap-source-amount').val(), srcTokenIndex);
    try{
      await w3.exchange(srcTokenIndex, destTokenIndex, srcTokenValue, exchangeRate);
      $('#model-content-status-swap').html('Transaction Succeeded!').css('display', 'block');
    }
    catch (e){
      $('#model-content-status-swap').html('Transaction Failed!').css('display', 'block');
    }
    
    isTransacting = false;
    $('#swap-source-amount').val('');
    $('#swap-dest-amount').html('0');

    updateBalance();

  });
  // END ========== Handle on Swap Now button clicked ==========


  // START ========== Handle on Transfer button clicked ==========
  $('#transfer-button').on('click', function () {
    
    // get values
    var transferAmount = $('#transfer-source-amount').val();
    const transferAddress = $('#transfer-address').val();
    transferAmount = Supporter.str2Token(transferAmount, transferTokenIndex, balances[transferTokenIndex]);
    
    // validate
    if (transferAmount == '' || parseInt(transferAmount) == 0){
      alert("Invalid transfer amount!");
      return;
    }
    if (transferAddress == w3.account || !w3.isAddressValid(transferAddress)){
      alert("Invalid address!");
      return;
    }
    
    // show confirm modal
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
    $('#model-content-confirm-transfer').css('display', 'block');
    $('#modal-transfer-amount').html($('#transfer-source-amount').val());
    $('#modal-transfer-token').html(EnvConfig.TOKENS[transferTokenIndex].symbol);
    $('#modal-transfer-address').html(transferAddress);

  });

  // ========== Handle on cancel button of transfer modal clicked ==========
  $('#modal-button-cancel-transfer').on('click', function () {
    $('#confirm-transfer-modal').removeClass('modal--active');
    $('#model-content-confirm-transfer').css('display', 'none');
  });

  // ========== Handle on confirm button of transfer modal clicked ==========
  $('#modal-button-confirm-transfer').on('click', async function () {

    $('#model-content-confirm-transfer').css('display', 'none');
    $('#model-content-status-transfer').html('Waiting for transaction status...').css('display', 'block');
    isTransacting = true;

    const transferAmount = Supporter.str2Token($('#transfer-source-amount').val(), transferTokenIndex);
    const transferAddress = $('#transfer-address').val();
    try{
      await w3.transfer(transferTokenIndex, transferAmount, transferAddress);
      $('#model-content-status-transfer').html('Transaction Succeeded!').css('display', 'block');
    }
    catch (e){
      $('#model-content-status-transfer').html('Transaction Failed!').css('display', 'block');
    }
    
    isTransacting = false;
    $('#transfer-source-amount').val('');
    $('#transfer-address').val('');

    updateBalance();

  });
  // END ========== Handle on Transfer button clicked ==========


  // START ========== Other stuffs ==========
  // ========== Tab Processing ==========
  $('.tab__item').on('click', function () {
    const contentId = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');

    if (contentId === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
    }
  });

  // ========== Dropdown Processing ==========
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // ========== Close Modal ==========
  $('.modal').on('click', function (e) {
    if(e.target !== this || isTransacting) return;
    $(this).removeClass('modal--active');
    $('#model-content-status-swap').css('display', 'none');
    $('#model-content-status-transfer').css('display', 'none');
  });
  // END ========== Other stuffs ==========

});