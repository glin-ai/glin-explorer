import { useState, useEffect } from 'react';
import { useExplorerStore } from '@/store/explorer-store';
import { isContractAddress, getContractCodeHash } from '@glin-ai/sdk';

export interface ContractInfo {
  isContract: boolean;
  codeHash: string | null;
  loading: boolean;
}

/**
 * Hook to detect if an address is a smart contract and get contract info
 */
export function useContractInfo(address: string): ContractInfo {
  const { client, isConnected } = useExplorerStore();
  const [contractInfo, setContractInfo] = useState<ContractInfo>({
    isContract: false,
    codeHash: null,
    loading: true,
  });

  useEffect(() => {
    async function checkContract() {
      if (!isConnected || !client) {
        setContractInfo({ isContract: false, codeHash: null, loading: false });
        return;
      }

      try {
        const api = client.getApi();
        if (!api) {
          setContractInfo({ isContract: false, codeHash: null, loading: false });
          return;
        }

        setContractInfo(prev => ({ ...prev, loading: true }));

        const isContract = await isContractAddress(api, address);

        if (isContract) {
          const codeHash = await getContractCodeHash(api, address);
          setContractInfo({
            isContract: true,
            codeHash,
            loading: false,
          });
        } else {
          setContractInfo({
            isContract: false,
            codeHash: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to check contract:', error);
        setContractInfo({ isContract: false, codeHash: null, loading: false });
      }
    }

    checkContract();
  }, [address, client, isConnected]);

  return contractInfo;
}
