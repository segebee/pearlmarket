import { NextPage } from "next"
import { Header } from "../components/Header"
import { useState, useEffect } from "react"
import { useContractWrite, useSwitchNetwork, useNetwork, useAccount, useConnect } from "wagmi"
import { InjectedConnector } from 'wagmi/connectors/injected'
import { utils } from "ethers"
import { NFTStorage, Blob } from 'nft.storage';

const NFT_STORAGE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFmZGVjMjZjNDMxZjc4MjNhQzRFOTkyNDNhMjgxOTI5QTgxQUI0YmMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1OTgxODI5MTU0NCwibmFtZSI6IlBFQVJMIFNUT1JBR0UifQ.IKJa2ylWaqxPN9JjuG7sAb-EvOSsdTF24EHvP7hxUF8'

const NFTStorageClient = new NFTStorage({ token: NFT_STORAGE_API_KEY })


const ZoraNFTCreatorProxy_ABI = require("../node_modules/@zoralabs/nft-drop-contracts/dist/artifacts/ZoraNFTCreatorV1.sol/ZoraNFTCreatorV1.json")

const ZoraNFTCreatorProxy_ADDRESS_RINKEBY = "0x2d2acD205bd6d9D0B3E79990e093768375AD3a30"
const ZoraNFTCreatorProxy_ADDRESS_MAINNET = "0xF74B146ce44CC162b601deC3BE331784DB111DC1"

