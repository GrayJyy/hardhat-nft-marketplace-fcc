export type ConfigType = { name: string }
export type NetworkConfigType = { [key: number]: ConfigType }
const networkConfig: NetworkConfigType = {
  31337: { name: 'localhost' },
  11155111: { name: 'sepolia' },
}

const developmentChains = ['localhost', 'hardhat']
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
export { networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS }
