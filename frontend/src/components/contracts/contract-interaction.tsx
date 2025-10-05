'use client';

import { useState } from 'react';
import { Upload, FileJson, Play, Loader2, AlertCircle } from 'lucide-react';
import { Contract, getContractMessages, validateContractAbi, type ContractMessage } from '@glin-ai/sdk';
import { useExplorerStore } from '@/store/explorer-store';

interface ContractInteractionProps {
  address: string;
}

export function ContractInteraction({ address }: ContractInteractionProps) {
  const { client } = useExplorerStore();
  const [abi, setAbi] = useState<any>(null);
  const [abiError, setAbiError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ContractMessage | null>(null);
  const [methodArgs, setMethodArgs] = useState<Record<string, string>>({});
  const [queryResult, setQueryResult] = useState<any>(null);
  const [txResult, setTxResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAbiUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedAbi = JSON.parse(content);

        // Validate ABI
        const validation = validateContractAbi(parsedAbi);
        if (!validation.valid) {
          setAbiError(`Invalid ABI: ${validation.errors.join(', ')}`);
          setAbi(null);
          setMessages([]);
          return;
        }

        setAbi(parsedAbi);
        setAbiError(null);

        // Extract contract messages
        const contractMessages = getContractMessages(parsedAbi);
        setMessages(contractMessages);

        if (contractMessages.length > 0) {
          setSelectedMethod(contractMessages[0]);
        }
      } catch (err) {
        setAbiError('Failed to parse ABI JSON file');
        setAbi(null);
        setMessages([]);
      }
    };

    reader.readAsText(file);
  };

  const handlePasteAbi = () => {
    const input = prompt('Paste your contract ABI JSON:');
    if (!input) return;

    try {
      const parsedAbi = JSON.parse(input);

      // Validate ABI
      const validation = validateContractAbi(parsedAbi);
      if (!validation.valid) {
        setAbiError(`Invalid ABI: ${validation.errors.join(', ')}`);
        setAbi(null);
        setMessages([]);
        return;
      }

      setAbi(parsedAbi);
      setAbiError(null);

      const contractMessages = getContractMessages(parsedAbi);
      setMessages(contractMessages);

      if (contractMessages.length > 0) {
        setSelectedMethod(contractMessages[0]);
      }
    } catch (err) {
      setAbiError('Invalid JSON format');
      setAbi(null);
      setMessages([]);
    }
  };

  const handleMethodSelect = (method: ContractMessage) => {
    setSelectedMethod(method);
    setMethodArgs({});
    setQueryResult(null);
    setTxResult(null);
    setError(null);
  };

  const handleArgChange = (argLabel: string, value: string) => {
    setMethodArgs(prev => ({ ...prev, [argLabel]: value }));
  };

  const handleQuery = async () => {
    if (!selectedMethod || !client || !abi) return;

    try {
      setLoading(true);
      setError(null);
      setQueryResult(null);

      const api = client.getApi();
      if (!api) {
        setError('API not available');
        return;
      }

      const contract = new Contract(api, address, abi);

      // Prepare arguments
      const args = selectedMethod.args.map(arg => {
        const value = methodArgs[arg.label];
        // Try to parse JSON for complex types
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });

      const result = await contract.query[selectedMethod.label](...args);
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async () => {
    if (!selectedMethod || !client || !abi) return;

    try {
      setLoading(true);
      setError(null);
      setTxResult(null);

      const api = client.getApi();
      if (!api) {
        setError('API not available');
        return;
      }

      // Note: This requires a signer, which would come from wallet integration
      setError('Transaction execution requires wallet connection (coming soon)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  if (!abi) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-purple-600/10 rounded-full">
              <FileJson className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold">Interact with Contract</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload or paste the contract ABI to interact with this smart contract
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <label className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
              <Upload className="h-4 w-4" />
              <span>Upload ABI</span>
              <input
                type="file"
                accept=".json"
                onChange={handleAbiUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handlePasteAbi}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600/10 transition-colors"
            >
              <FileJson className="h-4 w-4" />
              <span>Paste ABI</span>
            </button>
          </div>

          {abiError && (
            <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
              <p className="text-sm text-red-600">{abiError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Contract Interaction</h3>
          <button
            onClick={() => {
              setAbi(null);
              setMessages([]);
              setSelectedMethod(null);
              setMethodArgs({});
              setQueryResult(null);
              setTxResult(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear ABI
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Method Selector */}
        <div>
          <label className="text-sm font-medium block mb-2">Select Method</label>
          <select
            value={selectedMethod?.label || ''}
            onChange={(e) => {
              const method = messages.find(m => m.label === e.target.value);
              if (method) handleMethodSelect(method);
            }}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            {messages.map((method) => (
              <option key={method.label} value={method.label}>
                {method.label}({method.args.map(a => a.label).join(', ')})
                {!method.mutates ? ' [Query]' : ' [Transaction]'}
              </option>
            ))}
          </select>
        </div>

        {/* Method Info */}
        {selectedMethod && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedMethod.label}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                selectedMethod.mutates
                  ? 'bg-orange-600/10 text-orange-600'
                  : 'bg-blue-600/10 text-blue-600'
              }`}>
                {selectedMethod.mutates ? 'Transaction' : 'Query'}
              </span>
            </div>
            {selectedMethod.docs.length > 0 && (
              <p className="text-sm text-muted-foreground">{selectedMethod.docs.join(' ')}</p>
            )}
          </div>
        )}

        {/* Arguments */}
        {selectedMethod && selectedMethod.args.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Arguments</label>
            {selectedMethod.args.map((arg) => (
              <div key={arg.label}>
                <label className="text-sm text-muted-foreground block mb-1">
                  {arg.label}
                </label>
                <input
                  type="text"
                  value={methodArgs[arg.label] || ''}
                  onChange={(e) => handleArgChange(arg.label, e.target.value)}
                  placeholder={`Enter ${arg.label}...`}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            ))}
          </div>
        )}

        {/* Execute Buttons */}
        {selectedMethod && (
          <div className="flex gap-3">
            {!selectedMethod.mutates && (
              <button
                onClick={handleQuery}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Query</span>
              </button>
            )}
            {selectedMethod.mutates && (
              <button
                onClick={handleTransaction}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Execute Transaction</span>
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {error && (
          <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">Error</p>
              <p className="text-sm text-red-600/80">{error}</p>
            </div>
          </div>
        )}

        {queryResult && (
          <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
            <p className="text-sm font-medium text-green-600 mb-2">Query Result</p>
            <pre className="text-xs overflow-x-auto p-3 bg-background rounded border">
              {JSON.stringify(queryResult, null, 2)}
            </pre>
          </div>
        )}

        {txResult && (
          <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
            <p className="text-sm font-medium text-green-600 mb-2">Transaction Result</p>
            <pre className="text-xs overflow-x-auto p-3 bg-background rounded border">
              {JSON.stringify(txResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
