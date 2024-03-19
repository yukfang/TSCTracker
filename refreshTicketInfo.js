const fs = require('fs');
const api_detail_invoke = require('./utils/athena/detail');
const api_tags_invoke   = require('./utils/athena/tag');
const api_list_invoke   = require('./utils/athena/list');
// const build_data_snapshot = require('./generateDataSnapshot')
const delay = (ms) => {
    return new Promise((res, rej) => {
        setTimeout(res, ms * 1000)
    })
}

const CACHE_DIR = (process.env.PLATFORM == 'FAAS')?'../order_platform/':'./order_platform/'
const TAGS_PATH = `${CACHE_DIR}tags/`

var clock = 0;

async function refreshTicketTags(){
    console.log(`Refresh Ticket Tags: `)

    /** Check if there are any new orders */
    var newOrders = []
    const orderListInfo = await ((f)=>{
        return new Promise((resolve) => {
            resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
        }).catch(err=>{
            console.log('JSON Parse error ' + err)
        })
    })(`${CACHE_DIR}order_list.json`)

    for(let i = 0; i < orderListInfo.orders.length; i++) {
        const order = orderListInfo.orders[i];
        if(!fs.existsSync(`${TAGS_PATH}${order.order_id}.json`)){
            newOrders.push(order.order_id)
        }
    }
    console.log(`Total ${newOrders.length} New Orders Found...`)

    /** Get Local Tag Files */
    var tagFiles =[]
    fs.readdirSync(TAGS_PATH).forEach(async (file) => {
        tagFiles.push(`${TAGS_PATH}${file}`)
    });


    /** Read Local Tag Info */
    var updateOrders = []
    for(let i = 0; i < tagFiles.length; i++) {
        if(fs.existsSync(tagFiles[i])) {
            const tag = await ((f)=>{
                return new Promise((resolve) => {
                    resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
                }).catch(err=>{
                    console.log('JSON Parse error ' + err)
                })
            })(tagFiles[i])

            if(Date.now() - tag.fetchTime > 1000 * 3600 * 2) {
                updateOrders.push(tag)
            }
        }
    }
    updateOrders = (updateOrders.sort((a,b)=> (a.fetchTime>b.fetchTime)?1:-1).slice(0, 150)).map(o=>o.id);

    /** Refresh all required orders */
    const orderIds = [
        ...newOrders,
        ...updateOrders,
    ]

    console.log(`Refreshing Order Tag: ${newOrders.length} new, ${updateOrders.length} update`)
    console.log(orderIds)

    // console.dir()

    console.group('Tag Refreshing:');
    let batch = 5;
    const order_num = Math.min(orderIds.length, 1000);

    let ids = []
    let tasks = []
    for(let i = 0 ; i < order_num; i++) {
        ids.push(orderIds[i])
        await tasks.push(api_tags_invoke(orderIds[i]))

        if(tasks.length == batch || i + 1 == order_num) {
            // console.log(`gogo`)
            let task_batch = await Promise.all(tasks)

            for(let t = 0; t < task_batch.length; t++) {
                const data = {
                    fetchTime: Date.now(),
                    id: ids[t],
                    tags : task_batch[t]
                }
                // console.log(`write to ${CACHE_DIR}tags/${data.id}.json`)
                // console.log(data)
                fs.writeFileSync(`${CACHE_DIR}tags/${data.id}.json`, JSON.stringify(data, null, 2), function (err) {
                    if (err) throw err;
                });
            }
            ids = []
            tasks = []
        } else {
        }

        if((i + 1) % 25 == 0 || i+1 === order_num) {
            console.log(`Refresh Ticket Tag remote: ${i+1} / ${Math.min(orderIds.length, 100000)}`)
        }
    }
    console.groupEnd('Tag Refreshing:');
}



async function refreshTicketList() { 
    let orders = await api_list_invoke(); 
    console.log(`Remote Order List Length = ${orders.length}`)
    if(orders.length > 0) {
        fs.writeFileSync(`${CACHE_DIR}order_list.json`, JSON.stringify(orders.sort((a,b) => {return a.order_id - b.order_id}), null, 2), function (err) {
            if (err) throw err;
        });
    }

    return orders
}

async function readAndRefreshTicketDetail(){
    const orderList =  await ((f)=>{
        return new Promise((resolve) => {
            resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
        }).catch(err=>{
            console.log('JSON Parse error ' + err)
        })
    })(`${CACHE_DIR}order_list.json`)

    console.log(`${orderList.length}`)

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
                console.log(`${detail.id} not updated, skip...`)
                details[detail.id] = detail
                continue
            }
        }  

        console.log(`${orderList[i].order_id} needs a remote refreshing... `);
        const orderDetail = await api_detail_invoke(orderList[i].order_id)
        if(orderDetail) {
            fs.writeFileSync(`${CACHE_DIR}detail/${orderList[i].order_id}.json`, JSON.stringify(orderDetail, null, 2), function (err) {
                if (err) throw err;
            });
        }
        details[orderDetail.id] = orderDetail
    }   

    return details;
}

