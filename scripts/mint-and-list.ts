import { deployments, ethers } from 'hardhat'
import 'hardhat-deploy'

const PRICE = ethers.utils.parseEther('0.1')

const mintAndList = async () => {
  /**
 * 不导入 'hardhat-deploy' 时,无法使用deployments.get()，需要使用ethers提供的工厂函数：
const nftMarketplaceFactory = await ethers.getContractFactory('NftMarketplace')
const nftMarketplace = await nftMarketplaceFactory.deploy()
const basicNftFactory = await ethers.getContractFactory('BasicNft')
const basicNft = await basicNftFactory.deploy()
 */

  // 导入'hardhat-deploy'后
  const basicNftDeployment = await deployments.get('BasicNft')
  const basicNft = await ethers.getContractAt('BasicNft', basicNftDeployment.address)
  const nftMarketplaceDeployment = await deployments.get('NftMarketplace')
  const nftMarketplace = await ethers.getContractAt('NftMarketplace', nftMarketplaceDeployment.address)
  console.log('Minting NFT...')
  const mintTx = await basicNft.mintNft()
  const mintTxReceipt = await mintTx.wait()
  console.log('NFT Minted!')
  console.log('----------------------------------Step 1')
  const tokenId = mintTxReceipt.events![0].args!.tokenId
  console.log('Approving NFT...')
  const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
  await approveTx.wait()
  console.log('NFT Approved!')
  console.log('----------------------------------Step 2')
  console.log('Listing NFT...')
  const listTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
  await listTx.wait()
  console.log('NFT Listed!')
  console.log('----------------------------------Step 3')
}

mintAndList()
  .then(() => {
    process.exitCode = 0
  })
  .catch(e => {
    console.error(e)
    process.exitCode = 1
  })
