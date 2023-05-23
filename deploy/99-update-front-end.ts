import fs from 'fs'
import { deployments, network } from 'hardhat'
import 'hardhat-deploy'

const ABI_PATH = '../front-end-nft-marketplace/constants/abi.json'
const ADDRESS_PATH = '../front-end-nft-marketplace/constants/contractAddresses.json'
const update = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('Updating front-end...')
    await updateAbi()
    await updateContractAddress()
    console.log('Finish!')
    console.log('-----------------------------------------------------------------------------')
  }
}

export const updateAbi = async () => {
  const nftMarketplaceDeployment = await deployments.get('NftMarketplace')
  const abi = nftMarketplaceDeployment.abi
  fs.writeFileSync(ABI_PATH, JSON.stringify(abi))
}

const updateContractAddress = async () => {
  const nftMarketplaceDeployment = await deployments.get('NftMarketplace')
  const address = nftMarketplaceDeployment.address
  const currentAddress = JSON.parse(fs.readFileSync(ADDRESS_PATH, 'utf8'))
  const chainId = network.config.chainId!.toString()
  if (chainId in currentAddress) {
    if (!currentAddress[chainId].includes(address)) {
      currentAddress[chainId].push(address)
    }
  } else {
    currentAddress[chainId] = [address]
  }

  fs.writeFileSync(ADDRESS_PATH, JSON.stringify(currentAddress))
}
update.tags = ['all', 'update']
export default update
