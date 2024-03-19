const fs = require('fs');
const Koa = require('koa');
const koaApp = new Koa();
const getTicketInfo = require('./getTicketInfo');
const refreshTicketInfo = require('./refreshTicketInfo');

// logger
koaApp.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

koaApp.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response
koaApp.use(async (ctx, next) => {
    if (ctx.path === '/data') {
        ctx.body = await getTicketInfo();
    } else if (ctx.path === '/') {
        if(ctx.method === 'POST') {
            console.log('Timer Trigger to refresh data...')
            await refreshTicketInfo();
            ctx.body = 'OK';
        } else {
            ctx.body = fs.readFileSync('index.html', {encoding:'utf8', flag:'r'});
        }
    } else if(ctx.path === '/refresh'){ 
        ctx.body = await refreshTicketInfo(); 
    } else {
        // console.log('falls into here as ctx/path = ' + ctx.path)
        // ctx.throw(415, 'images only!');
        ctx.body = 'Hello World: ' + ctx.path;
    }

    next();
})

async function init() {
    fs.writeFileSync("../cookie.txt", JSON.stringify({"fetchTime":1,"value":"sessionid_ads=1"}));

    /** Generate Folder if not exists */
    {
        if (!fs.existsSync(`../order_platform`)){
            fs.mkdirSync(`../order_platform`);
        }
        if (!fs.existsSync(`../order_platform/detail`)){
            fs.mkdirSync(`../order_platform/detail`);
        }
        if (!fs.existsSync(`../order_platform/tags`)){
            fs.mkdirSync(`../order_platform/tags`);
        }
    }

    /** Copy order list file */
    if(process.env.PLATFORM == 'FAAS')
    {
        const src = `./order_platform/order_list.json`
        const dst = `../order_platform/order_list.json`
        fs.copyFileSync(src, dst)
    }

    /** Copy order detail folder */
    if(process.env.PLATFORM == 'FAAS')
    {
        const src = `./order_platform/detail`
        const dst = `../order_platform/detail`

        fs.readdirSync(src).forEach(file => {
            fs.copyFileSync(`${src}/${file}`, `${dst}/${file}`)
        });
    }

    /** Copy order tags folder */
    if(process.env.PLATFORM == 'FAAS')
    {
        const src = `./order_platform/tags`
        const dst = `../order_platform/tags`

        fs.readdirSync(src).forEach(file => {
            fs.copyFileSync(`${src}/${file}`, `${dst}/${file}`)
        });
    }

    /** Auto Refresh Every x Minutes */
    if(process.env.PLATFORM == 'FAAS') {
        console.log("Init FAAS ENV ....");
        setTimeout(refreshTicketInfo,   1000 * 60 * 20)
    } else {
        console.log("Init Local ENV ....");
        refreshTicketInfo()
        setTimeout(refreshTicketInfo,   1000 * 60 * 5)
    }
}

module.exports = {
  koaApp,
  init,
};
