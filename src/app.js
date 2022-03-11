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
const {
  checkStartNewProjectStatus,
  checkUploadLayersFileStatus,
  checkGenerateStatus,
  doAuth,
  uploadFilesToIpfs,
  checkIpfsUploadStatus,
} = require("./utils/utils");
const { saveNewProject, getProject } = require("./utils/db");

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

app.get("/", (req, res) => {
  res.json({
    status: "success",
  });
});

app.post("/start-new-project", async (req, res) => {
  const { name } = req.body;

  if (fs.existsSync(`generated/${name}/.yarn.lock`)) {
    res.json({
      status: "error",
      data: {
        message: `a project with name [${name}]  already exists`,
      },
    });

    return;
  }

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

  const password = crypto.randomInt(1000, 10000);
  const result = await saveNewProject(name, password);

  if (!result) {
    res.json({
      status: "error",
      data: {
        message: `Error saving project, please try again later`,
      },
    });
    return;
  }

  res.json({
    status: "success",
    data: {
      message: "Starting new project...call [/status/:path/:name] to check status",
      password: password,
    },
  });
});

app.post("/upload-layers-file", async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    await doAuth(fields.name, fields.password, res);

    const projectDir = `generated/${fields.name}`;

    const project = fs.readdirSync(projectDir);

    if (project.indexOf("yarn.lock") < 0) {
      res.json({
        status: "error",
        data: {
          message: "You have to create a new project [/start-new-project] before uploading layers",
        },
      });

      return;
    }

    const layersDir = `${projectDir}/layers`;
    if (layersDir.indexOf()) console.log("Fields: ", fields);
    const oldPath = files.layers.filepath;
    const newPath = `/tmp/${files.layers.originalFilename}`;
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        throw err;
      }

      fs.rmSync(layersDir, { recursive: true, force: true });
      fs.mkdirSync(layersDir);
      const readStream = fs.createReadStream(newPath);

      res.json({
        status: "success",
        data: {
          message:
            "Layers uploaded successfully, call [/layers] to see your uploaded layers, call [/status/:path/:name] to check the status. It might take a while to extract all your files depending on the size of your zipped file",
        },
      });

      readStream.pipe(unzipper.Extract({ path: layersDir }));
      readStream.on("close", () => {
        fs.writeFileSync(`${layersDir}/.extracted`, "success");
      });
    });
  });
});

app.post("/generate", async (req, res) => {
  const { name, password } = req.body;

  await doAuth(name, password, res);

  if (!fs.existsSync(`generated/${name}/layers`)) {
    res.json({
      status: "error",
      data: {
        message: "You have to upload layers file [/upload-layers-file] before generating nfts",
      },
    });

    return;
  }

  res.json({
    status: "success",
    data: {
      message: "Generating NFTS...call [/status/:path/:name] to check the status.",
    },
  });
  const command = `./scripts/generate.sh ${name}`;
  callTerminal(command, (code, message) => {
    if (code === 0) {
      fs.writeFileSync(`generated/${name}/output/.generated`, "success");
    }
  });
});

app.post("/post-to-ipfs", async (req, res) => {
  const { name, password } = req.body;

  await doAuth(name, password, res);

  if (!fs.existsSync(`generated/${name}/output/.generated`)) {
    res.json({
      status: "error",
      data: {
        message: "You have not generated any NFTs. Call [/generate] to generate NFTs from your layers",
      },
    });

    return;
  }

  res.json({
    status: "success",
    data: {
      message: "Generating NFTs...call [/status/:path/:name] to check the status",
    },
  });

  uploadFilesToIpfs(name);
});

app.get("/random-image/:name", async (req, res) => {
  const { name } = req.params;
  const project = await getProject(name, "", false);
  const nfts = project.nfts;
  const random = Math.floor(Math.random() * nfts.length);

  res.json({
    status: "success",
    data: nfts[random],
  });
});

app.get("/image/:name/:randomId", async (req, res) => {
  const { name, randomId } = req.params;
  const project = await getProject(name, "", false);
  const nfts = project.nfts;

  res.json({
    status: "success",
    data: nfts[randomId],
  });
});

app.get("/layers/:name", async (req, res) => {
  const name = req.params.name;
  const layersDir = `generated/${name}/layers`;

  if (!fs.existsSync(layersDir)) {
    res.json({
      status: "error",
      data: {
        message: "You have not generated any layers",
      },
    });

    return;
  }

  const layers = fs.readdirSync(layersDir).map((dir) => fs.lstatSync(dir).isDirectory());
  res.json({
    status: "success",
    data: {
      layers: layers,
    },
  });
});

app.get("/status/:process/:name", async (req, res) => {
  const name = req.params.name;
  const process = req.params.process;
  switch (process) {
    case "start-new-project":
      checkStartNewProjectStatus(name, res);
      break;
    case "upload-layers-file":
      checkUploadLayersFileStatus(name, res);
      break;
    case "generate":
      checkGenerateStatus(name, res);
      break;
    case "post-to-ipfs":
      checkIpfsUploadStatus(name, res);
      break;
    default:
      res.send("Unknown process.");
      break;
  }
});

app.listen(port, () => {
  console.log("Silkroad Started on PORT: ", port);
});
