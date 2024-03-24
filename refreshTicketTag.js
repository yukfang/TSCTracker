const fs = require('fs');
const api_tags_invoke   = require('./utils/athena/tag');
const Reduce = require('./reduceInfo')

const delay = (ms) => {
    return new Promise((res, rej) => {
        setTimeout(res, ms * 1000)
    })
}

const CACHE_DIR = (process.env.PLATFORM == 'FAAS')?'../order_platform/':'./order_platform/'

 
async function refreshTicketTag(){
    /** 0. Get Order List */
    const orderList =  await ((f)=>{
        return new Promise((resolve) => {
            resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
        }).catch(err=>{
            console.log('JSON Parse error ' + err)
        })
    })(`${CACHE_DIR}order_list.json`)

    // console.log(`Order List Len: ${orderList.length}`)

    /** 1. Get Tag Index */
    const tagIndex =  await ((f)=>{
        return new Promise((resolve) => {
            resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
        }).catch(err=>{
            console.log('JSON Parse error ' + err)
        })
    })(`${CACHE_DIR}tag_index.json`)

    /** 2. Append missing tags */
    for(let i = 0; i < orderList.length; i++) {
        const order = orderList[i]
        if(!tagIndex.hasOwnProperty(order.order_id)){
            tagIndex[order.order_id] = '1970-01-01T01:01:01.212Z'
        }
    }
    fs.writeFileSync(`${CACHE_DIR}tag_index.json`, JSON.stringify(tagIndex, null, 2), function (err) {
        if (err) throw err;
    });
    // console.log(tagIndex)

    /** 3. Get Oldest x orders */
    const tags  = Object.keys(tagIndex)
                        .map((t) =>  {return {order_id: t, fetchTime: tagIndex[t]}})
                        .sort((a,b) => {return (new Date(a.fetchTime)).getTime() - (new Date(b.fetchTime)).getTime()})
                        .slice(0, 30)
    // console.log(tags)

    /** 4. Refresh Oldest Tag */
    for(let i = 0; i < tags.length; i++) {
        const rawOrderTag = await api_tags_invoke(tags[i].order_id)
        const orderTag = await Reduce.reduceTag(rawOrderTag) 
        if(orderTag) {
            fs.writeFileSync(`${CACHE_DIR}tag/${tags[i].order_id}.json`, JSON.stringify(orderTag, null, 2), function (err) {
                if (err) throw err;
            });
            const epoch_ts      = Date.now()
            const iso_ts        = (new Date(epoch_ts)).toISOString()
            const iso_2_epoch   = (new Date(epoch_ts)).getTime()

            tagIndex[tags[i].order_id] = iso_ts
            console.log(`Refreshing tag for ${tags[i].order_id}`)
        }
    }
    fs.writeFileSync(`${CACHE_DIR}tag_index.json`, JSON.stringify(tagIndex, null, 2), function (err) {
        if (err) throw err;
    });

    // console.log(tagIndex)
}

// refreshTicketTag();

module.exports = refreshTicketTag  