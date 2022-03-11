const NFTStorage = require("nft.storage");

const nftStorageToken = process.env.NFT_STORAGE_TOKEN;
const storage = new NFTStorage.NFTStorage({ token: nftStorageToken });

const PIN_STATUSES = {
  PINNED: "pinned",
  QUEUED: "queued",
};

const storeNftData = async (data) => {
  console.log("Storing Data....");
  const cid = await storage.storeBlob(new NFTStorage.Blob([data]));
  const status = await storage.status(cid);
  return status;
};

module.exports = {
    storeNftData
}