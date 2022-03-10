const fs = require("fs");

const checkStartNewProjectStatus = (name, res) => {
  if (!fs.existsSync(`generated/${name}/.nftartmakerrc.json`)) {
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
}

module.exports = {
  checkStartNewProjectStatus,
  checkUploadLayersFileStatus,
  checkGenerateStatus
};