const Create: NextPage = () => {

  const account = useAccount({
    onConnect({ address, connector, isReconnected }) {
      console.log('Connected', { address, connector, isReconnected });
      setEditionInputs(current => {
        return {
          ...current,
          fundsRecipient: account.address,
          contractAdmin: account.address
        }
      })
    },
  })

  // createEdition function used in button
  const updateVariables = () => {
    editionInputs.fundsRecipient = account.address;
    editionInputs.contractAdmin = account.address;
  }

  const [editionInputs, setEditionInputs] = useState({
    contractName: "",
    contractSymbol: "TESTPEARL",
    contractMaxSupply: "10000",
    secondaryRoyalties: "100",
    fundsRecipient: "0x0",
    contractAdmin: "0x0",
    salesConfig: {
      priceEther: "0.003",
      perWalletMintCap: "1",
      publicSaleStart: "0", // makes it so edition will be live to start
      publicSaleEnd: "50000000000", // makes it so edition will be live to start
      presaleStart: "0",
      presaleEnd: "0",
      presaleMerkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    editionDescription: "",
    metadataAnimationURI: "",
    metadataImageURI: "",
  })

  const { chain } = useNetwork()

  // connect to network and call create drop flow (for when no wallet previously connected)
  const { connectAsync: connectToRinkeby } = useConnect({
    connector: new InjectedConnector,
    chainId: 4,
    onSettled(data, error, variables, context) {
      console.log("connect to mainnet settled: ", data)
    },
  })

  const { connectAsync: connectToMainnet } = useConnect({
    connector: new InjectedConnector,
    chainId: 1,
    onSettled(data, error, variables, context) {
      console.log("connect to mainnet settled: ", data)
    },
  })

  // switch network and call create drop flow (for when wallet already connected but to incorrect network)
  const { data: rinkebyChainData, switchNetworkAsync: switchToRinkeby } = useSwitchNetwork({
    chainId: 4,
    onSuccess(rinkebyChainData) {
      console.log("Success", rinkebyChainData)
    }
  })

  const { data: mainnetChainData, switchNetworkAsync: switchToMainnet } = useSwitchNetwork({
    chainId: 1,
    onSuccess(mainnetChainData) {
      console.log("Success", mainnetChainData)
    }
  })


  // connect to network and call create edition flow (for when no wallet previously connected)
  const connectToRinkebyAndEdition = async () => {
    await connectToRinkeby()
    rinkebyEditionWrite()
  }

  const connectToMainnetAndEdition = async () => {
    await connectToMainnet()
    mainnetEditionWrite()
  }

  // switch network and call edition drop flow (for when wallet already connected but to incorrect network)
  const switchToRinkebyAndEdition = async () => {
    await switchToRinkeby()
    rinkebyEditionWrite()
  }

  const switchToMainnetAndEdition = async () => {
    await switchToMainnet()
    mainnetEditionWrite()
  }

  // createEdition function used in button
  const createEditionRinkeby = () => {
    updateVariables()
    if (!chain) {
      connectToRinkebyAndEdition()
      return
    } else if (chain && chain.id !== 4) {
      switchToRinkebyAndEdition()
      return
    }
    rinkebyEditionWrite()
  }

  const createEditionMainnet = () => {
    updateVariables()
    if (!chain) {
      connectToMainnetAndEdition()
      return
    } else if (chain && chain.id !== 1) {
      switchToMainnetAndEdition()
      return
    }
    mainnetEditionWrite()
  }








  const dealWithEther = (price) => {
    if (price === "") {
      return 0
    }
    return utils.parseEther(price)
  }

  // createEdition functions

  const { data: rinkebyEditionData, isError: rinkebyEditionError, isLoading: rinkebyEditionLoading, write: rinkebyEditionWrite } = useContractWrite({
    addressOrName: ZoraNFTCreatorProxy_ADDRESS_RINKEBY,
    contractInterface: ZoraNFTCreatorProxy_ABI.abi,
    functionName: 'createEdition',
    args: [
      editionInputs.contractName,
      editionInputs.contractSymbol,
      editionInputs.contractMaxSupply,
      editionInputs.secondaryRoyalties,
      editionInputs.fundsRecipient,
      editionInputs.contractAdmin,
      [
        dealWithEther(editionInputs.salesConfig.priceEther),
        editionInputs.salesConfig.perWalletMintCap,
        editionInputs.salesConfig.publicSaleStart,
        editionInputs.salesConfig.publicSaleEnd,
        editionInputs.salesConfig.presaleStart,
        editionInputs.salesConfig.presaleEnd,
        editionInputs.salesConfig.presaleMerkleRoot
      ],
      editionInputs.editionDescription,
      editionInputs.metadataAnimationURI,
      editionInputs.metadataImageURI
    ]
  })

  const { data: mainnetEditionData, isError: mainnetEditionError, isLoading: mainnetEditionLoading, write: mainnetEditionWrite } = useContractWrite({
    addressOrName: ZoraNFTCreatorProxy_ADDRESS_MAINNET,
    contractInterface: ZoraNFTCreatorProxy_ABI.abi,
    functionName: 'createEdition',
    args: [
      editionInputs.contractName,
      editionInputs.contractSymbol,
      editionInputs.contractMaxSupply,
      editionInputs.secondaryRoyalties,
      editionInputs.fundsRecipient,
      editionInputs.contractAdmin,
      [
        dealWithEther(editionInputs.salesConfig.priceEther),
        editionInputs.salesConfig.perWalletMintCap,
        editionInputs.salesConfig.publicSaleStart,
        editionInputs.salesConfig.publicSaleEnd,
        editionInputs.salesConfig.presaleStart,
        editionInputs.salesConfig.presaleEnd,
        editionInputs.salesConfig.presaleMerkleRoot
      ],
      editionInputs.editionDescription,
      editionInputs.metadataAnimationURI,
      editionInputs.metadataImageURI
    ]
  })

  useEffect(() => {
    if (!chain) {
      console.log("no wallet connected")
    } else {
      console.log("chain ID =", chain.id)
    }
  },
    [chain]
  )

  async function retrieveFile(e) {
    setEditionInputs(current => {
      return {
        ...current,
        metadataImageURI: `Uploading Image...`
      }
    })
    const file = e.target.files[0];

    // const reader = new window.FileReader();
    // reader.readAsDataURL(data);
    // // const buf1 = Buffer.from('this is a t??st');
    // reader.onloadend = () => {
    //     console.log('TYPE OF ----------------------------', typeof reader.result);
    //     console.log('bytearray: ?', reader.result);
    //     const base64 = getBase64StringFromDataURL(reader.result);
    //     console.log(base64);

    //     setFile(base64);
    // };
    try {
      // const cid = await NFTStorageClient.storeBlob(someData);

      // const url = `https://nftstorage.link/ipfs/${cid}`;
      // console.log("nft.storage url:", url)

      //Upload NFT to IPFS & Filecoin
      const cid = await NFTStorageClient.storeBlob(file);

      console.log({ cid })
      console.log('url', `https://nftstorage.link/ipfs/${cid}`)

      setEditionInputs(current => {
        return {
          ...current,
          metadataImageURI: `https://nftstorage.link/ipfs/${cid}`
        }
      })

    } catch (error) {
      console.log(error.message);
      setEditionInputs(current => {
        return {
          ...current,
          metadataImageURI: ""
        }
      })
    }

    e.preventDefault();
  }

  return (
    <div className="mt-2 sm:0 min-h-screen h-screen">
      <Header />
      <main className="center text-black h-full flex sm:flex-col flex-row flex-wrap">



        <div className=" sm:w-6/12 sm:h-full w-full h-6/12 flex flex-row flex-wrap content-start">
          <div className="title-create">CREATE YOUR FONT EDITION</div>
          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center ">
                Upload Specimen Image
              </div>
              <input type="file" onChange={retrieveFile} />
            </div>
          </div>

          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center ">
                Font Name
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input Font Name"
                name="inputContract"
                type="text"
                value={editionInputs.contractName}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      contractName: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              {/* <button>
                HOVER FOR INFO
              </button> */}
            </div>
          </div>

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                CONTRACT SYMBOL
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="text"
                value={editionInputs.contractSymbol}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      contractSymbol: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                CONTRACT MAX SUPPLY
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.contractMaxSupply}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      contractMaxSupply: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                SECONDARY ROYALTIES
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.secondaryRoyalties}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      secondaryRoyalties: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center">
                FUNDS RECIPIENT
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="text"
                value={editionInputs.fundsRecipient}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      fundsRecipient: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center">
                CONTRACT ADMIN
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="text"
                value={editionInputs.contractAdmin}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      contractAdmin: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center">
                Price for 1 Font License
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input Price"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.priceEther}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        priceEther: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              {/* <button>
                HOVER FOR INFO
              </button> */}
            </div>
          </div>

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                MINT CAP PER WALLET
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.perWalletMintCap}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        perWalletMintCap: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                PUBLIC SALE START
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.publicSaleStart}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        publicSaleStart: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                PUBLIC SALE END
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.publicSaleEnd}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        publicSaleEnd: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                PRESALE START
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.presaleStart}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        presaleStart: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}
          {/*
          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                PRESALE END
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="number"
                value={editionInputs.salesConfig.presaleEnd}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        presaleEnd: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}
          {/*
          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                PRESALE MERKLE ROOT
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="text"
                value={editionInputs.salesConfig.presaleMerkleRoot}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      salesConfig: {
                        ...current.salesConfig,
                        presaleMerkleRoot: e.target.value
                      }
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center">
                Font Description
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Using this font will give your whole body shivers "
                name="inputContract"
                type="text"
                value={editionInputs.editionDescription}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      editionDescription: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              {/* <button>
                HOVER FOR INFO
              </button> */}
            </div>
          </div>

          {/* <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-3">
              <div className="text-center">
                ANIMATION URI
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input NFT Address"
                name="inputContract"
                type="text"
                value={editionInputs.metadataAnimationURI}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      metadataAnimationURI: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              <button>
                HOVER FOR INFO
              </button>
            </div>
          </div> */}

          <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
            <div className="flex flex-row w-full justify-center grid grid-cols-2">
              <div className="text-center">
                Image Link
              </div>
              <input
                className="text-black text-center bg-slate-200"
                placeholder="Input Image Link"
                name="inputContract"
                type="text"
                value={editionInputs.metadataImageURI}
                onChange={(e) => {
                  e.preventDefault();
                  setEditionInputs(current => {
                    return {
                      ...current,
                      metadataImageURI: e.target.value
                    }
                  })
                }}
                required
              >
              </input>
              {/* <button>
                HOVER FOR INFO
              </button> */}
            </div>
          </div>

          <div className="flex flex-row justify-center w-full h-fit border-black border-solid">
            <button
              className=" margin-button hover:bg-black hover:text-white border-solid border-1 border-black py-1 flex flex-row w-full justify-center"
              onClick={() => createEditionRinkeby()}
            >
              CREATE YOUR FONT
            </button>
            {/* <button
              className="border-2 border-l-0 hover:bg-white hover:text-black border-solid border-blue-500 py-1  flex flex-row w-full justify-center"
              onClick={() => createEditionMainnet()}
            >
              DEPLOY TO MAINNET
            </button> */}
          </div>

          {/* <div className="text-sm text-white w-full">
            {"Contract Name: " + editionInputs.contractName}
          </div>
          <div className="text-sm  text-white w-full">
            {"Contract Symbol: " + editionInputs.contractSymbol}
          </div>
          <div className="text-sm  text-white w-full">
            {"Contract MaxSupply: " + editionInputs.contractMaxSupply}
          </div>
          <div className="text-sm  text-white w-full">
            {"Royalties: " + editionInputs.secondaryRoyalties}
          </div>
          <div className="text-sm  text-white w-full">
            {"fundsRecipient: " + editionInputs.fundsRecipient}
          </div>
          <div className="text-sm  text-white w-full">
            {"Contract Admin: " + editionInputs.contractAdmin}
          </div>
          <div className="text-sm  text-white w-full">
            {"salesConfig Price Ether (in wei): " + dealWithEther(editionInputs.salesConfig.priceEther)}
          </div>
          <div className="text-sm  text-white w-full">
            {"salesConfig wallet cap: " + editionInputs.salesConfig.perWalletMintCap}
          </div>
          <div className="text-sm text-white w-full">
            {"salesConfig pub sale start: " + editionInputs.salesConfig.publicSaleStart}
          </div>
          <div className="text-sm text-white w-full">
            {"salesConfig pub sale end: " + editionInputs.salesConfig.publicSaleEnd}
          </div>
          <div className="text-sm text-white w-full">
            {"salesConfig presale start: " + editionInputs.salesConfig.presaleStart}
          </div>
          <div className="text-sm text-white w-full">
            {"salesConfig presale end: " + editionInputs.salesConfig.presaleEnd}
          </div>
          <div className="text-sm text-white w-full">
            {"salesConfig persale merkle root: " + editionInputs.salesConfig.presaleMerkleRoot}
          </div>
          <div className="text-sm text-white w-full">
            {"Edition Description " + editionInputs.editionDescription}
          </div>
          <div className="text-sm text-white w-full">
            {"Animation URI " + editionInputs.metadataAnimationURI}
          </div>
          <div className="text-sm text-white w-full">
            {"Image URI URI " + editionInputs.metadataImageURI}
          </div> */}

        </div>
      </main>
    </div>
  )
}

export default Create
