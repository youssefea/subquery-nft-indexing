import {
	Token, Owner, Contract, Transfer,
}  from "../types";
import {
  FrontierEvmEvent,
  FrontierEvmCall,
} from "@subql/frontier-evm-processor";
//import * as instance from "../types/abi-interfaces/Erc721Abi";
import { BigNumber } from "ethers";
import { Erc721Abi__factory } from "../types/contracts/factories";

// Setup types from ABI
type TransferEventArgs = [string, string, BigNumber] & {
  from: string;
  to: string;
  tokenId: string;
};

export async function handleTransfer(
  event: FrontierEvmEvent<TransferEventArgs>
): Promise<void> {
  
  let previousOwner = await Owner.get(event.args.from);
  let newOwner = await Owner.get(event.args.to);
  let token = await Token.get(event.args.tokenId);
  let transferId = event.transactionHash;
  let transfer = await Transfer.get(transferId);
  let contract = await Contract.get(event.address);
  const instance = Erc721Abi__factory.connect(event.address, api);


  if (previousOwner == null) {
    previousOwner = new Owner(event.args.from);

    previousOwner.balance = BigInt(0);
  } else {
    let prevBalance = previousOwner.balance;
    if (prevBalance > BigInt(0)) {
      previousOwner.balance = prevBalance - BigInt(1);
    }
  }

  if (newOwner == null) {
    newOwner = new Owner(event.args.to);
    newOwner.balance = BigInt(1);
  } else {
    let prevBalance = newOwner.balance;
    newOwner.balance = prevBalance + BigInt(1);
  }

  if (token == null) {
    token = new Token(event.args.tokenId);
    token.contractId = event.address;

    try
    {
      let uri = await  instance.tokenURI(event.args.tokenId);
      if (!uri==null) {
        token.uri = uri;
      }
    }
    catch(e){}
  }

  token.ownerId = event.args.to;

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.tokenId = event.args.tokenId;
    transfer.fromId = event.args.from;
    transfer.toId = event.args.to;
    transfer.timestamp = BigInt(event.blockTimestamp.getTime());
    transfer.block = BigInt(event.blockNumber);
    transfer.transactionHash = event.transactionHash;
  }

  if (contract == null) {
    contract = new Contract(event.address);
  }

  try
    {
      let name = await  instance.name();
      if (!name==null) {
        contract.name = name;
      }
    }
  catch(e){}

  try
    {
      let symbol = await  instance.symbol();
      if (!symbol==null) {
        contract.symbol = symbol;
      }
    }
  catch(e){}

  try
    {
      let totalSupply = await  instance.totalSupply();
      if (!totalSupply==null) {
        contract.totalSupply = BigInt(totalSupply.toString());
      }
    }
  catch(e){}

  previousOwner.save();
  newOwner.save();
  token.save();
  contract.save();
  transfer.save();
  
}
