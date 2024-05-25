"use client"
import { useEffect, useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import {Autocomplete, AutocompleteItem} from "@nextui-org/react";
import approveToken from './ApproveToken';

type SupportedNetwork = {
    network: Network
    assets: Asset[]
}

type Network = {
    id: number,
    name: string,
    assets: Asset[]
}

type Asset = {
    id: string,
    name: string,
    symbol: string
}

export default function PortingComponent() {
    const [supportedAssets, setSupportedAssets] = useState<SupportedNetwork[]>();
    const [selectedNetworkId, setSelectedNetworkId] = useState<number>();
    const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>();
    const [assets, setAssets] = useState<any>()
    const [selectedAssetId, setSelectedAssetId] = useState<string>();
    const [isValid, setIsValid] = useState(false);
    const [minAmount, setMinAmount] = useState()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/hashport/assets")
                if(response) {
                    const data = await response.json()
                    setSupportedAssets(data.data)
                }
            } catch (error) {
                console.error('Error fetching Supported Assets:', error);
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        // need a filter to find assets by network
        if(!supportedAssets) return
        var filteredArray = supportedAssets.filter(item => {
            console.log(item.network.id)
            return item.network.id === selectedNetworkId
        });
        console.log("selected network "+selectedNetworkId)
        console.log(Object.values(filteredArray[0]))
        setSelectedNetwork(filteredArray[0])
        setAssets([filteredArray[0].assets])
    }, [selectedNetworkId])

    useEffect(() => {
        console.log(supportedAssets)
    }, [supportedAssets])

    const assetDetails = async () => {
        if(!selectedNetworkId || !selectedAssetId) return
        const url = new URL('http://localhost:3000/api/hashport/details/')
        url.searchParams.append('sourceNetworkId', selectedNetworkId.toString());
        url.searchParams.append('sourceAssetId', selectedAssetId);
        try {
            const response = await fetch(url)
            if(response) {
                const data = await response.json()
                console.log(data)
                setMinAmount(data.minAmount)
            }
        } catch (error) {
            
        } 
    }

    const validateSteps = async () => {
        if(!selectedNetworkId || !selectedAssetId || !minAmount) return
        assetDetails()
        const url = new URL('http://localhost:3000/api/hashport/validate/');
        url.searchParams.append('sourceNetworkId', selectedNetworkId.toString());
        url.searchParams.append('sourceAssetId', selectedAssetId);

        // Hedera testnet
        url.searchParams.append('targetNetworkId', "0x128");

        // need a quantity input
        // fetch token details for min amount
        url.searchParams.append('amount', minAmount); 
        
        // need the user's account ID in state possible from the contract
        url.searchParams.append('recipient', "0.0.4372449");
        try {
            const response = await fetch(url)
            console.log(response)
            setIsValid(response.ok)
        } catch (error) {
            console.error('Error validating Pre-Flight:', error);
        }
    }

    const bridgeAsset = async () => {
        if(!selectedNetworkId || !selectedAssetId) return
        const url = new URL('http://localhost:3000/api/hashport/bridge/');
        url.searchParams.append('sourceNetworkId', selectedNetworkId.toString());
        url.searchParams.append('sourceAssetId', selectedAssetId);

        // Hedera testnet
        url.searchParams.append('targetNetworkId', "0x128");

        // need a quantity input
        url.searchParams.append('amount', "100000000000000000000");

        // need the user's account ID in state possible from the contract
        url.searchParams.append('recipient', "0.0.4372449");
        try {
            const response = await fetch(url)
            if(response) {
                const data = await response.json()
                console.log(data[1])
                approveToken(data[1])
            }
        } catch (error) {
            console.error('Error validating Pre-Flight:', error);
        }
    }
    
    const onSelectionChange = (id:any) => {
        setSelectedAssetId(id);
    };

    useEffect(() => {
        assetDetails();
    }, [selectedAssetId])

    return(
        <>
        <div style={{marginBottom: "2rem"}}>
            <Dropdown>
                <DropdownTrigger>
                    <Button 
                    variant="bordered"
                    style={{color:"white"}}
                    aria-label="Select Network"
                    >
                        {selectedNetwork ? (
                            <>
                                {selectedNetwork.network.name}
                            </>
                        ):(
                            <>
                                Select Network
                            </>
                        )}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Network dropdown"
                    style={{color:"black"}} 
                    items={supportedAssets}
                    onAction={(key) => (
                        setSelectedNetworkId(Number(key))
                    )}
                >
                    {(item) => (
                        <DropdownItem
                            key={item.network.id}
                      >
                        {item.network.name}
                      </DropdownItem>
                    )}
                </DropdownMenu>
            </Dropdown>
        </div>
        <div>
            {selectedNetwork && (
                <Autocomplete
                    defaultItems={Object.values(selectedNetwork.assets)}
                    label="Select Asset"
                    placeholder="Search Assets"
                    onSelectionChange={onSelectionChange}
                >
                    {(asset) => <AutocompleteItem style={{color:"black"}} key={asset.id}>{asset.name}</AutocompleteItem>}
                </Autocomplete>
            )}
        </div>
        {selectedNetwork && selectedAssetId && (
            <Button onClick={validateSteps}>Pre-Flight Check</Button>
        )}
        {isValid && (
            <Button onClick={bridgeAsset}>Bridge Asset</Button>
        )}
        </>
    )
}