async function build_data_snapshot(orders, details) {
    console.log(`Construct data with Orders: ${orders.length}, Details: ${Object.keys(details).length}`)
    const orderDataList = []
    /** 0. Construct Data */
    for(let i = 0; i < orders.length; i++) {
        let orderData = {id: parseInt(orders[i].order_id)}

        // console.log(orders[i].order_id)

        const detail = details[orderData.id];
        // const orderTag = orderTags[orders[i].order_id]
        // if(!detail || !orderTag) {
        //     // continue;
        // }

        // Follower 
        orderData.follower = orders[i].employee_name

        // Create/Close Time
        orderData.create_time = new Date(parseInt(detail.create_time * 1000))
        
        orderData.update_time = detail.update_time

        let close_time = (orders[i].pending_time === "0") ?  detail.update_time : 0
        orderData.close_time  = new Date(parseInt(close_time * 1000))

        // Status
        orderData.status = (orders[i].pending_time === "0") ? "Open" : "Closed"

        // Category
        orderData.category_1_name = detail.category_1_name


        // 
        orderData.priority = "P1"
        orderData.tags = "Pending TSC"
        orderData.sub_tags = "Pending Client" 
        orderData.idle = 30

        // Region
        const regionLables = [
            'Region',
            'Country / Region',
            'Client Region',
            'Country/Region',
            'GBS Country/Region',
            "GBS Country / Region",
        ]

        console.log(detail)
        console.log(`details ${detail.id} ${detail.items}`)
        let region =  detail.items.filter(r => regionLables.includes(r.label)).pop().content;
        orderData.region = region || 'Unknown';

        // console.log(`order[].region = ${orders[i].region}`)

        // Advertiser / Client Name
        try{
            orders[i].client_name = detail.items.filter(r=> r.label.includes('Client Name') || r.label.includes('Advertiser name')).pop().content;
        } catch(err) {
            // console.log(detail)
            console.log(detail.id + " has no lable for client name")
            // throw err
        }

        // ADV_ID
        let adv_id = detail.items.filter(r=> r.label.includes('Ad Account ID')).pop().content.toString();
        orderData.adv_id = adv_id


        // Tags
        // try{
        //     orders[i].tags = ''
        //     orders[i].sub_tags = ''
        //     if(orderTag.tags) {
        //         orderTag.tags.forEach(t=> {
        //             orders[i].tags += (t.name) + "; "
        //             if(t.sub_tags[0]?.name) {
        //                 orders[i].sub_tags += t.sub_tags[0].name + "; "
        //             }
        //         })
        //     }
        // } catch(err) {
        //     console.log(`${orderTag}`)
        //     throw err
        // }

        const replies = detail.replies;
        // Case Notes Version 2
        if(replies) {
            let notes1 = '';
            let notes2 = '';
            let reviews1 = '';
            let reviews2 = '';
            const note_reg    = /(\[\[)(.*)(\]\])/m
            const note_reg2 = /(.*)(\[status update\])(.*)/i
            const review_reg  = /(\{\{)(.*)(\}\})/m

            for(let k = 0; k < replies.length; k++) {
                const reply = replies[k];
                const reply_time = (new Date(reply.create_time*1000)).toISOString().split('T')[0];
                const items = reply.items.filter(x => x.type == 6);

                for(let j = 0; j < items.length; j++) {
                    const item = items[j];
                    let note_matches = item.content.match(note_reg2);
                    if(note_matches) {
                        notes1 = notes2;
                        notes2 = `[${reply_time}]` + note_matches[3]
                    }
                    let review_matches = item.content.match(review_reg);
                    if(review_matches) {
                        reviews1 = reviews2
                        reviews2 = `[${reply_time}]` + review_matches[2]
                    }
                }
            }
            // console.log(`replacing all aaaa`)
            orders[i].notes = [notes1, notes2].map( 
                n => n
                .replace(/<p>/g,      "").replace(/<\/p>/g, "")
                .replace(/<ul>/g,     '').replace(/<\/ul>/g, '')
                .replace(/<br>/g,     '').replace(/<\/br>/g, '')
                .replace(/<li>/g,     '').replace(/<\/li>/g, '')
                .replace(/<ol>/g,     '').replace(/<\/ol>/g, '')
                .replace(/<strong>/g, '').replace(/<\/strong>/g, '')
                .replace(/<\/span>/g, '').replace(/(<span )(.*)(>)/g, ' ')
                .replace(/&gt;/g, ">")
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, '')
            )

            // orders[i].notes = [x, y]
            orderData.reviews = [reviews1, reviews2]

        } else {
            console.log('no replies')
        }

        orderDataList.push(orderData)
    }

    /** Save Constructed Data to Local File */
    console.log(`Generate Data Snapshot`)
    fs.writeFileSync(`${CACHE_DIR}snapshot.json`, JSON.stringify({ts: new Date(), orderDataList}, null, 2), function (err) {
        if (err) throw err;
    });
    
    /** 4 Return to caller */
    // console.log(orders[0])
    return orderDataList.reverse();
}

async function refreshTicketInfo(){
    {
        console.log(`Start Ticket Info Refreshing: ${new Date()}`)

        const now = Date.now();
        if(now - clock > 1000 * 60) {
            clock = now;
            console.log(`........... tik... tok... now is ${(new Date(now)).toISOString()}`)
        }
    }

    /** Refresh Ticket List */
    const orderList = await refreshTicketList();
    console.log(`refresh ticket length = ${orderList.length}`) 

    /** Refresh Ticket Detail */
    const details = await readAndRefreshTicketDetail()
    console.log(`refresh ticket detail = ${details.length}`) 



    /** Refresh Ticket Tags */
    // await refreshTicketTags();

    /** Generate DataSnapshot */
    await build_data_snapshot(orderList, details);

    console.log(`Ticket Info Refreshing Completed: ${Date.now()}`)
}

// refreshTicketList();
// refreshTicketDetail();
// build_data_snapshot();
// refreshTicketInfo()

module.exports = refreshTicketInfo