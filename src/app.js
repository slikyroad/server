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
const { checkStartNewProjectStatus, checkUploadLayersFileStatus, checkGenerateStatus } = require("./utils/process.utils");

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
    status: "success",
    data: {
      message: "Starting new project...call [/status/:path/:name] to check status",
    },
  });
});

app.post("/upload-layers-file", async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    const projectDir = `generated/${fields.name}`;

    const project = fs.readdirSync(projectDir);

    if (project.indexOf("package.json") < 0 && project.indexOf("yarn.lock") < 0) {
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
  const { name } = req.body;

  if (!fs.existsSync(`generated/${name}`)) {
    res.json({
      status: "error",
      data: {
        message: "You have to create a new project [/start-new-project] before generating nfts",
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

  const layers = fs.readdirSync(layersDir);
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
    default:
      res.send("Unknown process.");
      break;
  }
});

app.listen(port, () => {
  console.log("Silkroad Started on PORT: ", port);
});
