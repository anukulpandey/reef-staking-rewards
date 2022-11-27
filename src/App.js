import React, { useState ,useEffect} from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract ,BigNumber} from "ethers";
import TokenContract from "./contracts/Token.json";
import StakingRewardsContract from "./contracts/StakingReward.json";
import Uik from "@reef-defi/ui-kit";
import { faCoins,faPaperPlane,faArrowsRotate,faFingerprint} from "@fortawesome/free-solid-svg-icons";

const FactoryAbi = TokenContract.abi;
const factoryContractAddress = TokenContract.address;
const StakingFactoryAbi = StakingRewardsContract.abi;
const StakingFactoryContractAddress = StakingRewardsContract.address;

const URL = "wss://rpc-testnet.reefscan.com/ws";

const multiplier = 1000000000000;

function App() {
	const [accountAddress, setAccountAddress] = useState();
	const [signer, setSigner] = useState();
	const [isWalletConnected, setWalletConnected] = useState(false);
	const [afterDecimal, setAfterDecimal] = useState("00000000000000");
	const [value, setValue] = useState(5)
	const [balance,setBalance] = useState(0);
	const [tokensBal,setTokensBal] = useState(0);
	const [total,setTotal]=useState("");

	useEffect(() => {
	  if(isWalletConnected===true){
		// const interval = setInterval(async() => {
		// 	await earned();
		// 	await balanceOf()
		//   }, 1000);
		//   return () => clearInterval(interval);
	  }
	
	}, [])
	
	const checkExtension = async () => {
		let allInjected = await web3Enable("Reef");

		if (allInjected.length === 0) {
			return false;
		}

		let injected;
		if (allInjected[0] && allInjected[0].signer) {
			injected = allInjected[0].signer;
		}

		const evmProvider = new Provider({
			provider: new WsProvider(URL),
		});

		evmProvider.api.on("ready", async () => {
			const allAccounts = await web3Accounts();

			allAccounts[0] &&
				allAccounts[0].address &&
				setWalletConnected(true);

			console.log(allAccounts);

			const wallet = new Signer(
				evmProvider,
				allAccounts[0].address,
				injected
			);

			const deployerAddress = await wallet.getAddress();
			setAccountAddress(deployerAddress);

			// Claim default account
			if (!(await wallet.isClaimed())) {
				console.log(
					"No claimed EVM account found -> claimed default EVM account: ",
					await wallet.getAddress()
				);
				await wallet.claimDefaultAccount();
			}

			setSigner(wallet);
		});
	};

	const checkSigner = async () => {
		if (!signer) {
			await checkExtension();
		}
		return true;
	};

	const setApproval = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		const result = await tokenContract.approve(StakingFactoryContractAddress,BigNumber.from(100000000000000));
		console.log(result);
	};
	const stakeTokens = async () => {
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
		await setApproval();
		const result = await stakingContract.stake(BigNumber.from(multiplier*value));
		console.log(result);
	};
	const mintTokens = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		let result = await tokenContract.mint(accountAddress,BigNumber.from(100000000000000));
		console.log(result);
		result = await tokenContract.balanceOf(accountAddress);
		console.log('balance: ' + result);
		await setApproval();
	};

	const mintTokensToStakingRewards = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		let result = await tokenContract.mint(StakingFactoryContractAddress,10000000000);
		console.log(result);
		result = await tokenContract.balanceOf(accountAddress);
		console.log('balance: ' + result);
		await setApproval();
	};

	const getReward = async () => {
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
		await mintTokensToStakingRewards();
		let result = await stakingContract.getReward();
		console.log(result);
		result = await tokenContract.balanceOf(accountAddress);
		console.log('balance: ' + result);
	};

	const balanceOf = async()=>{
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
		let result = await stakingContract.balanceOf(accountAddress);
		console.log(result.toNumber());
		setBalance(result.toNumber()/multiplier);
		console.log("balance : "+result/multiplier);
		await earned();
		await setMyTotal()
	}

	const setMyTotal =async()=>{
		setTotal(balance+"."+afterDecimal)
	}

	const earned = async()=>{
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
	
		let result = await stakingContract.earned(accountAddress);
		console.log(result.toNumber());
		let temp = (result.toNumber());
		temp = temp%1e14;
		setAfterDecimal(temp.toString().padStart(14, '0'));
	}

	const totalSupply = async()=>{
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
	
		let result = await stakingContract.totalSupply();
		console.log(result.toNumber());
	}
	const withdraw = async()=>{
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
		try {
			let result = await stakingContract.withdraw(BigNumber.from(multiplier*value));
			console.log(result);
			await balanceOf();
			await getTokensBalance();
			await setMyTotal();
		} catch (error) {
			alert("You can't withdraw amount more than you deposited")	
		}
		await balanceOf();
			await getTokensBalance();
			await setMyTotal();
	}

	const getStakingRewardsFuncs = async () => {
		await checkSigner();
		const stakingContract = new Contract(
			StakingFactoryContractAddress,
			StakingFactoryAbi,
			signer
		);
	
		let result = await stakingContract;
		console.log(result);

	};
	const getTokenFuncs = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
	
		let result = await tokenContract;
		console.log(result);

	};
	const getTokensBalance = async () => {
		await checkSigner();
		const tokenContract = new Contract(
			factoryContractAddress,
			FactoryAbi,
			signer
		);
	
		let result = await tokenContract.balanceOf(accountAddress);
		console.log(result.toNumber());
		let temp = (result.toNumber()/multiplier);
		setTokensBal(temp.toString().padStart(14, '0'));
		console.log("tokens balance : "+ temp.toString().padStart(14, '0'))

	};


	return (
		<Uik.Container className="main">
			
			<Uik.Container vertical>
			
				<Uik.Container>
				<Uik.ReefLogo /><Uik.Text text="Stake" type="headline" />
					 <Uik.Text text="dApp" type="headline" />
				</Uik.Container>
				{isWalletConnected ? (
					<Uik.Container vertical className="container">
						 <Uik.Card title='Stake / Withdraw' titlePosition='center'>
							
							<Uik.Container vertical>
							<Uik.Tag text="deposited + earned"/>
							</Uik.Container>
							<Uik.Container end>
<Uik.ReefAmount value={total} />

						<Uik.Button icon={faArrowsRotate} onClick={balanceOf} size='large'/>
	</Uik.Container>
							<Uik.Container vertical>
							<Uik.Tag text="total tokens (external)"/>
							</Uik.Container>
							<Uik.Container end>
<Uik.ReefAmount value={tokensBal} />

						<Uik.Button icon={faArrowsRotate} onClick={getTokensBalance} size='large'/>
	</Uik.Container>
	<br />
	<br />
    <Uik.Container vertical>
	<Uik.Slider
  value={value}
  onChange={e => setValue(e)}
  tooltip={value + '%'}
  helpers={[
    { position: 0, text: "0%" },
    { position: 25 },
    { position: 50, text: "50" },
    { position: 75, },
    { position: 100, text: "100%" },
  ]}
/>
<br />
<Uik.Container>
<Uik.ActionButton
							text="Claim Earned"
							onClick={getReward}
							color="purple"
							icon={faFingerprint}
						/>
<Uik.ActionButton
							text="Stake Tokens"
							onClick={stakeTokens}
							icon={faCoins}
						fill/>
<Uik.ActionButton
							text="Withdraw Funds"
							onClick={withdraw}
							icon={faPaperPlane}
							color="green"
						/>

</Uik.Container>
      
    </Uik.Container>
  </Uik.Card>
						
					<Uik.Container>
  <Uik.Text text='Claim free tokens to mint. From here' type='light'/>
						<Uik.Button
							text="Mint"
							onClick={mintTokens}
						/>
						</Uik.Container>	
						
					
					</Uik.Container>
				) : (
					<>
						<Uik.Container vertical className="container">
							
						<Uik.Button
							text="Connect Wallet"
							onClick={checkExtension}
						/>
						</Uik.Container>
					</>
				)}
			</Uik.Container>
		</Uik.Container>
	);
}

export default App;
