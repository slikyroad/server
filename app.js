const express = require("express");
const path = require("path");
const fs = require("fs");
require('dotenv').config();
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require('crypto');
const { exec } = require("child_process");

const callTerminal = (command, callback) => {
    exec(command, (err, stdout, stderr) => {
        if(err) {
            console.error(err);
            callback(-1, err.message);
        }

        if (stderr) {
            console.error(stderr);
        }
        
        console.log(stdout);
        callback(0, 'success');
    })
}

app.get('/generate', (req, res) => {
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
            status: 'success'
        });    
});

app.post('/start-new-project', async (req, res) => {
    const {
        name
    } = req.body;
    
    console.log("Name: ", name);
    
    const command = `./scripts/start-new.sh ${name}`;
    callTerminal(command, (code, message) => {
        if(code === 0) {
            res.json('New Project started successfully');
        } else {
            res.json(message);
        }
    })
});


app.post("/cmc/:id", async (req, res) => {
    const id = req.params.id;
    const {
        url,
        cmcEncryptedKey
    } = req.body;

    const passphrase = imdb[id];
    const decryptedKey = CryptoJS.AES.decrypt(cmcEncryptedKey, passphrase).toString(CryptoJS.enc.Utf8);

    const instance = axios.create({
        headers: {
            'X-CMC_PRO_API_KEY': decryptedKey
        }
    });

    const response = await instance.get(url);
    delete imdb[id];
    res.json(response.data);
});

app.listen(port, () => {
    console.log("middlemen Started on PORT: ", port);
});
  