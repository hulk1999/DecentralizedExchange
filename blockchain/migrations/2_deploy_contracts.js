const Reserve = artifacts.require("Reserve");
const Exchange = artifacts.require("Exchange");

module.exports = async function(deployer) {
  await deployer.deploy(Reserve, "Coffee", "CFE", 10000, 4, 180*10000, 200*10000);
  const cfeAddress = Reserve.address;
  await deployer.deploy(Reserve, "Tea", "TEA", 10000, 4, 220*10000, 240*10000);
  const teaAddress = Reserve.address;
  const exchange = await deployer.deploy(Exchange);
  exchange.addReserve(0, cfeAddress);
  exchange.addReserve(1, teaAddress);
};