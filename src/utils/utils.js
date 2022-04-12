const fs = require("fs");
const { getProject, addNft } = require("./db");
const { storeNftData } = require("./nft");
require("dotenv").config();

const checkStartNewProjectStatus = (name, res) => {
  if (!fs.existsSync(`generated/${name}/yarn.lock`)) {
    res.json({
      status: "pending",
    });

    return;
  } else {
    res.json({
      status: "completed",
    });
  }
};

const checkUploadLayersFileStatus = (name, res) => {
  if (!fs.existsSync(`generated/${name}/layers/.extracted`)) {
    res.json({
      status: "pending",
    });

    return;
  } else {
    res.json({
      status: "completed",
    });
  }
};

const checkGenerateStatus = (name, res) => {
  if (!fs.existsSync(`generated/${name}/output/.generated`)) {
    res.json({
      status: "pending",
    });

    return;
  } else {
    res.json({
      status: "completed",
    });
  }
};

const checkIpfsUploadStatus = (name, res) => {
  if (!fs.existsSync(`generated/${name}/output/.uploaded`)) {
    res.json({
      status: "pending",
    });

    return;
  } else {
    res.json({
      status: "completed",
    });
  }
};

const doAuth = async (name, signature, res) => {
  const recoveredAddress = recoverPersonalSignature({ data: name, signature });
  if (recoveredAddress.toLocaleLowerCase() !== blockchainAddress.toLocaleLowerCase()) {
    res.json({
      status: "error",
      data: {
        message: `Invalid Signature`,
      },
    });

    return;
  }  

  const savedProject = await getProject(name, recoveredAddress);
  if (!savedProject || savedProject.signature !== signature) {
    res.json({
      status: "error",
      data: {
        message: `Can not find project`,
      },
    });

    return;
  }
};

const uploadFilesToIpfs = async (name) => {
  const imageFiles = fs.readdirSync(`generated/${name}/output/images`);
  const jsonFiles = fs.readdirSync(`generated/${name}/output/json`);
  const ipfsGateway = process.env.IPFS_GATEWAY;

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = `generated/${name}/output/images/${imageFiles[i]}`;
    const jsonFile = `generated/${name}/output/json/${jsonFiles[i]}`;

    const fileBlob = fs.readFileSync(imageFile);

    const imageUploadResult = await storeNftData(fileBlob);

    const jsonBlob = fs.readFileSync(jsonFile, {
      encoding: "utf-8",
    });

    const contents = JSON.parse(jsonBlob);
    contents.image = `${ipfsGateway}/${imageUploadResult.cid}`;

    const metaUploadResult = await storeNftData(JSON.stringify(contents, null, 2));

    const nft = {
      fileName: imageFiles[i],
      image:  `${ipfsGateway}/${imageUploadResult.pin.cid}`,
      metadata:  `${ipfsGateway}/${metaUploadResult.pin.cid}`
    }
    
    console.log(nft);
    await addNft(name, nft);
    console.log(imageFile);
    fs.rmSync(imageFile);
    fs.rmSync(jsonFile);
  }

  fs.writeFileSync(`generated/${name}/output/.uploaded`, "success");
};

module.exports = {
  checkStartNewProjectStatus,
  checkUploadLayersFileStatus,
  checkGenerateStatus,
  doAuth,
  uploadFilesToIpfs,
  checkIpfsUploadStatus,
};
