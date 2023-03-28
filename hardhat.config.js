require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async(taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {},
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`
        },
        mumbai: {
          url: `https://rpc-mumbai.maticvigil.com`,
          chainId: 80001,
          accounts: [`0x299061f6c25e3f496ff7886c77aa214f9b2c61fdadfe4628a9abc180bd444b4a`]
        }
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },

    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 40000
    }
}