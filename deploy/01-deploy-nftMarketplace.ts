import { DeployFunction } from 'hardhat-deploy/dist/types'
import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains } from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployNftMarketplace: DeployFunction = async hre => {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const args: any[] = []

  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  log('deploy nftMarketplace start...')
  const nftMarketplace = await deploy('NftMarketplace', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })

  log('deploy nftMarketplace end!')
  log('-----------------------------------------------------------------------------')

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(nftMarketplace.address, args)
  }
}

deployNftMarketplace.tags = ['all', 'main', 'nftmarketplace']
export default deployNftMarketplace
