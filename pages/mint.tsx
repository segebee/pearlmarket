import type { NextPage } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import editionsABI from "@zoralabs/nft-drop-contracts/dist/artifacts/ERC721Drop.sol/ERC721Drop.json"
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useState } from 'react'
import { ethers, BigNumber } from 'ethers'
import { useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi'
import { useAppContext } from "../context/useAppContext"
import MintQuantity from '../components/MintQuantity'
import PostMintDialog from '../components/PostMintDialog'

const heavenly = "#40bedc"

const Mint: NextPage = () => {

    const { mintQuantity, setMintQuantity } = useAppContext()

    // ZORA NFT Edition "purchase" Write
    const perMintPrice = 0.003
    const totalMintPrice = String(mintQuantity.queryValue * perMintPrice)
    const mintValue = BigNumber.from(ethers.utils.parseEther(totalMintPrice)).toString()
    console.log("mint VAlue", mintValue)

    const [contractAddress, setAddress] = useState("")

    // 👇️ called every time input's value changes
    const handleChange = event => {
        setAddress(event.target.value);
    };

    const { data: totalSupplyData } = useContractRead({
        addressOrName: contractAddress, // Sofja Collection
        contractInterface: editionsABI.abi,
        functionName: 'totalSupply',
        args: [],
        onError(error) {
            console.log("error: ", error)
        },
        onSuccess(data) {
            console.log("success! --> ", totalSupplyData)
        }
    })

    const totalSupply = totalSupplyData ? totalSupplyData.toString() : "loading"

    // useContractWrite Mint Call
    const { data: mintData, isError: mintError, isLoading: mintLoading, isSuccess: mintSuccess, status: mintStatus, write: mintWrite } = useContractWrite({
        addressOrName: contractAddress, // Sofja Collection
        contractInterface: editionsABI.abi,
        functionName: 'purchase',
        args: [
            mintQuantity.queryValue
        ],
        overrides: {
            value: mintValue
        },
        onError(error, variables, context) {
            console.log("error", error)
        },
        onSuccess(cancelData, variables, context) {
            console.log("Success!", cancelData)
        },
    })

    // useWaitforTransaction
    const { data: mintWaitData, isError: mintWaitError, isLoading: mintWaitLoading } = useWaitForTransaction({
        hash: mintData?.hash,
        onSuccess() {
            console.log("mintData Success:", mintData),
                console.log("waitData: ", mintWaitData)
        },
        onError() {
            console.log("mintData Error:", mintData)
        },

        // onSuccess(holderMintWaitData) {
        //     console.log("txn complete: ", mintWaitData)
        //     console.log("txn hash: ", mintWaitData.transactionHash)
        // }
    })



    return (
        <div className='flex flex-col justify-center h-screen min-h-screen'>
            <Header />
            <main className="h-full mt-60 flex flex-col flex-wrap items-center justify-center  ">
                <div className="flex flex-col flex-wrap items-center">

                    <div className="flex flex-row justify-center w-full h-fit border-2 border-white border-solid">
                        <div className="flex flex-row w-full justify-center grid grid-cols-2">
                            <div className="text-center ">
                                Which Font do you want to buy?
                            </div>
                            <input
                                className="text-white text-center bg-slate-200"
                                placeholder="Input Font Address"
                                name="contractAddress"
                                type="text"
                                onChange={handleChange}
                                value={contractAddress}
                                required
                            >
                            </input>
                        </div>
                    </div>
                    <div className={`mt-10 mb-10 p-8  bg-white min-w-fit sm:min-w-min  w-8/12 xl:w-6/12 h-fit  `}>

                        <div className="mt-8 w-full flex flex-row justify-center">
                            <MintQuantity colorScheme={heavenly} />
                            <button
                                className="flex flex-row justify-self-start  text-2xl  p-3  w-fit h-fit border-2 border-solid hover:bg-[#40bedc] hover:text-white"
                                onClick={() => mintWrite()}
                            >
                                Buy
                            </button>
                        </div>
                        <PostMintDialog
                            colorScheme={heavenly}
                            publicTxnLoadingStatus={mintWaitLoading}
                            publicTxnSuccessStatus={mintStatus}
                            publicTxnHashLink={mintWaitData}
                        />
                        {mintWaitLoading == true ? (
                            <div className="text-xl sm:text-2xl mt-10 flex flex-row flex-wrap justify-center ">
                                <img
                                    className="bg-[#40bedc] p-1 rounded-3xl mb-8 w-fit flex flex-row justify-self-center items-center"
                                    width="20px"
                                    src="/SVG-Loaders-master/svg-loaders/tail-spin.svg"
                                />
                                <div className="w-full text-center">
                                    Price: 0.003 Ξ
                                </div>
                                <div className="w-full text-center">
                                    {`${totalSupply}` + " minted so far . . ."}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xl sm:text-2xl mt-10 flex flex-row flex-wrap justify-center ">
                                <div className="w-full text-center">
                                    Price: 0.003 Ξ
                                </div>
                                <div className="w-full text-center">
                                    {`${totalSupply}` + " minted so far . . ."}
                                </div>
                            </div>
                        )}
                        <Link href="/">
                            <a className="mt-5 text-xl flex flex-row justify-center text-center">
                                ← BACK TO HOME
                            </a>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Mint
