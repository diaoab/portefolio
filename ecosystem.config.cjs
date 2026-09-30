// Configuration PM2 : garde le site en ligne et le redémarre automatiquement.
module.exports = {
  apps: [
    {
      name: "folio",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      max_memory_restart: "700M",
    },
  ],
};
