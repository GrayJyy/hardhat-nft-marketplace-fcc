import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains } from '../helper-hardhat-config'
import verify from '../utils/verify'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployBasicNft: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  const args: any[] = []
  log('deploy basicNft start...')
  const basicNft = await deploy('BasicNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })
  log('deploy basicNft end!')
  log('-----------------------------------------------------------------------------')
  // verify the development
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(basicNft.address, args)
  }
}
deployBasicNft.tags = ['all', 'basicnft', 'main']
export default deployBasicNft
