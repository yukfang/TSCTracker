const fs = require('fs');
const api_detail_invoke = require('./utils/athena/detail');
const Reduce = require('./reduceInfo')

const CACHE_DIR = (process.env.PLATFORM == 'FAAS')?'../order_platform/':'./order_platform/'

async function readAndRefreshTicketDetail(){
    const orderList =  await ((f)=>{
        return new Promise((resolve) => {
            resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
        }).catch(err=>{
            console.log('JSON Parse error ' + err)
        })
    })(`${CACHE_DIR}order_list.json`)

    const details = {}
    for(let i = 0; i < orderList.sort((a,b) => {return a.order_id - b.order_id}).length; i++) {
        if (fs.existsSync(`${CACHE_DIR}detail/${orderList[i].order_id}.json`)) {
            const detail =  await ((f)=>{
                return new Promise((resolve) => {
                    resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
                }).catch(err=>{
                    console.log('JSON Parse error ' + err)
                })
            })(`${CACHE_DIR}detail/${orderList[i].order_id}.json`)

            if(detail.update_time === parseInt(orderList[i].update_time)) {
                // console.log(`${detail.id} not updated, skip...`)
                details[detail.id] = detail
                continue
            } 
        }  

        console.log(`${orderList[i].order_id} needs a remote refreshing... `);
        const rawOrderDetail = await api_detail_invoke(orderList[i].order_id)
        const orderDetail = await Reduce.reduceDetail(rawOrderDetail) 
        if(orderDetail) {
            fs.writeFileSync(`${CACHE_DIR}detail/${orderList[i].order_id}.json`, JSON.stringify(orderDetail, null, 2), function (err) {
                if (err) throw err;
            });
        }
        details[orderDetail.id] = orderDetail
    }   

    return details;
}


// readAndRefreshTicketDetail();
  
module.exports = readAndRefreshTicketDetail