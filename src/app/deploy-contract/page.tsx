'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCode, FileJson, Rocket, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { deployContract, validateContractAbi } from '@glin-ai/sdk';
import { useExplorerStore } from '@/store/explorer-store';

export default function DeployContractPage() {
  const router = useRouter();
  const { client, isConnected } = useExplorerStore();
  const [wasmFile, setWasmFile] = useState<Uint8Array | null>(null);
  const [wasmFileName, setWasmFileName] = useState<string>('');
  const [abi, setAbi] = useState<any>(null);
  const [abiFileName, setAbiFileName] = useState<string>('');
  const [abiError, setAbiError] = useState<string | null>(null);
  const [constructorArgs, setConstructorArgs] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  const handleWasmUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      setWasmFile(new Uint8Array(arrayBuffer));
      setWasmFileName(file.name);
    };
    reader.readAsArrayBuffer(file);
  };

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
          setAbiFileName('');
          return;
        }

        setAbi(parsedAbi);
        setAbiFileName(file.name);
        setAbiError(null);

        // Initialize constructor args based on ABI
        const constructor = parsedAbi.spec?.constructors?.[0];
        if (constructor && constructor.args) {
          setConstructorArgs(new Array(constructor.args.length).fill(''));
        }
      } catch (err) {
        setAbiError('Failed to parse ABI JSON file');
        setAbi(null);
        setAbiFileName('');
      }
    };
    reader.readAsText(file);
  };

  const handleConstructorArgChange = (index: number, value: string) => {
    const newArgs = [...constructorArgs];
    newArgs[index] = value;
    setConstructorArgs(newArgs);
  };

  const handleDeploy = async () => {
    if (!client || !wasmFile || !abi) {
      setDeployError('Missing required files');
      return;
    }

    try {
      setDeploying(true);
      setDeployError(null);
      setDeployResult(null);

      const api = client.getApi();
      if (!api) {
        setDeployError('API not available');
        return;
      }

      // For now, we'll show an error about needing wallet integration
      // In production, this would use the connected wallet's signer
      setDeployError('Contract deployment requires wallet connection (coming soon). Please use the SDK directly for now.');

      // This is how it would work with a signer:
      // const result = await deployContract(
      //   api,
      //   wasmFile,
      //   abi,
      //   constructorArgs.map(arg => {
      //     try {
      //       return JSON.parse(arg);
      //     } catch {
      //       return arg;
      //     }
      //   }),
      //   signer
      // );
      //
      // if (result.success) {
      //   setDeployResult(result);
      //   setTimeout(() => {
      //     router.push(`/account/${result.address}`);
      //   }, 3000);
      // } else {
      //   setDeployError(result.error || 'Deployment failed');
      // }
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const constructor = abi?.spec?.constructors?.[0];
  const canDeploy = wasmFile && abi && !abiError;

  if (!isConnected) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Connected</h2>
          <p className="text-muted-foreground">Please connect to the blockchain first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Deploy Smart Contract
          </h1>
          <p className="text-muted-foreground mt-1">
            Deploy your ink! smart contract to the GLIN blockchain
          </p>
        </div>
      </div>

      {/* Upload WASM */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">1. Upload Contract WASM</h3>
        <div className="flex items-center space-x-4">
          <label className="flex-1 cursor-pointer">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              wasmFile ? 'border-green-600 bg-green-600/10' : 'border-muted-foreground/25 hover:border-purple-600/50'
            }`}>
              {wasmFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium text-green-600">{wasmFileName}</p>
                  <p className="text-xs text-muted-foreground">{(wasmFile.length / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <FileCode className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop WASM file or click to upload</p>
                  <p className="text-xs text-muted-foreground">Compiled ink! contract (.wasm)</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept=".wasm"
              onChange={handleWasmUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload ABI */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">2. Upload Contract ABI</h3>
        <div className="flex items-center space-x-4">
          <label className="flex-1 cursor-pointer">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              abi ? 'border-green-600 bg-green-600/10' :
              abiError ? 'border-red-600 bg-red-600/10' :
              'border-muted-foreground/25 hover:border-purple-600/50'
            }`}>
              {abi ? (
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium text-green-600">{abiFileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {abi.contract?.name || 'Contract'} v{abi.contract?.version || '1.0.0'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <FileJson className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop ABI file or click to upload</p>
                  <p className="text-xs text-muted-foreground">Contract metadata (.json)</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleAbiUpload}
              className="hidden"
            />
          </label>
        </div>
        {abiError && (
          <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{abiError}</p>
          </div>
        )}
      </div>

      {/* Constructor Arguments */}
      {abi && constructor && constructor.args && constructor.args.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">3. Constructor Arguments</h3>
          <div className="space-y-3">
            {constructor.args.map((arg: any, index: number) => (
              <div key={index}>
                <label className="text-sm font-medium block mb-1">
                  {arg.label}
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({arg.type?.displayName?.join('::') || 'unknown'})
                  </span>
                </label>
                <input
                  type="text"
                  value={constructorArgs[index] || ''}
                  onChange={(e) => handleConstructorArgChange(index, e.target.value)}
                  placeholder={`Enter ${arg.label}...`}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deploy Button */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">4. Deploy Contract</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review your inputs and deploy the contract to the blockchain
            </p>
          </div>
          <button
            onClick={handleDeploy}
            disabled={!canDeploy || deploying}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Rocket className="h-5 w-5" />
            <span>{deploying ? 'Deploying...' : 'Deploy Contract'}</span>
          </button>
        </div>

        {deployError && (
          <div className="mt-4 p-4 bg-red-600/10 border border-red-600/20 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">Deployment Failed</p>
              <p className="text-sm text-red-600/80 mt-1">{deployError}</p>
            </div>
          </div>
        )}

        {deployResult && (
          <div className="mt-4 p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600">Contract Deployed Successfully!</p>
                <p className="text-sm text-green-600/80 mt-1 font-mono">{deployResult.address}</p>
                <p className="text-xs text-muted-foreground mt-2">Redirecting to contract page...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-lg bg-blue-600/10 border border-blue-600/20 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600">
            <p className="font-medium mb-1">Note</p>
            <p>Contract deployment currently requires a connected wallet (GLIN Extension). This feature is coming soon. For now, you can use the SDK directly:</p>
            <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-x-auto">
{`import { deployContract } from '@glin-ai/sdk';

const result = await deployContract(
  api, wasmCode, abi,
  constructorArgs, signer
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
