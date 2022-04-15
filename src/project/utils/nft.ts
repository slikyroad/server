import { Blob, NFTStorage } from 'nft.storage';

const PIN_STATUSES = {
  PINNED: 'pinned',
  QUEUED: 'queued',
};

export const storeNftData = async (data, nftStorageToken) => {
  const storage = new NFTStorage({ token: nftStorageToken });
  console.log('Storing Data....');
  const cid = await storage.storeBlob(new Blob([data]));
  const status = await storage.status(cid);
  return status;
};
