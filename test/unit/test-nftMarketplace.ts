import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { BasicNft, NftMarketplace } from '../../typechain-types'
import { Address } from 'hardhat-deploy/dist/types'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert } from 'console'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('NftMarketplace', () => {
      const TOKEN_ID = 0
      const PRICE = ethers.utils.parseEther('0.1')
      let basicNft: BasicNft
      let nftMarketplace: NftMarketplace
      let nftAddress: Address
      let nftMarketplaceAddress: Address
      let userAccount: SignerWithAddress
      let defaultAccount: Address

      beforeEach(async () => {
        const { deployer, user } = await getNamedAccounts()
        userAccount = await ethers.getSigner(user)
        defaultAccount = deployer
        const { BasicNft, NftMarketplace } = await deployments.fixture(['basicnft', 'nftmarketplace'])
        basicNft = await ethers.getContractAt('BasicNft', BasicNft.address)
        nftMarketplace = await ethers.getContractAt('NftMarketplace', NftMarketplace.address)
        nftAddress = BasicNft.address
        nftMarketplaceAddress = NftMarketplace.address
        await basicNft.mintNft()
        await basicNft.approve(nftMarketplaceAddress, TOKEN_ID)
      })

      describe('listItem', () => {
        it('Should reverts if the price is less than 0', async () => {
          await expect(nftMarketplace.listItem(nftAddress, TOKEN_ID, 0)).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__PriceInvalid'
          )
        })
        /**
         * attention: each 'it' use the same initial state,
         * so that the approve target will not be changed after this test
         */
        it('Should reverts when do not get approved', async () => {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
          await expect(nftMarketplace.listItem(nftAddress, TOKEN_ID, 1)).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NotApproved'
          )
        })
        it('Should emits the event called ItemListed', async () => {
          await expect(nftMarketplace.listItem(nftAddress, TOKEN_ID, PRICE)).to.emit(nftMarketplace, 'ItemListed')
        })
        it('Should reverts when item is listed', async () => {
          /** do not need this code ,because in this describe,each 'it' use the same nftMarketplace,
           * in the second 'it' , the item already listed...
           *  await nftMarketplace.listItem(nftAddress, TOKEN_ID, PRICE)
           */
          /**
          * another method for custom error:
          *  const error = `NftMarketplace__IsNotListed("${nftAddress}",${TOKEN_ID})`
           expect(await nftMarketplace.listItem(nftAddress, TOKEN_ID, PRICE)).to.be.revertedWith(error)
          */
          expect(await nftMarketplace.listItem(nftAddress, TOKEN_ID, PRICE)).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__IsNotListed'
          )
        })
        it('Should reverts when not the owner', async () => {
          /**
           * 通过调用 connect 方法，您只是在当前上下文中创建了一个新的合约实例，该实例与 nftMarketplace 变量指向的合约实例具有相同的地址和 ABI。
           * 因此，通过 nftMarketplace 变量调用的方法仍然会调用原始的 NFT Marketplace 合约实例，只是使用了不同的签名者。
           */
          nftMarketplace = nftMarketplace.connect(userAccount) // nftMarketplace合约仍旧拥有授权
          //   console.log(userAccount.address) // 新的签名者
          //   console.log(defaultAccount) // 旧的签名者，也是nft的拥有者（因为basicNft调用mint时的签名者就是defaultAccount
          //   console.log(await basicNft.ownerOf(0))
          assert(defaultAccount === (await basicNft.ownerOf(0)))
          /**
           * 当nftMarketplace调用listItem时，首先执行修饰器的代码发现msg.sender(userAccount.address)并不等于owner
           * 在这里就已经revert了，函数内的代码(_;)并不会执行，也就是说不会进入到判断授权的步骤
           * 因此这里其实无需多做一步授权操作，实际上在beforeEach中nft已经被授权给nftMarketplace合约，
           * 任何账户都可以通过合约来调用合约中的函数，这也是多做一步owner校验的原因。
           */
          await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__IsNotOwner'
          )
        })
        it('Should updates listing with seller and price', async function () {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
          assert(listing.price.toString() === PRICE.toString())
          assert(listing.seller.toString() === defaultAccount)
        })
      })
    })
