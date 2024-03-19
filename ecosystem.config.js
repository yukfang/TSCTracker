module.exports = {
  apps : [
    {
      "ignore_watch" : [
        "node_modules", 
        "order_platform",
        "./utils/athena/cookie.txt"
      ],
      "watch_options": {
        "followSymlinks": false,
      },


      script: "./index.js",
      "watch": true,
      name: "AthenaWatcher"
    }

  ]
}
