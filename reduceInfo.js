async function reduceDetail(order){
    if(order === null) return {}

    return order
}

async function reduceTag(order){
    if(order === null) return {}



    return order
}

async function reduceList(orderList) {
    if(orderList === null) return []

    let reducedOrderList = []
    for(let i = 0; i < orderList.length; i++) {
        let order = orderList[i]

        if(['itay.filiba@bytedance.com', 'jacob.lima@bytedance.com'].includes(order.employee_email)) {
            // skip TikTok Live 
        } else if(process.env.PLATFORM === 'FAAS') {
            reducedOrderList.push({
                order_id        : order.order_id,
                update_time     : order.update_time
            })
        } else { 
            if(["1784805", '1955640' ].includes(order.order_id)) {
                // Push Raw Order 
                reducedOrderList.push(order)
            } else {
                reducedOrderList.push( {
                    order_id: order.order_id,
                    update_time: order.update_time
                })
            }
        }
    }
    return reducedOrderList;
}



module.exports = {
    reduceList,
    reduceDetail,
    reduceTag
}