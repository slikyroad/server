const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { exec } = require("child_process");

const formidable = require("formidable");
const unzipper = require("unzipper");

const callTerminal = (command, callback) => {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      callback(-1, err.message);
    }

    if (stderr) {
      console.error(stderr);
    }

    console.log(stdout);
    callback(0, "success");
  });
};

app.get("/generate", (req, res) => {
  // exec('rm -rf output && npx nft-art-maker generate', (error, stdout, stderr) => {
  //     if (error) {
  //         console.log(`error: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.log(`stderr: ${stderr}`);
  //         return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  //     res.json({
  //         status: 'success'
  //     });
  // });
  res.json({
    status: "success",
  });
});

app.post("/start-new-project", async (req, res) => {
  const { name } = req.body;

  req.body.svgBase64DataOnly = false;

  const settings = JSON.stringify(req.body);

  console.log("Name: ", name);

  const command = `./scripts/start-new.sh ${name}`;
  callTerminal(command, (code, message) => {
    if (code === 0) {
      fs.writeFileSync(`generated/${name}/.nftartmakerrc.json`, settings);
    } else {
      res.json(message);
    }
  });

  res.json({
    status: 'success',
    data: {
      message: "Starting new project...run [/status] to check status"
    }
  });  
});

app.get("/status/:name", async (req, res) => {  
  const  name  = req.params.name;
  if(!fs.existsSync(`generated/${name}/.nftartmakerrc.json`)) {
    res.json({
      status: "pending",
    });

    return;
  } else {
    res.json({
      status: "completed",
    });
  }
});

app.get("/generate/:name", async (req, res) => {  
  const  name  = req.params.name;
  
  if(!fs.existsSync(`generated/${name}`)) {
    res.json({
      status: "error",
      data: {
        message: 'You have to create a new project [/start-new-project] before generating nfts'
      }
    });

    return;
  }  
  const command = `./scripts/generate.sh ${name}`;
  callTerminal(command, (code, message) => {
    if (code === 0) {
      res.json({
        status: 'success',
        data: {
          message: "NFTs generated successfully"
        }
      });
    } else {
      res.json(message);
    }
  });
});

app.get("/layers/:name", async (req, res) => {
  const  name  = req.params.name;
  const layersDir = `generated/${name}/layers`;    
  
  if(!fs.existsSync(layersDir)) {
    res.json({
      status: "error",
      data: {
        message: 'You have not generated any layers'
      }
    });

    return;
  }

  const layers = fs.readdirSync(layersDir)
  res.json({
    status: 'success',
    data: {
      layers: layers
    }
  });  
});

app.post("/upload-layers-file", async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {    
    const projectDir = `generated/${fields.name}`;
    
    const project = fs.readdirSync(projectDir);

    if(project.indexOf('package.json') < 0 && project.indexOf('yarn.lock') < 0) {
      res.json({
        status: "error",
        data: {
          message: 'You have to create a new project [/start-new-project] before uploading layers'
        }
      });

      return;
    }

    const layersDir = `${projectDir}/layers`;
    if(layersDir.indexOf())    
    console.log("Fields: ", fields);
    const oldPath = files.layers.filepath;
    const newPath = `/tmp/${files.layers.originalFilename}`;
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        throw err;
      }

      const layersDir = `generated/${fields.name}/layers`;
      if(!fs.existsSync(`generated/${fields.name}`)) {
        res.json({
          status: "error",
          data: {
            message: 'You have to create a new project [/start-new-project] before uploading layers'
          }
        });
    
        return;
      }       
      fs.rmSync(layersDir, { recursive: true, force: true });
      fs.mkdirSync(layersDir);
      const readStream = fs.createReadStream(newPath);
      // close
      readStream.pipe(unzipper.Extract({ path: layersDir }));            
      readStream.on('close', () => {
        res.json({
          status: "success",
          data: {
            message: 'Layers uploaded successfully, call [/layers] to see your uploaded layers'
          }
        });
      });
    });
  });
});

app.post("/cmc/:id", async (req, res) => {
  const id = req.params.id;
  const { url, cmcEncryptedKey } = req.body;

  const passphrase = imdb[id];
  const decryptedKey = CryptoJS.AES.decrypt(cmcEncryptedKey, passphrase).toString(CryptoJS.enc.Utf8);

  const instance = axios.create({
    headers: {
      "X-CMC_PRO_API_KEY": decryptedKey,
    },
  });

  const response = await instance.get(url);
  delete imdb[id];
  res.json(response.data);
});

app.listen(port, () => {
  console.log("Silkroad Started on PORT: ", port);
});
