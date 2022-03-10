module.exports = {
  apps: [{
    name: "SilkRoad",
    script: "src/app.js",
    watch: ["scripts", "src"],
    // Delay between restart
    watch_delay: 1000,
    ignore_watch : ["node_modules", "output", "generated", "layers"],
  }]
}